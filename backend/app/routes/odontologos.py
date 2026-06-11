from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func
from app.models import Odontologo, db
import bcrypt
import os
from werkzeug.utils import secure_filename
odontologos_bp = Blueprint('odontologos', __name__, url_prefix='/api/odontologos')


def _normalizar_booleano(valor, default=True):
    if valor is None:
        return default
    if isinstance(valor, bool):
        return valor
    if isinstance(valor, (int, float)):
        return bool(valor)
    if isinstance(valor, str):
        return valor.strip().lower() in {'1', 'true', 'si', 'sí', 'activo', 'activa'}
    return default


@odontologos_bp.route('', methods=['GET'])
def listar_odontologos():
    try:
        incluir_inactivos = request.args.get('incluir_inactivos', 'false').lower() == 'true'
        busqueda = request.args.get('q', '').strip()

        query = Odontologo.query

        if not incluir_inactivos:
            query = query.filter_by(activo=True)

        if busqueda:
            patron = f'%{busqueda}%'
            query = query.filter(
                or_(
                    Odontologo.nombres.ilike(patron),
                    Odontologo.apellidos.ilike(patron),
                    func.concat(Odontologo.nombres, ' ', Odontologo.apellidos).ilike(patron),
                    Odontologo.correo.ilike(patron),
                    Odontologo.colegiatura.ilike(patron),
                    Odontologo.especialidad.ilike(patron)
                )
            )

        odontologos = query.order_by(Odontologo.apellidos.asc(), Odontologo.nombres.asc()).all()
        return jsonify({
            'status': 'success',
            'data': [odontologo.to_dict() | {'activo': odontologo.activo} for odontologo in odontologos]
        }), 200
    except Exception as error:
        return jsonify({'status': 'error', 'message': str(error)}), 500


@odontologos_bp.route('/<int:id_odontologo>', methods=['GET'])
def obtener_odontologo(id_odontologo):
    odontologo = Odontologo.query.get(id_odontologo)
    if not odontologo:
        return jsonify({'status': 'error', 'message': 'Odontólogo no encontrado'}), 404

    return jsonify({'status': 'success', 'data': odontologo.to_dict() | {'activo': odontologo.activo}}), 200


@odontologos_bp.route('', methods=['POST'])
def crear_odontologo():
    data = request.get_json(silent=True) or {}

    requeridos = ['nombres', 'apellidos', 'correo', 'contrasena']
    faltantes = [campo for campo in requeridos if not data.get(campo)]
    if faltantes:
        return jsonify({'status': 'error', 'message': f'Faltan campos requeridos: {", ".join(faltantes)}'}), 400

    correo = data['correo'].strip().lower()
    existente = Odontologo.query.filter_by(correo=correo).first()
    if existente:
        return jsonify({'status': 'error', 'message': 'Ya existe un odontólogo con ese correo'}), 409

    contrasena = data['contrasena'].encode('utf-8')
    hash_contrasena = bcrypt.hashpw(contrasena, bcrypt.gensalt()).decode('utf-8')

    odontologo = Odontologo(
        nombres=data['nombres'].strip(),
        apellidos=data['apellidos'].strip(),
        correo=correo,
        contrasena_hash=hash_contrasena,
        colegiatura=(data.get('colegiatura') or '').strip() or None,
        especialidad=(data.get('especialidad') or '').strip() or None,
        telefono=(data.get('telefono') or '').strip() or None,
        activo=_normalizar_booleano(data.get('activo'), True)
    )

    try:
        db.session.add(odontologo)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Odontólogo creado correctamente', 'data': odontologo.to_dict() | {'activo': odontologo.activo}}), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 400


