from flask import Blueprint, jsonify, request
from sqlalchemy import case, distinct, func, or_
from app.models import db, DeteccionesCaries, EvaluacionDiagnostica, Paciente, ResultadosDeteccion, Radiografia, Odontologo, DiagnosticoOdontologo

reportes_bp = Blueprint('reportes', __name__, url_prefix='/api/reportes')


def _base_query_resultados(id_odontologo=None):
    query = db.session.query(ResultadosDeteccion).join(
        Radiografia, ResultadosDeteccion.id_radiografia == Radiografia.id_radiografia
    ).join(
        EvaluacionDiagnostica, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion
    )
    if id_odontologo:
        query = query.filter(EvaluacionDiagnostica.id_odontologo == id_odontologo)
    return query


def _base_query_detecciones(id_odontologo=None):
    query = db.session.query(DeteccionesCaries).join(
        ResultadosDeteccion, DeteccionesCaries.id_resultado == ResultadosDeteccion.id_resultado
    ).join(
        Radiografia, ResultadosDeteccion.id_radiografia == Radiografia.id_radiografia
    ).join(
        EvaluacionDiagnostica, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion
    ).join(
        Paciente, EvaluacionDiagnostica.id_paciente == Paciente.id_paciente
    ).filter(
        DeteccionesCaries.severidad.isnot(None)
    )
    if id_odontologo:
        query = query.filter(EvaluacionDiagnostica.id_odontologo == id_odontologo)
    return query


@reportes_bp.route('/ia-rendimiento', methods=['GET'])
def reporte_ia_rendimiento():
    try:
        id_odontologo = request.args.get('id_odontologo', type=int)

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
        id_odontologo = request.args.get('id_odontologo', type=int)

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

