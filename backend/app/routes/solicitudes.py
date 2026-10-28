from flask import Blueprint, jsonify
from app.models import SolicitudRol, SolicitudPassword, Odontologo, db
from app.utils.auth import get_authenticated_user

solicitudes_bp = Blueprint('solicitudes', __name__, url_prefix='/api/solicitudes')


def _puede_gestionar_solicitudes():
    usuario = get_authenticated_user()
    return bool(usuario and (usuario.id_odontologo == 1 or usuario.rol == 'superadmin'))


@solicitudes_bp.route('', methods=['GET'])
def listar_solicitudes():
    if not _puede_gestionar_solicitudes():
        return jsonify({'status': 'error', 'message': 'Esta sección es exclusiva del administrador principal.'}), 403

    try:
        sol_roles = SolicitudRol.query.all()
        sol_passwords = SolicitudPassword.query.all()
        
        # Combinar ambas listas
        combinadas = [s.to_dict() for s in sol_roles] + [p.to_dict() for p in sol_passwords]
        
        # Ordenar por fecha descendente
        combinadas.sort(key=lambda x: x['fecha_solicitud'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'data': combinadas
        }), 200
    except Exception as error:
        return jsonify({'status': 'error', 'message': str(error)}), 500

@solicitudes_bp.route('/<id_solicitud>/aprobar', methods=['POST'])
def aprobar_solicitud(id_solicitud):
    if not _puede_gestionar_solicitudes():
        return jsonify({'status': 'error', 'message': 'Esta sección es exclusiva del administrador principal.'}), 403

    try:
        if str(id_solicitud).startswith('pwd_'):
            real_id = int(str(id_solicitud).replace('pwd_', ''))
            solicitud = SolicitudPassword.query.get(real_id)
            if not solicitud:
                return jsonify({'status': 'error', 'message': 'Solicitud no encontrada'}), 404
            if solicitud.estado != 'pendiente':
                return jsonify({'status': 'error', 'message': 'La solicitud ya fue procesada'}), 400
            
            solicitud.estado = 'aprobada'
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Solicitud de restablecimiento de contraseña aprobada'}), 200
        else:
            solicitud = SolicitudRol.query.get(int(id_solicitud))
            if not solicitud:
                return jsonify({'status': 'error', 'message': 'Solicitud no encontrada'}), 404
            if solicitud.estado != 'pendiente':
                return jsonify({'status': 'error', 'message': 'La solicitud ya fue procesada'}), 400

            solicitud.estado = 'aprobada'
            odontologo = Odontologo.query.get(solicitud.id_odontologo_objetivo)
            if odontologo:
                if odontologo.rol == 'odontologo':
                    odontologo.rol = 'admin'
                elif odontologo.rol == 'admin':
                    odontologo.rol = 'odontologo'
                
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Solicitud aprobada y rol actualizado'}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 500

@solicitudes_bp.route('/<id_solicitud>/rechazar', methods=['POST'])
def rechazar_solicitud(id_solicitud):
    if not _puede_gestionar_solicitudes():
        return jsonify({'status': 'error', 'message': 'Esta sección es exclusiva del administrador principal.'}), 403

    try:
        if str(id_solicitud).startswith('pwd_'):
            real_id = int(str(id_solicitud).replace('pwd_', ''))
            solicitud = SolicitudPassword.query.get(real_id)
            if not solicitud:
                return jsonify({'status': 'error', 'message': 'Solicitud no encontrada'}), 404
            if solicitud.estado != 'pendiente':
                return jsonify({'status': 'error', 'message': 'La solicitud ya fue procesada'}), 400
                
            solicitud.estado = 'rechazada'
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Solicitud rechazada'}), 200
        else:
            solicitud = SolicitudRol.query.get(int(id_solicitud))
            if not solicitud:
                return jsonify({'status': 'error', 'message': 'Solicitud no encontrada'}), 404
            if solicitud.estado != 'pendiente':
                return jsonify({'status': 'error', 'message': 'La solicitud ya fue procesada'}), 400

            solicitud.estado = 'rechazada'
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Solicitud rechazada'}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(error)}), 500
