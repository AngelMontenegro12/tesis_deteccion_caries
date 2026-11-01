from types import SimpleNamespace
from datetime import date

from app.models import IdentidadExpediente, db


CAMPOS_IDENTIDAD = ('nombres', 'apellidos', 'dni', 'fecha_nacimiento', 'genero', 'apoderado')


def normalizar(valor):
    return str(valor).strip() if valor is not None else ''


def capturar_identidad(evaluacion, paciente, user, origen):
    """Solo inserta: una instantánea existente nunca se sustituye al rectificar."""
    identidad = db.session.get(IdentidadExpediente, evaluacion.id_evaluacion)
    if identidad is None:
        datos = {campo: getattr(paciente, campo) for campo in CAMPOS_IDENTIDAD}
        datos['fecha_nacimiento'] = str(paciente.fecha_nacimiento)
        datos['edad'] = paciente.edad
        identidad = IdentidadExpediente(id_evaluacion=evaluacion.id_evaluacion,
                    identidad=datos, origen=origen, id_actor=user.id_odontologo)
        db.session.add(identidad)
    return identidad


def datos_expediente(evaluacion, paciente):
    datos = paciente.to_dict()
    identidad = db.session.get(IdentidadExpediente, evaluacion.id_evaluacion)
    if identidad:
        datos.update(identidad.identidad)
    return datos


def paciente_expediente(evaluacion, paciente):
    datos = datos_expediente(evaluacion, paciente)
    if datos.get('fecha_nacimiento'):
        datos['fecha_nacimiento'] = date.fromisoformat(datos['fecha_nacimiento'])
    return SimpleNamespace(**datos)