@reportes_bp.route('/diagnostico-individual', methods=['GET'])
def reporte_diagnostico_individual():
    try:
        id_paciente = request.args.get('id_paciente', type=int)
        if not id_paciente:
            return jsonify({'status': 'error', 'message': 'Falta id_paciente'}), 400

        paciente = Paciente.query.get(id_paciente)
        if not paciente:
            return jsonify({'status': 'error', 'message': 'Paciente no encontrado'}), 404

        # 1. Cabecera
        primera_visita = db.session.query(func.min(EvaluacionDiagnostica.fecha_evaluacion)).filter(EvaluacionDiagnostica.id_paciente == id_paciente).scalar()

        # 2. Gráfico: Curva de Actividad
        grafico_rows = db.session.query(
            func.date(EvaluacionDiagnostica.fecha_evaluacion).label('fecha'),
            func.sum(case((DeteccionesCaries.severidad == 'incipiente', 1), else_=0)).label('incipiente'),
            func.sum(case((DeteccionesCaries.severidad == 'moderada', 1), else_=0)).label('moderada'),
            func.sum(case((DeteccionesCaries.severidad == 'avanzada', 1), else_=0)).label('avanzada')
        ).join(Radiografia, EvaluacionDiagnostica.id_evaluacion == Radiografia.id_evaluacion)\
         .join(ResultadosDeteccion, Radiografia.id_radiografia == ResultadosDeteccion.id_radiografia)\
         .join(DeteccionesCaries, ResultadosDeteccion.id_resultado == DeteccionesCaries.id_resultado)\
         .filter(EvaluacionDiagnostica.id_paciente == id_paciente, ResultadosDeteccion.confianza_global > 0)\
         .group_by(func.date(EvaluacionDiagnostica.fecha_evaluacion))\
         .order_by(func.date(EvaluacionDiagnostica.fecha_evaluacion).asc()).all()

        grafico_caries = []
        for r in grafico_rows:
            grafico_caries.append({
                'fecha': str(r.fecha),
                'incipiente': int(r.incipiente or 0),
                'moderada': int(r.moderada or 0),
                'avanzada': int(r.avanzada or 0)
            })

        # 3. Historial Clínico
        timeline_rows = db.session.query(
            EvaluacionDiagnostica.id_evaluacion,
            EvaluacionDiagnostica.tipo_visita,
            EvaluacionDiagnostica.fecha_evaluacion,
            EvaluacionDiagnostica.estado,
            DiagnosticoOdontologo.diagnostico_texto,
            DiagnosticoOdontologo.plan_tratamiento
        ).outerjoin(DiagnosticoOdontologo, EvaluacionDiagnostica.id_evaluacion == DiagnosticoOdontologo.id_evaluacion)\
         .filter(EvaluacionDiagnostica.id_paciente == id_paciente)\
         .order_by(EvaluacionDiagnostica.fecha_evaluacion.desc()).all()

        timeline = []
        for r in timeline_rows:
            timeline.append({
                'id_evaluacion': r.id_evaluacion,
                'tipo_visita': r.tipo_visita,
                'fecha_evaluacion': str(r.fecha_evaluacion),
                'estado': r.estado,
                'diagnostico_texto': r.diagnostico_texto,
                'plan_tratamiento': r.plan_tratamiento
            })

        # 4. Comparativa Radiográfica
        evals_con_imagenes = db.session.query(
            EvaluacionDiagnostica.fecha_evaluacion,
            ResultadosDeteccion.imagen_resultado,
            ResultadosDeteccion.id_resultado,
            Radiografia.ruta_archivo
        ).join(Radiografia, EvaluacionDiagnostica.id_evaluacion == Radiografia.id_evaluacion)\
         .join(ResultadosDeteccion, Radiografia.id_radiografia == ResultadosDeteccion.id_radiografia)\
         .filter(EvaluacionDiagnostica.id_paciente == id_paciente, ResultadosDeteccion.id_resultado.isnot(None))\
         .order_by(EvaluacionDiagnostica.fecha_evaluacion.asc()).all()

        comparativa = None
        if evals_con_imagenes and len(evals_con_imagenes) >= 1:
            opciones = []
            for ev in evals_con_imagenes:
                # Obtener detecciones para esta radiografia
                dets = DeteccionesCaries.query.filter_by(id_resultado=ev.id_resultado).all()
                detecciones_lista = []
                for d in dets:
                    detecciones_lista.append({
                        'bbox_x': d.bbox_x,
                        'bbox_y': d.bbox_y,
                        'bbox_ancho': d.bbox_ancho,
                        'bbox_alto': d.bbox_alto,
                        'severidad': d.severidad
                    })

                opciones.append({
                    'fecha': str(ev.fecha_evaluacion),
                    'imagen_procesada': ev.imagen_resultado,
                    'imagen_cruda': ev.ruta_archivo,
                    'detecciones': detecciones_lista
                })
            
            ultima = opciones[-1]
            if len(opciones) == 1:
                comparativa = {
                    'opciones': opciones,
                    'antes': { 'fecha': f"{ultima['fecha']} (Cruda)", 'imagen': ultima['imagen_cruda'], 'detecciones': [] },
                    'despues': { 'fecha': f"{ultima['fecha']} (Procesada)", 'imagen': ultima['imagen_cruda'], 'detecciones': ultima['detecciones'] }
                }
            else:
                primera = opciones[0]
                comparativa = {
                    'opciones': opciones,
                    'antes': { 'fecha': primera['fecha'], 'imagen': primera['imagen_cruda'], 'detecciones': primera['detecciones'] },
                    'despues': { 'fecha': ultima['fecha'], 'imagen': ultima['imagen_cruda'], 'detecciones': ultima['detecciones'] }
                }

        return jsonify({
            'status': 'success',
            'data': {
                'id_report': 'diagnostico_individual',
                'titulo': 'Evolución Longitudinal del Paciente',
                'paciente': {
                    'nombres': paciente.nombres,
                    'apellidos': paciente.apellidos,
                    'edad': paciente.edad,
                    'genero': paciente.genero,
                    'primera_visita': str(primera_visita) if primera_visita else None
                },
                'grafico_caries': grafico_caries,
                'timeline': timeline,
                'comparativa': comparativa
            }
        }), 200
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': str(error)
        }), 500
