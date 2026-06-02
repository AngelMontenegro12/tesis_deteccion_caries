from flask import Blueprint, jsonify, request
from sqlalchemy import case, distinct, func, or_
from app.models import db, DeteccionesCaries, EvaluacionDiagnostica, Paciente, ResultadosDeteccion, Radiografia, Odontologo

reportes_bp = Blueprint('reportes', __name__, url_prefix='/api/reportes')


def _base_query_resultados(id_odontologo):
    return db.session.query(ResultadosDeteccion).join(
        Radiografia, ResultadosDeteccion.id_radiografia == Radiografia.id_radiografia
    ).join(
        EvaluacionDiagnostica, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion
    ).filter(
        EvaluacionDiagnostica.id_odontologo == id_odontologo
    )


def _base_query_detecciones(id_odontologo):
    return db.session.query(DeteccionesCaries).join(
        ResultadosDeteccion, DeteccionesCaries.id_resultado == ResultadosDeteccion.id_resultado
    ).join(
        Radiografia, ResultadosDeteccion.id_radiografia == Radiografia.id_radiografia
    ).join(
        EvaluacionDiagnostica, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion
    ).join(
        Paciente, EvaluacionDiagnostica.id_paciente == Paciente.id_paciente
    ).filter(
        EvaluacionDiagnostica.id_odontologo == id_odontologo,
        DeteccionesCaries.severidad.isnot(None)
    )


@reportes_bp.route('/ia-rendimiento', methods=['GET'])
def reporte_ia_rendimiento():
    try:
        id_odontologo = request.args.get('id_odontologo', 1, type=int)

        total_resultados = _base_query_resultados(id_odontologo).with_entities(
            func.count(ResultadosDeteccion.id_resultado)
        ).scalar() or 0

        confianza_media = _base_query_resultados(id_odontologo).with_entities(
            func.avg(ResultadosDeteccion.confianza_global)
        ).filter(
            ResultadosDeteccion.confianza_global > 0
        ).scalar() or 0

        resultados_rechazados = _base_query_resultados(id_odontologo).with_entities(
            func.count(ResultadosDeteccion.id_resultado)
        ).filter(
            or_(
                ResultadosDeteccion.error_descripcion.isnot(None),
                func.coalesce(ResultadosDeteccion.confianza_global, 0) <= 0
            )
        ).scalar() or 0

        resultados_validos = max(int(total_resultados) - int(resultados_rechazados), 0)
        tasa_rechazo = (float(resultados_rechazados) / float(total_resultados) * 100.0) if total_resultados else 0.0
        aceptacion_clinica = 100.0 - tasa_rechazo if total_resultados else 0.0

        return jsonify({
            'status': 'success',
            'data': {
                'id_report': 'ia_rendimiento',
                'titulo': 'Precisión y Rendimiento de IA',
                'total_resultados': int(total_resultados),
                'resultados_validos': resultados_validos,
                'resultados_rechazados': int(resultados_rechazados),
                'confianza_media_validos': round(float(confianza_media), 4),
                'tasa_rechazo_filtro': round(tasa_rechazo, 2),
                'aceptacion_clinica': round(aceptacion_clinica, 2)
            }
        }), 200
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': str(error)
        }), 500


