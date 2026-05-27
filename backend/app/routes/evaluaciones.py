from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import time
from app.models import EvaluacionDiagnostica, Radiografia, DiagnosticoOdontologo, db
from app.services.ia_service import procesar_radiografia_con_ia
from datetime import datetime

evaluaciones_bp = Blueprint('evaluaciones', __name__, url_prefix='/api/evaluaciones')

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'radiografias')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@evaluaciones_bp.route('', methods=['GET'])
def obtener_evaluaciones():
    try:
        # TODO: En un sistema real el id_odontologo se saca de la sesión actual JWT/Login
        id_odontologo_harcoded = 1
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        estado = request.args.get('estado', '', type=str)
        tipo_visita = request.args.get('tipo_visita', '', type=str)
        fecha_inicio = request.args.get('fecha_inicio', '', type=str)
        fecha_fin = request.args.get('fecha_fin', '', type=str)
        sort_by = request.args.get('sort_by', 'fecha_evaluacion', type=str)
        sort_dir = request.args.get('sort_dir', 'desc', type=str).lower()
        
        # Base query
        from app.models import Paciente
        query = db.session.query(
            EvaluacionDiagnostica,
            Paciente,
            db.func.count(Radiografia.id_radiografia).label('radiografias_count')
        )\
            .join(Paciente, EvaluacionDiagnostica.id_paciente == Paciente.id_paciente)\
            .outerjoin(Radiografia, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion)\
            .filter(EvaluacionDiagnostica.id_odontologo == id_odontologo_harcoded)
        
        # Filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Paciente.nombres.ilike(search_term),
                    Paciente.apellidos.ilike(search_term),
                    db.func.concat(Paciente.nombres, ' ', Paciente.apellidos).ilike(search_term),
                    Paciente.dni.ilike(search_term)
                )
            )
            
        if estado:
            query = query.filter(EvaluacionDiagnostica.estado == estado)
            
        if tipo_visita:
            query = query.filter(EvaluacionDiagnostica.tipo_visita == tipo_visita)
            
        if fecha_inicio:
            # fecha_inicio se espera en formato 'YYYY-MM-DD'
            query = query.filter(EvaluacionDiagnostica.fecha_evaluacion >= f"{fecha_inicio} 00:00:00")
            
        if fecha_fin:
            # fecha_fin se espera en formato 'YYYY-MM-DD'
            query = query.filter(EvaluacionDiagnostica.fecha_evaluacion <= f"{fecha_fin} 23:59:59")

        query = query.group_by(
            EvaluacionDiagnostica.id_evaluacion,
            Paciente.id_paciente
        )

        sort_is_asc = sort_dir == 'asc'
        sort_field_map = {
            'paciente': (
                Paciente.nombres,
                Paciente.apellidos
            ),
            'fecha_evaluacion': (EvaluacionDiagnostica.fecha_evaluacion,),
            'motivo_consulta': (EvaluacionDiagnostica.motivo_consulta,),
            'tipo_visita': (EvaluacionDiagnostica.tipo_visita,),
            'radiografias_count': (db.func.count(Radiografia.id_radiografia),),
            'estado': (EvaluacionDiagnostica.estado,),
        }

        order_fields = sort_field_map.get(sort_by, (EvaluacionDiagnostica.fecha_evaluacion,))
        if sort_by == 'paciente':
            if sort_is_asc:
                query = query.order_by(Paciente.nombres.asc(), Paciente.apellidos.asc())
            else:
                query = query.order_by(Paciente.nombres.desc(), Paciente.apellidos.desc())
        else:
            primary_field = order_fields[0]
            query = query.order_by(primary_field.asc() if sort_is_asc else primary_field.desc())
        
        # Paginate
        paginated_data = query.paginate(page=page, per_page=per_page, error_out=False)
        
        resultados = []
        for eval_obj, pac_obj, rad_count in paginated_data.items:
            data_dict = eval_obj.to_dict()
            data_dict['paciente'] = pac_obj.to_dict()
            
            # Radiografías count
            data_dict['radiografias_count'] = int(rad_count or 0)
            resultados.append(data_dict)
            
        return jsonify({
            'status': 'success',
            'data': resultados,
            'meta': {
                'page': paginated_data.page,
                'per_page': paginated_data.per_page,
                'total_pages': paginated_data.pages,
                'total_items': paginated_data.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500

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
        
        data = request.json or {}
        diagnostico_texto = data.get('finalDiagnosis', '').strip()
        if not diagnostico_texto:
            diagnostico_texto = 'Sin diagnostico redactado'
            
        plan_tratamiento = data.get('plan_tratamiento', 'Tratamiento estándar según hallazgos')
        confirma_ia = data.get('confirma_ia', 1)
        observaciones = data.get('observaciones', '')

        # TODO: ID odontologo real basado en token
        id_odontologo_harcoded = 1

        # Crear registro en diagnosticos_odontologo
        nuevo_diagnostico = DiagnosticoOdontologo(
            id_evaluacion=id_evaluacion,
            id_odontologo=id_odontologo_harcoded,
            diagnostico_texto=diagnostico_texto,
            plan_tratamiento=plan_tratamiento,
            confirma_ia=confirma_ia,
            observaciones=observaciones
        )
        
        db.session.add(nuevo_diagnostico)

        # Actualizar evaluación a completada
        evaluacion.estado = 'completada'
        db.session.commit()
        
        return jsonify({
            "message": "Evaluación finalizada y guardada exitosamente",
            "diagnostico": nuevo_diagnostico.to_dict()
        }), 200
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


@evaluaciones_bp.route('/<int:id_evaluacion>/procesar', methods=['POST'])
def procesar_evaluacion(id_evaluacion):
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404

        radiografias = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        if not radiografias:
            return jsonify({"error": "No hay radiografías para procesar"}), 400

        resultados = []
        for rad in radiografias:
            resultado_ia = procesar_radiografia_con_ia(rad.id_radiografia)
            resultados.append({
                'id_radiografia': rad.id_radiografia,
                'nombre_archivo': rad.nombre_archivo,
                'resultado': resultado_ia
            })

        return jsonify({
            'message': 'Procesamiento IA completado',
            'resultados': resultados
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@evaluaciones_bp.route('/<int:id_evaluacion>/detalle', methods=['GET'])
def obtener_evaluacion_detalle(id_evaluacion):
    from sqlalchemy import text
    from app.models import EvaluacionDiagnostica, Paciente, Radiografia, DiagnosticoOdontologo
    from app import db
    try:
        evaluacion = EvaluacionDiagnostica.query.get_or_404(id_evaluacion)
        paciente = Paciente.query.get_or_404(evaluacion.id_paciente)
        
        # Radiografias directly mapped to Evaluacion
        rads = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        radiografias_data = []
        for rad in rads:
            # Find result id if any using text
            sql = text("SELECT id_resultado FROM resultados_deteccion WHERE id_radiografia = :id_rad")
            res = db.session.execute(sql, {"id_rad": rad.id_radiografia}).fetchone()
            id_res = res[0] if res else None
            
            ruta = rad.ruta_archivo.replace('\\', '/') if rad.ruta_archivo else ''
            radiografias_data.append({
                'id_radiografia': rad.id_radiografia,
                'ruta_archivo': ruta,
                'id_resultado': id_res
            })

        # Detecciones
        detecciones_data = []
        for rd in radiografias_data:
            if rd['id_resultado']:
                sql_det = text("SELECT d.id_deteccion, d.numero_diente, d.confianza, d.severidad, d.bbox_x, d.bbox_y, d.bbox_ancho, d.bbox_alto, d.class_probabilities, l.nombre AS local_nombre FROM detecciones_caries d LEFT JOIN localizacion_caries l ON d.id_localizacion = l.id_localizacion WHERE d.id_resultado = :id_res")
                dets = db.session.execute(sql_det, {"id_res": rd['id_resultado']}).fetchall()
                for d in dets:
                    # d indices: 0:id_deteccion,1:numero_diente,2:confianza,3:severidad,4:bbox_x,5:bbox_y,6:bbox_ancho,7:bbox_alto,8:class_probabilities,9:local_nombre
                    class_probs = None
                    try:
                        class_probs = d[8]
                        # Si la columna viene como string JSON, cargarlo
                        import json
                        if isinstance(class_probs, str) and class_probs.strip():
                            try:
                                class_probs = json.loads(class_probs)
                            except Exception:
                                # dejar como string si no es JSON válido
                                pass
                    except Exception:
                        class_probs = None

                    detecciones_data.append({
                        'id_resultado': rd['id_resultado'],
                        'id_deteccion': d[0],
                        'numero_diente': d[1],
                        'confianza': d[2],
                        'severidad': d[3],
                        'bbox_x': d[4],
                        'bbox_y': d[5],
                        'bbox_ancho': d[6],
                        'bbox_alto': d[7],
                        'class_probabilities': class_probs,
                        'localizacion': d[9] if len(d) > 9 else ''
                    })

        # Diagnostico final
        diagnostico = DiagnosticoOdontologo.query.filter_by(id_evaluacion=id_evaluacion).order_by(DiagnosticoOdontologo.fecha_diagnostico.desc()).first()
        diagnostico_data = None
        if diagnostico:
            diagnostico_data = {
                'diagnostico_texto': diagnostico.diagnostico_texto,
                'plan_tratamiento': diagnostico.plan_tratamiento,
                'observaciones': diagnostico.observaciones
            }

        return jsonify({
            'evaluacion': evaluacion.to_dict(),
            'paciente': paciente.to_dict(),
            'radiografias': radiografias_data,
            'detecciones_caries': detecciones_data,
            'diagnostico': diagnostico_data
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
