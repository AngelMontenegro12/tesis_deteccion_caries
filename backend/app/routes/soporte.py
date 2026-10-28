from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, or_

from app.models import MensajeSoporte, Odontologo, db
from app.utils.auth import get_authenticated_user, is_superadmin

soporte_bp = Blueprint('soporte', __name__, url_prefix='/api/soporte')

TIPOS_VALIDOS = {'error', 'consulta', 'sugerencia'}


def _sesion_requerida():
    usuario = get_authenticated_user()
    if not usuario:
        return None, (jsonify({'status': 'error', 'message': 'Debes iniciar sesión para continuar.'}), 401)
    return usuario, None


def _superadmin_requerido():
    usuario, error = _sesion_requerida()
    if error:
        return None, error
    if not is_superadmin(usuario):
        return None, (jsonify({'status': 'error', 'message': 'Esta sección es exclusiva del superadministrador.'}), 403)
    return usuario, None


@soporte_bp.route('/mensajes', methods=['POST'])
def crear_mensaje():
    usuario, error = _sesion_requerida()
    if error:
        return error

    data = request.get_json(silent=True) or {}

    tipo = (data.get('tipo') or 'consulta').strip().lower()
    if tipo not in TIPOS_VALIDOS:
        return jsonify({'status': 'error', 'message': 'El tipo de mensaje no es válido.'}), 400

    asunto = (data.get('asunto') or '').strip()
    descripcion = (data.get('descripcion') or '').strip()

    if len(asunto) < 5:
        return jsonify({'status': 'error', 'message': 'El asunto debe tener al menos 5 caracteres.'}), 400
    if len(asunto) > 150:
        return jsonify({'status': 'error', 'message': 'El asunto no puede superar los 150 caracteres.'}), 400
    if len(descripcion) < 10:
        return jsonify({'status': 'error', 'message': 'La descripción debe tener al menos 10 caracteres.'}), 400

    pagina_origen = (data.get('pagina_origen') or '').strip()[:255] or None

    mensaje = MensajeSoporte(
        id_odontologo=usuario.id_odontologo,
        tipo=tipo,
        asunto=asunto,
        descripcion=descripcion,
        pagina_origen=pagina_origen
    )

    try:
        db.session.add(mensaje)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Mensaje registrado. El administrador lo revisará.',
            'data': mensaje.to_dict()
        }), 201
    except Exception as error_db:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error_db)}), 500


@soporte_bp.route('/mensajes', methods=['GET'])
def listar_mensajes():
    _, error = _superadmin_requerido()
    if error:
        return error

    busqueda = (request.args.get('q') or '').strip()
    tipo = (request.args.get('tipo') or '').strip().lower()
    filtro = (request.args.get('filtro') or 'todos').strip().lower()

    query = MensajeSoporte.query.join(Odontologo)

    if busqueda:
        patron = f'%{busqueda}%'
        query = query.filter(
            or_(
                MensajeSoporte.asunto.ilike(patron),
                MensajeSoporte.descripcion.ilike(patron),
                Odontologo.nombres.ilike(patron),
                Odontologo.apellidos.ilike(patron),
                Odontologo.correo.ilike(patron)
            )
        )

    if tipo in TIPOS_VALIDOS:
        query = query.filter(MensajeSoporte.tipo == tipo)

    if filtro == 'sin_responder':
        query = query.filter(MensajeSoporte.respuesta.is_(None))
    elif filtro == 'respondidos':
        query = query.filter(MensajeSoporte.respuesta.is_not(None))

    mensajes = query.order_by(desc(MensajeSoporte.creado_en)).all()
    data = [mensaje.to_dict() for mensaje in mensajes]

    return jsonify({
        'status': 'success',
        'data': data,
        'resumen': {
            'total': len(data),
            'sin_responder': sum(1 for mensaje in data if not mensaje['respondido']),
            'respondidos': sum(1 for mensaje in data if mensaje['respondido'])
        }
    }), 200


@soporte_bp.route('/mis-mensajes', methods=['GET'])
def listar_mis_mensajes():
    usuario, error = _sesion_requerida()
    if error:
        return error

    mensajes = MensajeSoporte.query.filter_by(
        id_odontologo=usuario.id_odontologo
    ).order_by(desc(MensajeSoporte.creado_en)).all()

    data = [mensaje.to_dict() for mensaje in mensajes]
    return jsonify({
        'status': 'success',
        'data': data,
        'resumen': {
            'total': len(data),
            'sin_responder': sum(1 for mensaje in data if not mensaje['respondido']),
            'respondidos': sum(1 for mensaje in data if mensaje['respondido'])
        }
    }), 200


@soporte_bp.route('/mensajes/<int:id_mensaje>/respuesta', methods=['PATCH'])
def responder_mensaje(id_mensaje):
    usuario, error = _superadmin_requerido()
    if error:
        return error

    mensaje = MensajeSoporte.query.get(id_mensaje)
    if not mensaje:
        return jsonify({'status': 'error', 'message': 'Mensaje de soporte no encontrado.'}), 404

    data = request.get_json(silent=True) or {}
    respuesta = (data.get('respuesta') or '').strip()
    if not respuesta:
        return jsonify({'status': 'error', 'message': 'La respuesta no puede estar vacía.'}), 400

    try:
        mensaje.respuesta = respuesta
        mensaje.respondido_en = datetime.now()
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Respuesta guardada correctamente.',
            'data': mensaje.to_dict()
        }), 200
    except Exception as error_db:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error_db)}), 500


@soporte_bp.route('/mensajes/sin-responder/count', methods=['GET'])
def contar_sin_responder():
    _, error = _superadmin_requerido()
    if error:
        return error

    total = MensajeSoporte.query.filter(MensajeSoporte.respuesta.is_(None)).count()
    return jsonify({'status': 'success', 'total': total}), 200
