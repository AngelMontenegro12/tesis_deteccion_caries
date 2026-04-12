from flask import Blueprint, jsonify, request
from app.models import db, Paciente, EvaluacionDiagnostica, Odontologo
from sqlalchemy import func, text
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # En un entorno real, `id_odontologo` vendría del token JWT (current_user_id)
        # Para la prueba, usaremos id=1 (o pasarlo por query admin=1)
        id_odontologo = request.args.get('id_odontologo', 1, type=int)

        # 1. Total Pacientes
        total_pacientes = Paciente.query.filter_by(id_odontologo=id_odontologo, activo=True).count()

        # 2. Evaluaciones
        eval_completadas = EvaluacionDiagnostica.query.filter_by(id_odontologo=id_odontologo, estado='completada').count()
        eval_pendientes = EvaluacionDiagnostica.query.filter_by(id_odontologo=id_odontologo, estado='pendiente').count()
        total_evaluaciones = eval_completadas + eval_pendientes

        # 3. Evaluaciones Hoy
        hoy = datetime.now().date()
        evaluaciones_hoy = EvaluacionDiagnostica.query.filter(
            EvaluacionDiagnostica.id_odontologo == id_odontologo,
            func.date(EvaluacionDiagnostica.fecha_evaluacion) == hoy
        ).count()

        # 4. Lesiones Avanzadas & Detecciones por Severidad
        # Consulta SQL para las KPI de lesiones y gráficas de severidad (incipiente, moderada, avanzada)
        # Usamos db.session.execute para consultas complejas entre varias tablas.
        query_severidad = text("""
            SELECT dc.severidad, COUNT(dc.id_deteccion) as cantidad
            FROM detecciones_caries dc
            JOIN resultados_deteccion rd ON dc.id_resultado = rd.id_resultado
            JOIN radiografias r ON rd.id_radiografia = r.id_radiografia
            JOIN evaluaciones_diagnosticas ed ON r.id_evaluacion = ed.id_evaluacion
            WHERE ed.id_odontologo = :id_odo
            GROUP BY dc.severidad
        """)
        
        result_severidad = db.session.execute(query_severidad, {"id_odo": id_odontologo}).fetchall()
        
        lesiones_avanzadas = 0
        detecciones_severidad = {
            "incipiente": 0,
            "moderada": 0,
            "avanzada": 0
        }
        
        for row in result_severidad:
            sev = row.severidad
            cant = row.cantidad
            if sev in detecciones_severidad:
                detecciones_severidad[sev] = cant
            if sev == 'avanzada':
                lesiones_avanzadas = cant

        # 5. Últimas Evaluaciones (lista)
        # Traeremos el nombre del paciente, el tipo_visita, fecha y estado
        query_ultimas = text("""
            SELECT p.id_paciente, ed.id_evaluacion, p.nombres, p.apellidos, ed.tipo_visita, ed.fecha_evaluacion, ed.estado
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
                "estado": row.estado
            })

        return jsonify({
            "status": "success",
            "data": {
                "total_pacientes": total_pacientes,
                "evaluaciones_completadas": eval_completadas,
                "evaluaciones_pendientes": eval_pendientes,
                "total_evaluaciones": total_evaluaciones,
                "evaluaciones_hoy": evaluaciones_hoy,
                "lesiones_avanzadas": lesiones_avanzadas,
                "detecciones_severidad": detecciones_severidad,
                "ultimas_evaluaciones": ultimas_evaluaciones
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