@odontologos_bp.route('/<int:id_odontologo>', methods=['PUT'])
def actualizar_odontologo(id_odontologo):
    data = request.get_json(silent=True) or {}
    odontologo = Odontologo.query.get(id_odontologo)
    if not odontologo:
        return jsonify({'status': 'error', 'message': 'Odontólogo no encontrado'}), 404

    correo = data.get('correo')
    if correo:
        correo_normalizado = correo.strip().lower()
        duplicado = Odontologo.query.filter(Odontologo.correo == correo_normalizado, Odontologo.id_odontologo != id_odontologo).first()
        if duplicado:
            return jsonify({'status': 'error', 'message': 'Ya existe otro odontólogo con ese correo'}), 409
        odontologo.correo = correo_normalizado

    if 'nombres' in data and data['nombres']:
        odontologo.nombres = data['nombres'].strip()
    if 'apellidos' in data and data['apellidos']:
        odontologo.apellidos = data['apellidos'].strip()
    if 'colegiatura' in data:
        odontologo.colegiatura = (data.get('colegiatura') or '').strip() or None
    if 'especialidad' in data:
        odontologo.especialidad = (data.get('especialidad') or '').strip() or None
    if 'telefono' in data:
        odontologo.telefono = (data.get('telefono') or '').strip() or None
    
    mensaje_exito = 'Odontólogo actualizado correctamente'
    
    if 'rol' in data:
        nuevo_rol = (data.get('rol') or 'odontologo').strip()
        id_solicitante = data.get('id_solicitante')
        
        # Si un admin normal intenta cambiar el rol de alguien (ascender o descender), se crea una solicitud
        if nuevo_rol != odontologo.rol and id_solicitante and int(id_solicitante) != 1:
            from app.models import SolicitudRol
            # Verificar si ya hay una solicitud pendiente
            solicitud_existente = SolicitudRol.query.filter_by(
                id_odontologo_objetivo=id_odontologo,
                estado='pendiente'
            ).first()
            
            if solicitud_existente:
                return jsonify({
                    'status': 'warning',
                    'message': 'Ya existe una solicitud de rol pendiente para este usuario. Debes esperar a que el Admin. Principal la apruebe o rechace antes de crear otra.'
                }), 200

            nueva_solicitud = SolicitudRol(
                id_solicitante=int(id_solicitante),
                id_odontologo_objetivo=id_odontologo,
                estado='pendiente'
            )
            db.session.add(nueva_solicitud)
            mensaje_exito = f'Permisos actualizados. La solicitud de cambio de rol a {nuevo_rol.capitalize()} fue enviada al Admin. Principal.'
        else:
            odontologo.rol = nuevo_rol
            
    if 'permisos' in data:
        odontologo.permisos = data.get('permisos')
    if 'activo' in data:
        odontologo.activo = _normalizar_booleano(data.get('activo'), odontologo.activo)
    if data.get('contrasena'):
        odontologo.contrasena_hash = data['contrasena']
    try:
        db.session.commit()
        return jsonify({'status': 'success', 'message': mensaje_exito, 'data': odontologo.to_dict() | {'activo': odontologo.activo}}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 400


@odontologos_bp.route('/<int:id_odontologo>/estado', methods=['PATCH'])
def cambiar_estado_odontologo(id_odontologo):
    data = request.get_json(silent=True) or {}
    odontologo = Odontologo.query.get(id_odontologo)
    if not odontologo:
        return jsonify({'status': 'error', 'message': 'Odontólogo no encontrado'}), 404

    if 'activo' not in data:
        return jsonify({'status': 'error', 'message': 'Debe indicar el nuevo estado'}), 400

    odontologo.activo = _normalizar_booleano(data.get('activo'), odontologo.activo)

    try:
        db.session.commit()
        mensaje = 'Odontólogo activado' if odontologo.activo else 'Odontólogo desactivado'
        return jsonify({'status': 'success', 'message': mensaje, 'data': odontologo.to_dict() | {'activo': odontologo.activo}}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 400


@odontologos_bp.route('/<int:id_odontologo>/password', methods=['PUT'])
def cambiar_password(id_odontologo):
    data = request.get_json(silent=True) or {}
    odontologo = Odontologo.query.get(id_odontologo)
    if not odontologo:
        return jsonify({'status': 'error', 'message': 'Odontólogo no encontrado'}), 404

    actual = data.get('contrasena_actual')
    nueva = data.get('nueva_contrasena')

    if not actual or not nueva:
        return jsonify({'status': 'error', 'message': 'Debe proporcionar la contraseña actual y la nueva'}), 400

    if actual != odontologo.contrasena_hash:
        return jsonify({'status': 'error', 'message': 'La contraseña actual es incorrecta'}), 401

    odontologo.contrasena_hash = nueva

    try:
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Contraseña actualizada correctamente'}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 400


@odontologos_bp.route('/<int:id_odontologo>/avatar', methods=['POST'])
def actualizar_avatar(id_odontologo):
    odontologo = Odontologo.query.get(id_odontologo)
    if not odontologo:
        return jsonify({'status': 'error', 'message': 'Odontólogo no encontrado'}), 404

    if 'foto' not in request.files:
        return jsonify({'status': 'error', 'message': 'No se encontró la imagen'}), 400

    file = request.files['foto']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No se seleccionó una imagen'}), 400

    try:
        filename = secure_filename(f"avatar_{id_odontologo}.png")
        upload_folder = os.path.join(os.getcwd(), 'uploads', 'avatars')
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        
        file.save(filepath)
        
        # Ruta relativa para la bd
        ruta_relativa = f"/uploads/avatars/{filename}"
        odontologo.foto_perfil = ruta_relativa
        db.session.commit()

        return jsonify({'status': 'success', 'message': 'Avatar actualizado', 'foto_perfil': ruta_relativa}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500