from flask import Blueprint, request, jsonify, send_file, current_app
from io import BytesIO
import os
import re
import unicodedata
from app.models import EvaluacionDiagnostica, Radiografia, DiagnosticoOdontologo, Paciente, Odontologo, ResultadosDeteccion, DeteccionesCaries, db
from app.services.ia_service import procesar_radiografia_con_ia
from datetime import datetime
from app.utils.validation import valid_date
from app.utils.auth import require_module, can_edit_clinical, forbidden
from app.utils.auditoria_clinica import registrar_operacion
from app.utils.identidad_clinica import capturar_identidad, datos_expediente, paciente_expediente
from app.services.radiografia_validation import validar_archivo, RadiografiaValidationError
from app.services.staged_uploads import StagedUploads

evaluaciones_bp = Blueprint('evaluaciones', __name__, url_prefix='/api/evaluaciones')

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'radiografias')


def _evaluacion_bloqueada(id_evaluacion):
    # Lectura actual (no snapshot) en InnoDB, renovando también la identidad ORM.
    return (EvaluacionDiagnostica.query.filter_by(id_evaluacion=id_evaluacion)
            .populate_existing().with_for_update().first())


def _version_radiografias(id_evaluacion):
    rows = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).populate_existing().order_by(Radiografia.id_radiografia).all()
    return [(r.id_radiografia, r.ruta_archivo, r.nombre_archivo, r.id_tipo, r.estado_procesado,
             tuple(x.id_resultado for x in ResultadosDeteccion.query.filter_by(
                 id_radiografia=r.id_radiografia).order_by(ResultadosDeteccion.id_resultado).all())) for r in rows]


def _diagnostico_final(evaluacion):
    return DiagnosticoOdontologo.query.filter_by(id_evaluacion=evaluacion.id_evaluacion).order_by(
        DiagnosticoOdontologo.id_diagnostico.desc()).first()


def _bloqueo_finalizada(evaluacion):
    if evaluacion.estado == 'completada' or _diagnostico_final(evaluacion):
        return jsonify({'error': 'La evaluación tiene un diagnóstico finalizado. No se permite editar ni reprocesar; crea una nueva evaluación.'}), 409
    return None

