from flask import Blueprint, request, jsonify
from app.models import EvaluacionDiagnostica, db
from datetime import datetime

evaluaciones_bp = Blueprint('evaluaciones', __name__, url_prefix='/api/evaluaciones')

@evaluaciones_bp.route('', methods=['POST'])
def crear_evaluacion():
    data = request.json
    try:
        # TODO: En un sistema real el id_odontologo se saca de la sesión actual JWT/Login
        id_odontologo_harcoded = 1 

        nueva_eval = EvaluacionDiagnostica(
            id_paciente=data['id_paciente'],
            id_odontologo=id_odontologo_harcoded,
            tipo_visita=data.get('tipo_visita', 'Primera vez'),
            motivo_consulta=data.get('motivo_consulta', ''),
            observaciones=data.get('observaciones', ''),
            estado='pendiente'
        )
        db.session.add(nueva_eval)
        db.session.commit()
        return jsonify(nueva_eval.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@evaluaciones_bp.route('/<int:id_evaluacion>', methods=['PUT'])
def actualizar_evaluacion(id_evaluacion):
    data = request.json
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404

        if 'tipo_visita' in data: evaluacion.tipo_visita = data['tipo_visita']
        if 'motivo_consulta' in data: evaluacion.motivo_consulta = data['motivo_consulta']
        if 'observaciones' in data: evaluacion.observaciones = data['observaciones']

        db.session.commit()
        return jsonify(evaluacion.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@evaluaciones_bp.route('/pendientes/paciente/<int:id_paciente>', methods=['GET'])
def obtener_evaluacion_pendiente(id_paciente):
    try:
        # TODO: En un sistema real el id_odontologo se saca de la sesión actual JWT/Login
        id_odontologo_harcoded = 1
        
        # Buscar la última evaluación pendiente del paciente para este odontólogo
        evaluacion = EvaluacionDiagnostica.query.filter_by(
            id_paciente=id_paciente,
            id_odontologo=id_odontologo_harcoded,
            estado='pendiente'
        ).order_by(EvaluacionDiagnostica.fecha_evaluacion.desc()).first()
        
        if evaluacion:
            return jsonify(evaluacion.to_dict()), 200
        return jsonify({"message": "No hay evaluaciones pendientes"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
