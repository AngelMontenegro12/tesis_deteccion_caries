from datetime import datetime

from flask import request

from app.models import Odontologo, Sesion


def get_authenticated_user():
    """Devuelve el odontólogo autenticado a partir del token de sesión."""
    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return None

    token = authorization[7:].strip()
    if not token:
        return None

    sesion = Sesion.query.filter_by(token_sesion=token).first()
    if not sesion:
        return None

    if sesion.expira_en and sesion.expira_en < datetime.now():
        return None

    odontologo = Odontologo.query.get(sesion.id_odontologo)
    if not odontologo or not odontologo.activo:
        return None

    return odontologo


def is_superadmin(user):
    return bool(user and user.rol == 'superadmin')