@evaluaciones_bp.route('', methods=['GET'])
def obtener_evaluaciones():
    _, error = require_module('/historial', '/nueva-evaluacion')
    if error: return error
    try:
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        estado = request.args.get('estado', '', type=str)
        tipo_visita = request.args.get('tipo_visita', '', type=str)
        fecha_inicio = request.args.get('fecha_inicio', '', type=str)
        fecha_fin = request.args.get('fecha_fin', '', type=str)
        if (fecha_inicio and not valid_date(fecha_inicio)) or (fecha_fin and not valid_date(fecha_fin)):
            return jsonify({'status': 'error', 'error': 'Las fechas deben estar entre 1900 y hoy'}), 400
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            return jsonify({'status': 'error', 'error': 'La fecha inicial no puede ser posterior a la fecha final'}), 400
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
            .outerjoin(Radiografia, Radiografia.id_evaluacion == EvaluacionDiagnostica.id_evaluacion)
        
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
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    if not can_edit_clinical(user, '/nueva-evaluacion'): return forbidden()
    data = request.get_json(silent=True) or {}
    if not str(data.get('tipo_visita') or '').strip() or not str(data.get('motivo_consulta') or '').strip():
        return jsonify({'error': 'El tipo de visita y el motivo de consulta son requeridos'}), 400
    paciente = db.session.get(Paciente, data.get('id_paciente')) if str(data.get('id_paciente', '')).isdigit() else None
    if not paciente or not paciente.activo:
        return jsonify({'error': 'Paciente no encontrado'}), 404
    try:
        nueva_eval = EvaluacionDiagnostica(
            id_paciente=paciente.id_paciente,
            id_odontologo=user.id_odontologo,
            tipo_visita=data.get('tipo_visita', 'Primera vez'),
            motivo_consulta=data.get('motivo_consulta', ''),
            observaciones=data.get('observaciones', ''),
            estado='pendiente'
        )
        db.session.add(nueva_eval)
        db.session.flush()
        registrar_operacion(user, 'evaluacion', nueva_eval.id_evaluacion, 'crear')
        db.session.commit()
        return jsonify(nueva_eval.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@evaluaciones_bp.route('/<int:id_evaluacion>', methods=['PUT'])
def actualizar_evaluacion(id_evaluacion):
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    data = request.get_json(silent=True) or {}
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404
        if not can_edit_clinical(user, '/nueva-evaluacion'):
            return forbidden()
        bloqueo = _bloqueo_finalizada(evaluacion)
        if bloqueo: return bloqueo

        if ('tipo_visita' in data and not str(data['tipo_visita'] or '').strip()) or ('motivo_consulta' in data and not str(data['motivo_consulta'] or '').strip()):
            return jsonify({'error': 'El tipo de visita y el motivo de consulta son requeridos'}), 400

        cambios = [campo for campo in ('tipo_visita', 'motivo_consulta', 'observaciones')
                   if campo in data and data[campo] != getattr(evaluacion, campo)]
        if 'tipo_visita' in data: evaluacion.tipo_visita = data['tipo_visita']
        if 'motivo_consulta' in data: evaluacion.motivo_consulta = data['motivo_consulta']
        if 'observaciones' in data: evaluacion.observaciones = data['observaciones']

        registrar_operacion(user, 'evaluacion', id_evaluacion, 'editar', cambios)
        db.session.commit()
        return jsonify(evaluacion.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@evaluaciones_bp.route('/<int:id_evaluacion>/completar', methods=['PUT', 'POST'])
def completar_evaluacion(id_evaluacion):
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    try:
        evaluacion = db.session.get(EvaluacionDiagnostica, id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404
        if not can_edit_clinical(user, '/nueva-evaluacion'):
            return forbidden()
        # Mismo bloqueo de paciente que usa su edición: captura y rectificación se serializan.
        paciente = Paciente.query.filter_by(id_paciente=evaluacion.id_paciente).with_for_update().first()
        if not paciente:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        # Orden paciente -> evaluación, compatible con la rectificación de identidad.
        evaluacion = _evaluacion_bloqueada(id_evaluacion)

        # Una repetición de la solicitud no debe crear diagnósticos duplicados.
        data = request.json or {}
        diagnostico_texto = data.get('finalDiagnosis', '').strip()
        if not diagnostico_texto:
            diagnostico_texto = 'Sin diagnostico redactado'
            
        plan_tratamiento = data.get('plan_tratamiento', 'Tratamiento estándar según hallazgos')
        confirma_ia = data.get('confirma_ia', 1)
        observaciones = data.get('observaciones', '')

        existente = _diagnostico_final(evaluacion)
        if existente or evaluacion.estado == 'completada':
            if (existente and evaluacion.estado == 'completada'
                    and existente.id_odontologo == user.id_odontologo
                    and existente.diagnostico_texto == diagnostico_texto
                    and existente.plan_tratamiento == plan_tratamiento
                    and bool(existente.confirma_ia) == bool(confirma_ia)
                    and (existente.observaciones or '') == observaciones):
                return jsonify({'message': 'La evaluación ya estaba finalizada', 'diagnostico': existente.to_dict()}), 200
            return jsonify({'error': 'Ya existe un cierre clínico. No se puede sustituir el diagnóstico ni su responsable.'}), 409

        # Crear registro en diagnosticos_odontologo
        nuevo_diagnostico = DiagnosticoOdontologo(
            id_evaluacion=id_evaluacion,
            id_odontologo=user.id_odontologo,
            diagnostico_texto=diagnostico_texto,
            plan_tratamiento=plan_tratamiento,
            confirma_ia=confirma_ia,
            observaciones=observaciones
        )
        
        db.session.add(nuevo_diagnostico)

        # Actualizar evaluación a completada
        evaluacion.estado = 'completada'
        capturar_identidad(evaluacion, paciente, user, 'cierre')
        registrar_operacion(user, 'evaluacion', id_evaluacion, 'finalizar')
        db.session.commit()
        
        return jsonify({
            "message": "Evaluación finalizada y guardada exitosamente",
            "diagnostico": nuevo_diagnostico.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@evaluaciones_bp.route('/<int:id_evaluacion>/pdf', methods=['GET'])
def descargar_diagnostico_pdf(id_evaluacion):
    _, error = require_module('/historial', '/reportes', '/nueva-evaluacion')
    if error: return error
    evaluacion = db.session.get(EvaluacionDiagnostica, id_evaluacion)
    if not evaluacion:
        return jsonify({'error': 'Evaluación no encontrada'}), 404
    if evaluacion.estado != 'completada':
        return jsonify({'error': 'Finaliza el diagnóstico antes de descargar su PDF'}), 409

    diagnostico = DiagnosticoOdontologo.query.filter_by(id_evaluacion=id_evaluacion).order_by(
        DiagnosticoOdontologo.fecha_diagnostico.desc(), DiagnosticoOdontologo.id_diagnostico.desc()
    ).first()
    if not diagnostico:
        return jsonify({'error': 'No hay un diagnóstico final guardado para esta evaluación'}), 404

    paciente = db.session.get(Paciente, evaluacion.id_paciente)
    if not paciente:
        return jsonify({'error': 'Paciente no encontrado'}), 404

    paciente = paciente_expediente(evaluacion, paciente)

    odontologo = db.session.get(Odontologo, diagnostico.id_odontologo)
    radiografias = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).order_by(Radiografia.id_radiografia).all()
    imagenes = []
    if radiografias:
        resultados = ResultadosDeteccion.query.filter(
            ResultadosDeteccion.id_radiografia.in_([r.id_radiografia for r in radiografias])
        ).order_by(ResultadosDeteccion.id_resultado.desc()).all()
        ultimo_resultado = {}
        for resultado in resultados:
            ultimo_resultado.setdefault(resultado.id_radiografia, resultado.id_resultado)
        hallazgos = {}
        if ultimo_resultado:
            for hallazgo in DeteccionesCaries.query.filter(
                DeteccionesCaries.id_resultado.in_(list(ultimo_resultado.values()))
            ).order_by(DeteccionesCaries.id_deteccion).all():
                hallazgos.setdefault(hallazgo.id_resultado, []).append(hallazgo)
        imagenes = [(r, hallazgos.get(ultimo_resultado.get(r.id_radiografia), [])) for r in radiografias]

    try:
        from app.services.diagnostico_pdf import generar_pdf_diagnostico
        pdf = generar_pdf_diagnostico(evaluacion, paciente, odontologo, diagnostico, imagenes)
    except ModuleNotFoundError as error:
        current_app.logger.exception('Dependencia ausente al generar PDF de evaluación %s', id_evaluacion)
        if error.name == 'pymupdf':
            return jsonify({'error': 'La generación del PDF no está disponible: falta instalar PyMuPDF en el Python que ejecuta el backend'}), 503
        return jsonify({'error': 'No se pudo generar el PDF de este diagnóstico'}), 500
    except Exception:
        current_app.logger.exception('Error generando PDF de evaluación %s', id_evaluacion)
        return jsonify({'error': 'No se pudo generar el PDF de este diagnóstico'}), 500

    nombre_completo = f'{paciente.nombres or ""}{paciente.apellidos or ""}'
    nombre_archivo = re.sub(r'[^A-Za-z0-9]', '', unicodedata.normalize('NFKD', nombre_completo)) or 'Paciente'
    return send_file(
        BytesIO(pdf), mimetype='application/pdf', as_attachment=True,
        download_name=f'diagnostico_{nombre_archivo}.pdf'
    )

@evaluaciones_bp.route('/pendientes/paciente/<int:id_paciente>', methods=['GET'])
def obtener_evaluacion_pendiente(id_paciente):
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    try:
        if not db.session.get(Paciente, id_paciente):
            return jsonify({'error': 'Paciente no encontrado'}), 404
        
        # Buscar la última evaluación pendiente del paciente
        query = EvaluacionDiagnostica.query.filter_by(
            id_paciente=id_paciente,
            estado='pendiente'
        )
        # Cualquier trabajador habilitado puede reanudar un caso compartido sin cierre.
        query = query.filter(~EvaluacionDiagnostica.id_evaluacion.in_(
            db.session.query(DiagnosticoOdontologo.id_evaluacion)))
        evaluacion = query.order_by(EvaluacionDiagnostica.fecha_evaluacion.desc()).first()
        
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
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    evaluacion = db.session.get(EvaluacionDiagnostica, id_evaluacion)
    if not evaluacion:
        return jsonify({'error': 'Evaluación no encontrada'}), 404
    if not can_edit_clinical(user, '/nueva-evaluacion'):
        return forbidden()
    bloqueo = _bloqueo_finalizada(evaluacion)
    if bloqueo: return bloqueo
    # Validar TODO el lote antes de guardar, reemplazar o eliminar cualquier archivo/fila.
    try:
        for key, file in request.files.items(multi=True):
            if not key.startswith('file_'):
                return jsonify({'error': 'Campo de archivo no reconocido. No se guardaron cambios.'}), 400
            index = key.split('_')[1]
            if request.form.get(f'tipo_{index}', '1') != '1':
                return jsonify({'error': 'Solo se admiten radiografías panorámicas.'}), 400
            validar_archivo(file)
    except RadiografiaValidationError as error:
        return jsonify({'error': str(error), 'validation_status': 'unavailable' if error.status == 503 else 'rejected'}), error.status
    staged = StagedUploads(current_app.config['UPLOADS_ROOT'])
    try:
        # H10 ya terminó; renovar snapshot y bloquear solo durante la escritura.
        db.session.rollback()
        evaluacion = _evaluacion_bloqueada(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404
        bloqueo = _bloqueo_finalizada(evaluacion)
        if bloqueo: return bloqueo
            
        now = datetime.now()
        anio = now.strftime('%Y')
        mes = now.strftime('%m')

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
                    filepath_full, ruta_relativa = staged.save(file, os.path.join('radiografias', anio, mes))
                    
                    size_kb = int(os.path.getsize(filepath_full) / 1024)
                    formato = os.path.splitext(original_filename)[1].lstrip('.').upper()
                    
                    # Intentar actualizar si se proporcionó un ID de BD
                    rad_existente = None
                    if idbd_str and idbd_str.isdigit():
                        rad_existente = Radiografia.query.get(int(idbd_str))
                        
                    if rad_existente and rad_existente.id_evaluacion == id_evaluacion:
                        # Conservar siempre el original; una reversión no restaura bytes.
                        
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
                # Solo retirar la referencia en esta transacción. No borrar el archivo.
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

        registrar_operacion(user, 'evaluacion', id_evaluacion, 'guardar_radiografias')
        staged.commit_attempted = True
        db.session.commit()

        return jsonify({
            "message": "Radiografías guardadas con éxito", 
            "radiografias": lista_completa
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error('radiografia_save_failed exception_type=%s', type(e).__name__)
        return jsonify({'error': 'No se pudo confirmar el guardado de las radiografías. Los archivos originales se conservaron.'}), 500
    finally:
        staged.cleanup()


@evaluaciones_bp.route('/<int:id_evaluacion>/procesar', methods=['POST'])
def procesar_evaluacion(id_evaluacion):
    user, auth_error = require_module('/nueva-evaluacion')
    if auth_error: return auth_error
    evaluacion = db.session.get(EvaluacionDiagnostica, id_evaluacion)
    if not evaluacion:
        return jsonify({'error': 'Evaluación no encontrada'}), 404
    if not can_edit_clinical(user, '/nueva-evaluacion'):
        return forbidden()
    bloqueo = _bloqueo_finalizada(evaluacion)
    if bloqueo: return bloqueo
    try:
        evaluacion = EvaluacionDiagnostica.query.get(id_evaluacion)
        if not evaluacion:
            return jsonify({"error": "Evaluación no encontrada"}), 404

        radiografias = Radiografia.query.filter_by(id_evaluacion=id_evaluacion).all()
        if not radiografias:
            return jsonify({"error": "No hay radiografías para procesar"}), 400

        # Conservar la auditoría de solicitud aunque se revierta el intento de inferencia.
        registrar_operacion(user, 'evaluacion', id_evaluacion, 'solicitar_procesamiento')
        db.session.commit()

        version_inicial = _version_radiografias(id_evaluacion)
        ids_radiografias = [r[0] for r in version_inicial]
        db.session.rollback()  # Liberar transacción de lectura antes de toda inferencia.
        preparados = []
        for id_rad in ids_radiografias:
            resultado_ia = procesar_radiografia_con_ia(id_rad, commit=False, prepare_only=True)
            if resultado_ia.get('status') != 'success':
                db.session.rollback()
                return jsonify({
                    'status': 'error',
                    'error': resultado_ia.get('message') or 'No fue posible completar el análisis de IA. Vuelve a intentarlo.',
                    'error_code': resultado_ia.get('error_code', 'processing_failed'),
                }), resultado_ia.get('http_status', 500)
            preparados.append(resultado_ia)

        # Transacción corta compartida con cierre y reemplazo. FOR UPDATE lee el
        # estado actual en InnoDB, no el snapshot previo de REPEATABLE READ.
        db.session.rollback()
        evaluacion = _evaluacion_bloqueada(id_evaluacion)
        if not evaluacion:
            return jsonify({'error': 'Evaluación no encontrada'}), 404
        bloqueo = _bloqueo_finalizada(evaluacion)
        if bloqueo:
            db.session.rollback()
            return bloqueo
        if _version_radiografias(id_evaluacion) != version_inicial:
            db.session.rollback()
            return jsonify({'error': 'Las radiografías o sus resultados cambiaron durante el análisis. Revisa la evaluación y reintenta.'}), 409

        resultados = []
        for id_rad, preparado in zip(ids_radiografias, preparados):
            resultado_ia = procesar_radiografia_con_ia(id_rad, commit=False, prepared=preparado)
            if resultado_ia.get('status') != 'success':
                db.session.rollback()
                return jsonify({'error': resultado_ia.get('message'), 'status': 'error'}), resultado_ia.get('http_status', 500)
            rad = db.session.get(Radiografia, id_rad)
            resultados.append({
                'id_radiografia': rad.id_radiografia,
                'nombre_archivo': rad.nombre_archivo,
                'resultado': resultado_ia
            })

        db.session.commit()  # Éxito atómico: todas las radiografías o ninguna.
        return jsonify({
            'message': 'Procesamiento IA completado',
            'resultados': resultados
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error('inference_batch_failed exception_type=%s', type(e).__name__)
        return jsonify({'status': 'error', 'error': 'No fue posible completar el análisis de IA. Vuelve a intentarlo.'}), 500


@evaluaciones_bp.route('/<int:id_evaluacion>/detalle', methods=['GET'])
def obtener_evaluacion_detalle(id_evaluacion):
    _, error = require_module('/historial', '/nueva-evaluacion', '/reportes')
    if error: return error
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
            sql = text("SELECT id_resultado FROM resultados_deteccion WHERE id_radiografia = :id_rad ORDER BY id_resultado DESC LIMIT 1")
            res = db.session.execute(sql, {"id_rad": rad.id_radiografia}).fetchone()
            id_res = res[0] if res else None
            
            ruta = rad.ruta_archivo.replace('\\', '/') if rad.ruta_archivo else ''
            radiografias_data.append({
                'id_radiografia': rad.id_radiografia,
                'ruta_archivo': ruta,
                'estado_procesado': rad.estado_procesado,
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
            'paciente': datos_expediente(evaluacion, paciente),
            'radiografias': radiografias_data,
            'detecciones_caries': detecciones_data,
            'diagnostico': diagnostico_data
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
