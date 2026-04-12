from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import time
from app.models import EvaluacionDiagnostica, Radiografia, db
from datetime import datetime

evaluaciones_bp = Blueprint('evaluaciones', __name__, url_prefix='/api/evaluaciones')

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'radiografias')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

@evaluaciones_bp.route('/<int:id_evaluacion>/completar', methods=['PUT', 'POST'])
def completar_evaluacion(id_evaluacion):
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404
        
        evaluacion.estado = 'completada'
        db.session.commit()
        return jsonify({"message": "Evaluación marcada como completada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
            eval_dict = evaluacion.to_dict()
            radiografias = Radiografia.query.filter_by(id_evaluacion=evaluacion.id_evaluacion).all()
            if radiografias:
                eval_dict['radiografias'] = [r.to_dict() for r in radiografias]
            return jsonify(eval_dict), 200
        return jsonify({"message": "No hay evaluaciones pendientes"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@evaluaciones_bp.route('/<int:id_evaluacion>/radiografias', methods=['POST', 'PUT'])
def subir_radiografias(id_evaluacion):
    """
    Recibe archivos múltiples.
    En form-data:
      - file_0, tipo_0
      - file_1, tipo_1
      ... etc
    O bien el cliente envía files y una lista de metadata asociada, 
    pero enviar 'file_X' y 'tipo_X' como clave de form-data es más simple con axios/fetch.
    """
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404
            
        now = datetime.now()
        anio = now.strftime('%Y')
        mes = now.strftime('%m')
        ruta_directorio = os.path.join('uploads', 'radiografias', anio, mes)
        ruta_fisica = os.path.join(os.getcwd(), ruta_directorio)
        os.makedirs(ruta_fisica, exist_ok=True)

        radiografias_procesadas = []
        
        # Recuperar IDs de radiografías no modificadas para no eliminarlas
        ids_keep_str = request.form.getlist('keep_idbd')
        ids_bd_recibidos = [int(ibd) for ibd in ids_keep_str if ibd.isdigit()]

        # Procesar los campos enviados en form data. Buscamos patron: file_{index}, tipo_{index}, idbd_{index}, local_id_{index}
        files = request.files
        
        for key in files:
            if key.startswith('file_'):
                index = key.split('_')[1]
                file = files[key]
                tipo = request.form.get(f'tipo_{index}', '1')
                idbd_str = request.form.get(f'idbd_{index}')
                local_id = request.form.get(f'local_id_{index}')
                
                if file and file.filename:
                    original_filename = file.filename
                    filename = secure_filename(f"eval{id_evaluacion}_{int(time.time()*1000)}_{original_filename}")
                    filepath_full = os.path.join(ruta_fisica, filename)
                    
                    file.save(filepath_full)
                    
                    size_kb = int(os.path.getsize(filepath_full) / 1024)
                    formato = filename.split('.')[-1].upper() if '.' in filename else ''
                    ruta_relativa = os.path.join(ruta_directorio, filename).replace('\\', '/')
                    
                    # Intentar actualizar si se proporcionó un ID de BD
                    rad_existente = None
                    if idbd_str and idbd_str.isdigit():
                        rad_existente = Radiografia.query.get(int(idbd_str))
                        
                    if rad_existente and rad_existente.id_evaluacion == id_evaluacion:
                        # Eliminar el archivo físico anterior
                        old_file_path = os.path.join(os.getcwd(), rad_existente.ruta_archivo)
                        if os.path.exists(old_file_path):
                            try: os.remove(old_file_path)
                            except Exception: pass
                        
                        # Actualizar los datos de la fila existente
                        rad_existente.id_tipo = int(tipo)
                        rad_existente.nombre_archivo = original_filename
                        rad_existente.ruta_archivo = ruta_relativa
                        rad_existente.formato = formato
                        rad_existente.tamanio_kb = size_kb
                        rad_existente.estado_procesado = 'pendiente'
                        
                        ids_bd_recibidos.append(rad_existente.id_radiografia)
                        
                        rad_dict = rad_existente.to_dict()
                        if local_id: rad_dict['local_id'] = local_id
                        radiografias_procesadas.append(rad_dict)

                    else:
                        # Si no existe, crear nueva radiografía
                        nueva_rad = Radiografia(
                            id_evaluacion=id_evaluacion,
                            id_tipo=int(tipo),
                            nombre_archivo=original_filename,
                            ruta_archivo=ruta_relativa,
                            formato=formato,
                            tamanio_kb=size_kb,
                            estado_procesado='pendiente'
                        )
                        db.session.add(nueva_rad)
                        db.session.flush() # Guardar para obtener el nuevo ID
                        
                        ids_bd_recibidos.append(nueva_rad.id_radiografia)
                        
                        rad_dict = nueva_rad.to_dict()
                        if local_id: rad_dict['local_id'] = local_id
                        radiografias_procesadas.append(rad_dict)
        
        # Eliminar las radiografías viejas que NO vinieron en la petición actual
        radiografias_viejas = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        for rad_vieja in radiografias_viejas:
            if rad_vieja.id_radiografia not in ids_bd_recibidos:
                # Borrar archivo físico antes de descartar
                ruta_completa = os.path.join(os.getcwd(), rad_vieja.ruta_archivo)
                if os.path.exists(ruta_completa):
                    try: os.remove(ruta_completa)
                    except Exception: pass
                db.session.delete(rad_vieja)

        # Retornamos todo lo que existe al final
        todas_rads = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        lista_completa = []
        for r in todas_rads:
            d = r.to_dict()
            # Asignar local_id si fue recién procesada para que React la mapée
            for recien in radiografias_procesadas:
                if recien.get('id_radiografia') == r.id_radiografia and 'local_id' in recien:
                    d['local_id'] = recien['local_id']
            lista_completa.append(d)

        db.session.commit()
        return jsonify({
            "message": "Radiografías guardadas con éxito", 
            "radiografias": lista_completa
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
