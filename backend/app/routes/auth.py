from flask import Blueprint, request, jsonify
from app.models import Odontologo, HistorialAcceso, Sesion
from app import db
from app.utils.security import hash_password, verify_password
from app.utils.validation import valid_email
from datetime import datetime, timedelta
import secrets
import time

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Diccionario en memoria para rastrear intentos fallidos y evitar ataques de fuerza bruta
intentos_login = {}
MAX_INTENTOS = 5
TIEMPO_BLOQUEO = 300  # 5 minutos de bloqueo en segundos

# Duración de las sesiones activas registradas en la base de datos
DURACION_SESION_HORAS = 24


def _obtener_dispositivo():
    user_agent = request.headers.get('User-Agent') or 'Desconocido'
    return user_agent[:200]


def _registrar_acceso(id_odontologo, tipo_evento, descripcion=None, ip=None):
    """Guarda un evento de auditoría sin interrumpir el flujo principal."""
    if not id_odontologo:
        return False
    try:
        registro = HistorialAcceso(
            id_odontologo=id_odontologo,
            tipo_evento=tipo_evento,
            ip_acceso=ip or request.remote_addr,
            descripcion=descripcion
        )
        db.session.add(registro)
        db.session.commit()
        return True
    except Exception:
        db.session.rollback()
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    ip = request.remote_addr
    tiempo_actual = time.time()
    
    # 1. Verificar si la IP ya se encuentra bloqueada
    if ip in intentos_login:
        registro = intentos_login[ip]
        if registro['bloqueado_hasta'] and tiempo_actual < registro['bloqueado_hasta']:
            minutos_restantes = int((registro['bloqueado_hasta'] - tiempo_actual) / 60) + 1
            return jsonify({'error': f'Demasiados intentos fallidos. Intente de nuevo en {minutos_restantes} minuto(s).'}), 429
        elif registro['bloqueado_hasta'] and tiempo_actual >= registro['bloqueado_hasta']:
            # El tiempo de bloqueo ya pasó, reseteamos a 0
            intentos_login[ip] = {'intentos': 0, 'bloqueado_hasta': None}
    else:
        intentos_login[ip] = {'intentos': 0, 'bloqueado_hasta': None}

    data = request.get_json()
    
    if not data or not data.get('correo') or not data.get('contrasena'):
        return jsonify({'error': 'Correo y contraseña son requeridos'}), 400
    if not valid_email(data['correo']):
        return jsonify({'error': 'Ingrese un correo electrónico válido'}), 400
        
    odontologo = Odontologo.query.filter_by(correo=data['correo'], activo=True).first()
    
    if not odontologo:
        # Registrar intento fallido
        intentos_login[ip]['intentos'] += 1
        if intentos_login[ip]['intentos'] >= MAX_INTENTOS:
            intentos_login[ip]['bloqueado_hasta'] = time.time() + TIEMPO_BLOQUEO
            return jsonify({'error': 'Demasiados intentos fallidos. Intente de nuevo más tarde.'}), 429
            
        return jsonify({'error': 'Credenciales incorrectas o usuario inactivo'}), 401
        
    contrasena_ingresada = data['contrasena']
    contrasena_bd = odontologo.contrasena_hash

    es_valida = verify_password(contrasena_ingresada, contrasena_bd)
            
    if es_valida:
        # Login exitoso: Resetear los intentos de esta IP
        intentos_login[ip] = {'intentos': 0, 'bloqueado_hasta': None}

        # Crear la sesión activa y registrar el acceso
        token = secrets.token_urlsafe(48)
        expiracion = datetime.now() + timedelta(hours=DURACION_SESION_HORAS)
        sesion = Sesion(
            id_odontologo=odontologo.id_odontologo,
            token_sesion=token,
            ip_acceso=ip,
            dispositivo=_obtener_dispositivo(),
            expira_en=expiracion
        )
        acceso = HistorialAcceso(
            id_odontologo=odontologo.id_odontologo,
            tipo_evento='login',
            ip_acceso=ip,
            descripcion='Inicio de sesión exitoso'
        )
        try:
            db.session.add(sesion)
            db.session.add(acceso)
            db.session.commit()
        except Exception:
            db.session.rollback()

        user_data = odontologo.to_dict()
        user_data['token'] = token

        return jsonify({
            'message': 'Login exitoso',
            'user': user_data,
            'token': token
        }), 200
    else:
        # Registrar intento fallido (auditoría) y en memoria para el bloqueo por IP
        _registrar_acceso(odontologo.id_odontologo, 'login_fallido', 'Contraseña incorrecta', ip)
        intentos_login[ip]['intentos'] += 1
        if intentos_login[ip]['intentos'] >= MAX_INTENTOS:
            intentos_login[ip]['bloqueado_hasta'] = time.time() + TIEMPO_BLOQUEO
            return jsonify({'error': 'Demasiados intentos fallidos. Intente de nuevo más tarde.'}), 429
        return jsonify({'error': 'Credenciales incorrectas'}), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    data = request.get_json(silent=True) or {}
    token = data.get('token')
    id_odontologo = data.get('id_odontologo')

    # Cerrar la sesión asociada al token, si existe
    if token:
        sesion = Sesion.query.filter_by(token_sesion=token).first()
        if sesion:
            id_odontologo = sesion.id_odontologo
            try:
                db.session.delete(sesion)
                db.session.commit()
            except Exception:
                db.session.rollback()

    _registrar_acceso(id_odontologo, 'logout', 'Cierre de sesión')

    return jsonify({'status': 'success', 'message': 'Sesión cerrada correctamente'}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    correo = data.get('correo')
    if not valid_email(correo):
        return jsonify({'error': 'Ingrese un correo electrónico válido'}), 400
        
    odontologo = Odontologo.query.filter_by(correo=correo, activo=True).first()
    if not odontologo:
        return jsonify({'error': 'El correo ingresado no está registrado o el usuario está inactivo'}), 404
        
    from app.models import SolicitudPassword
    
    # Buscar si hay alguna solicitud
    solicitud = SolicitudPassword.query.filter_by(id_odontologo=odontologo.id_odontologo).order_by(SolicitudPassword.fecha_solicitud.desc()).first()
    
    if solicitud:
        if solicitud.estado == 'pendiente':
            return jsonify({'status': 'pending', 'message': 'Ya tienes una solicitud de restablecimiento pendiente de aprobación.'}), 200
        elif solicitud.estado == 'aprobada':
            return jsonify({'status': 'approved', 'message': 'Tu solicitud ha sido aprobada. Procede a cambiar tu contraseña.'}), 200
            
    # Si no hay solicitud, o la última fue completada/rechazada, crear una nueva
    nueva_solicitud = SolicitudPassword(id_odontologo=odontologo.id_odontologo)
    db.session.add(nueva_solicitud)
    db.session.commit()

    _registrar_acceso(
        odontologo.id_odontologo,
        'recuperacion_pass',
        'Solicitud de restablecimiento de contraseña creada'
    )

    return jsonify({'status': 'created', 'message': 'Solicitud enviada exitosamente. Un administrador la revisará en breve.'}), 201

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    correo = data.get('correo')
    nueva_contrasena = data.get('nueva_contrasena')
    
    if not correo or not nueva_contrasena:
        return jsonify({'error': 'Faltan datos'}), 400
    if not valid_email(correo):
        return jsonify({'error': 'Ingrese un correo electrónico válido'}), 400
    if len(str(nueva_contrasena).strip()) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400
        
    odontologo = Odontologo.query.filter_by(correo=correo).first()
    if not odontologo:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    from app.models import SolicitudPassword
    
    solicitud = SolicitudPassword.query.filter_by(id_odontologo=odontologo.id_odontologo, estado='aprobada').first()
    if not solicitud:
        return jsonify({'error': 'No tienes una solicitud aprobada para restablecer tu contraseña'}), 403
        
    odontologo.contrasena_hash = hash_password(nueva_contrasena)
    solicitud.estado = 'completada'
    
    db.session.commit()

    _registrar_acceso(
        odontologo.id_odontologo,
        'recuperacion_pass',
        'Contraseña restablecida'
    )

    return jsonify({'status': 'success', 'message': 'Contraseña actualizada exitosamente'}), 200
