from flask import Blueprint, request, jsonify
from app.models import Odontologo
from app import db
import bcrypt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('correo') or not data.get('contrasena'):
        return jsonify({'error': 'Correo y contraseña son requeridos'}), 400
        
    odontologo = Odontologo.query.filter_by(correo=data['correo'], activo=True).first()
    
    if not odontologo:
        return jsonify({'error': 'Usuario no encontrado o inactivo'}), 404
        
    contrasena_ingresada = data['contrasena']
    contrasena_bd = odontologo.contrasena_hash
    
    es_valida = False
    
    # Soporte para la contraseña original encriptada con Bcrypt del SQL
    if contrasena_bd.startswith('\\$'):
        try:
            es_valida = bcrypt.checkpw(contrasena_ingresada.encode('utf-8'), contrasena_bd.encode('utf-8'))
        except Exception:
            pass
            
    # Si pediste q "por ahora no esten encriptadas", quiza pusiste el varchar plano en la BD.
    if not es_valida:
        if contrasena_bd == contrasena_ingresada:
            es_valida = True
            
    if es_valida:
        return jsonify({
            'message': 'Login exitoso',
            'user': odontologo.to_dict()
        }), 200
    else:
        return jsonify({'error': 'Contraseña incorrecta'}), 401
