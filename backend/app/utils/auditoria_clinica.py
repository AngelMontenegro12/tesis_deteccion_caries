from app.models import AuditoriaClinica, db


def registrar_operacion(user, recurso, id_recurso, accion, campos=(), motivo=None):
    """Se confirma junto al cambio; no guarda valores clínicos ni credenciales."""
    db.session.add(AuditoriaClinica(
        id_actor=user.id_odontologo, recurso=recurso, id_recurso=id_recurso,
        accion=accion, campos=sorted(set(campos)), motivo=motivo,
    ))
