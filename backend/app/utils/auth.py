from datetime import datetime
from secrets import compare_digest

from flask import jsonify, request

from app.models import Odontologo, Sesion, db


def get_authenticated_user():
    """Devuelve el odontólogo autenticado a partir del token de sesión."""
    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return None

    token = authorization[7:].strip()
    if not token or len(token) > 255:
        return None

    sesion = Sesion.query.filter_by(token_sesion=token).first()
    if not sesion or not compare_digest(sesion.token_sesion, token):
        return None

    if not sesion.expira_en or sesion.expira_en <= datetime.now():
        return None

    odontologo = db.session.get(Odontologo, sesion.id_odontologo)
    if not odontologo or not odontologo.activo:
        return None

    return odontologo


def is_superadmin(user):
    return bool(user and user.rol == 'superadmin')


def is_admin(user):
    return bool(user and user.rol in ('admin', 'superadmin'))


def has_module(user, *paths):
    """La pertenencia clínica se comparte; los módulos limitan las acciones."""
    if not user:
        return False
    if is_admin(user):
        return True
    permissions = user.permisos if isinstance(user.permisos, list) else []
    return any(path in permissions for path in paths)


def require_module(*paths):
    user = get_authenticated_user()
    if not user:
        return None, (jsonify({'error': 'Debes iniciar sesión para continuar'}), 401)
    if paths and not has_module(user, *paths):
        return None, (jsonify({'error': 'No tienes permisos para esta operación'}), 403)
    return user, None


def can_edit_clinical(user, *modules):
    """El autor original no limita la colaboración; sí la sesión, rol y módulo."""
    return bool(user and user.activo and user.rol in ('odontologo', 'admin', 'superadmin')
                and modules and has_module(user, *modules))


def forbidden():
    return jsonify({'error': 'No tienes permisos sobre este recurso'}), 403
