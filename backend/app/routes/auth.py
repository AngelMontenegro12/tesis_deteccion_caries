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