@reportes_bp.route('/epidemiologico-caries', methods=['GET'])
def reporte_epidemiologico_caries():
    try:
        id_odontologo = request.args.get('id_odontologo', 1, type=int)

        base_detecciones = _base_query_detecciones(id_odontologo)

        total_lesiones = base_detecciones.with_entities(
            func.count(DeteccionesCaries.id_deteccion)
        ).scalar() or 0

        pacientes_evaluados = base_detecciones.with_entities(
            func.count(distinct(Paciente.id_paciente))
        ).scalar() or 0

        promedio_por_paciente = (float(total_lesiones) / float(pacientes_evaluados)) if pacientes_evaluados else 0.0

        severidad_rows = base_detecciones.with_entities(
            DeteccionesCaries.severidad,
            func.count(DeteccionesCaries.id_deteccion).label('cantidad')
        ).group_by(
            DeteccionesCaries.severidad
        ).all()

        severidad_orden = ['incipiente', 'moderada', 'avanzada']
        severidad_nombres = {
            'incipiente': 'Incipiente',
            'moderada': 'Moderada (Profunda)',
            'avanzada': 'Avanzada (Periapical)'
        }
        severidad_colores = {
            'incipiente': '#16A34A',
            'moderada': '#F59E0B',
            'avanzada': '#EF4444'
        }

        severidad_por_tipo = {key: 0 for key in severidad_orden}
        for severidad, cantidad in severidad_rows:
            if severidad in severidad_por_tipo:
                severidad_por_tipo[severidad] = int(cantidad or 0)

        distribucion_severidad = []
        for key in severidad_orden:
            cantidad = severidad_por_tipo[key]
            porcentaje = (float(cantidad) / float(total_lesiones) * 100.0) if total_lesiones else 0.0
            distribucion_severidad.append({
                'key': key,
                'label': severidad_nombres[key],
                'cantidad': cantidad,
                'porcentaje': round(porcentaje, 2),
                'color': severidad_colores[key]
            })

        incidencia_rows = base_detecciones.with_entities(
            Paciente.edad.label('edad'),
            func.sum(case((DeteccionesCaries.severidad == 'incipiente', 1), else_=0)).label('incipiente'),
            func.sum(case((DeteccionesCaries.severidad == 'moderada', 1), else_=0)).label('moderada'),
            func.sum(case((DeteccionesCaries.severidad == 'avanzada', 1), else_=0)).label('avanzada')
        ).group_by(
            Paciente.edad
        ).order_by(
            Paciente.edad.asc()
        ).all()

        incidencia_por_edad = []
        for row in incidencia_rows:
            incipiente = int(row.incipiente or 0)
            moderada = int(row.moderada or 0)
            avanzada = int(row.avanzada or 0)
            total_edad = incipiente + moderada + avanzada
            incidencia_por_edad.append({
                'edad': int(row.edad),
                'incipiente': incipiente,
                'moderada': moderada,
                'avanzada': avanzada,
                'total': total_edad
            })

        return jsonify({
            'status': 'success',
            'data': {
                'id_report': 'epidemiologico_caries',
                'titulo': 'Reporte Epidemiológico de Caries',
                'total_lesiones': int(total_lesiones),
                'pacientes_evaluados': int(pacientes_evaluados),
                'promedio_lesiones_por_paciente': round(float(promedio_por_paciente), 2),
                'distribucion_severidad': distribucion_severidad,
                'incidencia_por_edad': incidencia_por_edad
            }
        }), 200
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': str(error)
        }), 500

@reportes_bp.route('/productividad-clinica', methods=['GET'])
def reporte_productividad():
    try:
        # Tendencia de evaluaciones (últimos 30 días con actividad)
        tendencia_rows = db.session.query(
            func.date(EvaluacionDiagnostica.fecha_evaluacion).label('fecha'),
            func.count(EvaluacionDiagnostica.id_evaluacion).label('cantidad')
        ).group_by(
            func.date(EvaluacionDiagnostica.fecha_evaluacion)
        ).order_by(
            func.date(EvaluacionDiagnostica.fecha_evaluacion).asc()
        ).limit(30).all()

        tendencia = [{'fecha': str(r.fecha), 'cantidad': int(r.cantidad)} for r in tendencia_rows]

        # Distribución de tipos de visita
        visitas_rows = db.session.query(
            EvaluacionDiagnostica.tipo_visita,
            func.count(EvaluacionDiagnostica.id_evaluacion).label('cantidad')
        ).group_by(
            EvaluacionDiagnostica.tipo_visita
        ).all()

        tipos_visita = [{'tipo': r.tipo_visita, 'cantidad': int(r.cantidad)} for r in visitas_rows]

        # Carga por odontólogo
        odontologos_rows = db.session.query(
            Odontologo.id_odontologo,
            Odontologo.nombres,
            Odontologo.apellidos,
            Odontologo.especialidad,
            func.count(EvaluacionDiagnostica.id_evaluacion).label('total'),
            func.sum(case((EvaluacionDiagnostica.estado == 'completada', 1), else_=0)).label('completadas')
        ).outerjoin(
            EvaluacionDiagnostica, Odontologo.id_odontologo == EvaluacionDiagnostica.id_odontologo
        ).group_by(
            Odontologo.id_odontologo
        ).order_by(
            func.count(EvaluacionDiagnostica.id_evaluacion).desc()
        ).all()

        especialistas = []
        for r in odontologos_rows:
            especialistas.append({
                'id': r.id_odontologo,
                'nombre': f'{r.nombres} {r.apellidos}',
                'especialidad': r.especialidad or 'General',
                'total_evaluaciones': int(r.total or 0),
                'completadas': int(r.completadas or 0)
            })

        total_general = sum(e['total_evaluaciones'] for e in especialistas)

        return jsonify({
            'status': 'success',
            'data': {
                'id_report': 'productividad_clinica',
                'titulo': 'Productividad Clínica',
                'total_general': total_general,
                'tendencia': tendencia,
                'tipos_visita': tipos_visita,
                'especialistas': especialistas
            }
        }), 200
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': str(error)
        }), 500
