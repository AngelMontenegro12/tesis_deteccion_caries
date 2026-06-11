from flask import Blueprint, request, jsonify
from app.models import Odontologo
from app import db
import bcrypt
import time

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Diccionario en memoria para rastrear intentos fallidos y evitar ataques de fuerza bruta
intentos_login = {}
MAX_INTENTOS = 5
TIEMPO_BLOQUEO = 300  # 5 minutos de bloqueo en segundos

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
    
    es_valida = False
    
    if contrasena_bd.startswith('\\$'):
        try:
            es_valida = bcrypt.checkpw(contrasena_ingresada.encode('utf-8'), contrasena_bd.encode('utf-8'))
        except Exception:
            pass
            
    if not es_valida:
        if contrasena_bd == contrasena_ingresada:
            es_valida = True
            
    if es_valida:
        # Login exitoso: Resetear los intentos de esta IP
        intentos_login[ip] = {'intentos': 0, 'bloqueado_hasta': None}
        
        return jsonify({
            'message': 'Login exitoso',
            'user': odontologo.to_dict()
        }), 200
    else:
        # Registrar intento fallido
        intentos_login[ip]['intentos'] += 1
        if intentos_login[ip]['intentos'] >= MAX_INTENTOS:
            intentos_login[ip]['bloqueado_hasta'] = time.time() + TIEMPO_BLOQUEO
            return jsonify({'error': 'Demasiados intentos fallidos. Intente de nuevo más tarde.'}), 429
        return jsonify({'error': 'Credenciales incorrectas'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    correo = data.get('correo')
    if not correo:
        return jsonify({'error': 'Correo es requerido'}), 400
        
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
    
    return jsonify({'status': 'created', 'message': 'Solicitud enviada exitosamente. Un administrador la revisará en breve.'}), 201

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    correo = data.get('correo')
    nueva_contrasena = data.get('nueva_contrasena')
    
    if not correo or not nueva_contrasena:
        return jsonify({'error': 'Faltan datos'}), 400
        
    odontologo = Odontologo.query.filter_by(correo=correo).first()
    if not odontologo:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    from app.models import SolicitudPassword
    
    solicitud = SolicitudPassword.query.filter_by(id_odontologo=odontologo.id_odontologo, estado='aprobada').first()
    if not solicitud:
        return jsonify({'error': 'No tienes una solicitud aprobada para restablecer tu contraseña'}), 403
        
    # Actualizar la contraseña (la guardamos en hash o en texto plano si no se usa bcrypt)
    # Según la lógica existente, a veces se guardan en texto plano en este sistema. Vamos a guardar en texto plano para compatibilidad o hashear
    # Wait, the system says if it starts with '$', it's hashed, otherwise it's plain text. We will just save it plain text to match whatever they are doing, or hash it. Let's not hash it to keep it simple, or hash it if they prefer. The user mentioned previously: "por ahora quiero que todo lo hagas sin encriptacion"
    odontologo.contrasena_hash = nueva_contrasena
    solicitud.estado = 'completada'
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Contraseña actualizada exitosamente'}), 200

