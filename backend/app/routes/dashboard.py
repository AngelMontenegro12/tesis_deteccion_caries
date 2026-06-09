from flask import Blueprint, jsonify, request
from app.models import db, Paciente, EvaluacionDiagnostica, Odontologo, Radiografia
from sqlalchemy import func, text
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # En un entorno real, `id_odontologo` vendría del token JWT (current_user_id)
        # Para la prueba, usaremos id=1 (o pasarlo por query admin=1)
        id_odontologo = request.args.get('id_odontologo', 1, type=int)

        # 1. Total Pacientes activos en el sistema
        total_pacientes = Paciente.query.filter_by(activo=True).count()

        # 2. Evaluaciones
        eval_completadas = EvaluacionDiagnostica.query.filter_by(id_odontologo=id_odontologo, estado='completada').count()
        eval_pendientes = EvaluacionDiagnostica.query.filter_by(id_odontologo=id_odontologo, estado='pendiente').count()
        total_evaluaciones = eval_completadas + eval_pendientes

        # 3. Evaluaciones Hoy y Ayer
        hoy = datetime.now().date()
        ayer = hoy - timedelta(days=1)
        
        evaluaciones_hoy = EvaluacionDiagnostica.query.filter(
            EvaluacionDiagnostica.id_odontologo == id_odontologo,
            func.date(EvaluacionDiagnostica.fecha_evaluacion) == hoy
        ).count()
        
        evaluaciones_ayer = EvaluacionDiagnostica.query.filter(
            EvaluacionDiagnostica.id_odontologo == id_odontologo,
            func.date(EvaluacionDiagnostica.fecha_evaluacion) == ayer
        ).count()

        # 3.5 Total de radiografias subidas
        total_radiografias = Radiografia.query.join(EvaluacionDiagnostica).filter(EvaluacionDiagnostica.id_odontologo == id_odontologo).count()

        # 4. Caries más encontradas (Por localización)
        # Tomamos todas las localizaciones del catálogo y contamos las detecciones reales por odontólogo.
        query_localizacion = text("""
            SELECT
                lc.nombre AS localizacion,
                COALESCE(COUNT(dc.id_deteccion), 0) AS cantidad
            FROM localizacion_caries lc
            LEFT JOIN detecciones_caries dc ON dc.id_localizacion = lc.id_localizacion
            LEFT JOIN resultados_deteccion rd ON dc.id_resultado = rd.id_resultado
            LEFT JOIN radiografias r ON rd.id_radiografia = r.id_radiografia
            LEFT JOIN evaluaciones_diagnosticas ed ON r.id_evaluacion = ed.id_evaluacion AND ed.id_odontologo = :id_odo
            WHERE lc.id_localizacion <> 4
            GROUP BY lc.id_localizacion, lc.nombre
            ORDER BY cantidad DESC, lc.nombre ASC
        """)

        result_localizacion = db.session.execute(query_localizacion, {"id_odo": id_odontologo}).fetchall()

        detecciones_localizacion = {}
        detecciones_localizacion_series = []

        for row in result_localizacion:
            localizacion = row.localizacion
            cantidad = int(row.cantidad or 0)
            detecciones_localizacion[localizacion] = cantidad
            detecciones_localizacion_series.append({
                "localizacion": localizacion,
                "cantidad": cantidad
            })

        # 5. Últimas Evaluaciones (lista)
        # Traeremos el nombre del paciente, el tipo_visita, fecha y estado
        query_ultimas = text("""
            SELECT p.id_paciente, ed.id_evaluacion, p.nombres, p.apellidos, ed.tipo_visita, ed.fecha_evaluacion, ed.estado, ed.creado_en, ed.actualizado_en
            FROM evaluaciones_diagnosticas ed
            JOIN pacientes p ON p.id_paciente = ed.id_paciente
            WHERE ed.id_odontologo = :id_odo
            ORDER BY ed.fecha_evaluacion DESC
            LIMIT 3
        """)
        
        result_ultimas = db.session.execute(query_ultimas, {"id_odo": id_odontologo}).fetchall()
        ultimas_evaluaciones = []
        for row in result_ultimas:
            ultimas_evaluaciones.append({
                "id_paciente": row.id_paciente,
                "id_evaluacion": row.id_evaluacion,
                "paciente": f"{row.nombres} {row.apellidos}",
                "tipo_visita": row.tipo_visita,
                "fecha_evaluacion": str(row.fecha_evaluacion) if row.fecha_evaluacion else "",
                "estado": row.estado,
                "creado_en": str(row.creado_en) if row.creado_en else "",
                "actualizado_en": str(row.actualizado_en) if row.actualizado_en else ""
            })

        return jsonify({
            "status": "success",
            "data": {
                "total_pacientes": total_pacientes,
                "evaluaciones_completadas": eval_completadas,
                "evaluaciones_pendientes": eval_pendientes,
                "total_evaluaciones": total_evaluaciones,
                "evaluaciones_hoy": evaluaciones_hoy,
                "evaluaciones_ayer": evaluaciones_ayer,
                "total_radiografias": total_radiografias,
                "detecciones_localizacion": detecciones_localizacion,
                "detecciones_localizacion_series": detecciones_localizacion_series,
                "ultimas_evaluaciones": ultimas_evaluaciones
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
