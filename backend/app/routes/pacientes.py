from flask import Blueprint, request, jsonify
from app.models import Paciente, EvaluacionDiagnostica, DiagnosticoOdontologo, db
from sqlalchemy import or_, func
from datetime import datetime
from app.utils.validation import patient_error
from app.utils.auth import require_module, can_edit_clinical, forbidden
from app.utils.auditoria_clinica import registrar_operacion
from app.utils.identidad_clinica import CAMPOS_IDENTIDAD, capturar_identidad, normalizar

pacientes_bp = Blueprint('pacientes', __name__, url_prefix='/api/pacientes')

@pacientes_bp.route('', methods=['GET'])
def listar_pacientes():
    _, error = require_module('/pacientes', '/nueva-evaluacion')
    if error: return error
    try:
        pacientes = Paciente.query.filter_by(activo=True).all()
        
        lista_completa = []
        for p in pacientes:
            p_dict = p.to_dict()
            
            evaluaciones = p.evaluaciones
            evals_sorted = sorted(evaluaciones, key=lambda e: e.fecha_evaluacion, reverse=True)
            
            evals_dict = [e.to_dict() for e in evals_sorted]
            
            p_dict['evaluaciones'] = evals_dict
            
            p_dict['evaluacion_pendiente'] = any(e['estado'] == 'pendiente' for e in evals_dict)
            
            p_dict['ultima_atencion'] = evals_dict[0]['fecha_evaluacion'][:10] if evals_dict else None
            
            lista_completa.append(p_dict)
            
        return jsonify(lista_completa), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pacientes_bp.route('/buscar', methods=['GET'])
def buscar_paciente():
    _, error = require_module('/pacientes', '/nueva-evaluacion', '/reportes')
    if error: return error
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify([])
    
    # Buscar por DNI exacto o parcial, o por nombres/apellidos parciales (incluyendo nombre completo)
    pacientes = Paciente.query.filter(
        or_(
            Paciente.dni.like(f'%{query}%'),
            Paciente.nombres.like(f'%{query}%'),
            Paciente.apellidos.like(f'%{query}%'),
            func.concat(Paciente.nombres, ' ', Paciente.apellidos).like(f'%{query}%'),
            func.concat(Paciente.apellidos, ' ', Paciente.nombres).like(f'%{query}%')
        ),
        Paciente.activo == True
    ).limit(10).all()
    
    return jsonify([p.to_dict() for p in pacientes])

@pacientes_bp.route('', methods=['POST'])
def crear_paciente():
    user, auth_error = require_module('/pacientes', '/nueva-evaluacion')
    if auth_error: return auth_error
    if not can_edit_clinical(user, '/pacientes', '/nueva-evaluacion'): return forbidden()
    data = request.get_json(silent=True) or {}
    error = patient_error(data)
    if error:
        return jsonify({'error': error}), 400
    if Paciente.query.filter_by(dni=data['dni']).first():
        return jsonify({'error': 'Ya existe un paciente registrado con ese DNI'}), 409
    try:
        # Calcular la edad del paciente
        fecha_nac = datetime.strptime(data['fecha_nacimiento'], '%Y-%m-%d')
        today = datetime.today()
        edad_calculada = today.year - fecha_nac.year - ((today.month, today.day) < (fecha_nac.month, fecha_nac.day))

        nuevo_paciente = Paciente(
            id_odontologo=user.id_odontologo,
            nombres=data['nombres'],
            apellidos=data['apellidos'],
            dni=data['dni'],
            fecha_nacimiento=fecha_nac.date(),
            edad=edad_calculada,
            genero=data['genero'],
            telefono=data.get('telefono'),
            correo=data.get('correo'),
            direccion=data.get('direccion'),
            observaciones_generales=data.get('observaciones_generales'),
            apoderado=data.get('apoderado'),
            telefono_apoderado=data.get('telefono_apoderado')
        )
        db.session.add(nuevo_paciente)
        db.session.flush()
        registrar_operacion(user, 'paciente', nuevo_paciente.id_paciente, 'crear')
        db.session.commit()
        return jsonify(nuevo_paciente.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@pacientes_bp.route('/<int:id_paciente>', methods=['GET'])
def obtener_paciente(id_paciente):
    _, error = require_module('/pacientes', '/nueva-evaluacion', '/historial', '/reportes')
    if error: return error
    try:
        paciente = Paciente.query.get(id_paciente)
        if not paciente:
            return jsonify({"error": "Paciente no encontrado"}), 404
        return jsonify(paciente.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pacientes_bp.route('/<int:id_paciente>', methods=['PUT'])
def actualizar_paciente(id_paciente):
    user, auth_error = require_module('/pacientes', '/nueva-evaluacion')
    if auth_error: return auth_error
    data = request.get_json(silent=True) or {}
    try:
        paciente = Paciente.query.filter_by(id_paciente=id_paciente).with_for_update().first()
        if not paciente:
            return jsonify({"error": "Paciente no encontrado"}), 404
        if not can_edit_clinical(user, '/pacientes', '/nueva-evaluacion'):
            return forbidden()

        cambios = {campo for campo in (
            'nombres', 'apellidos', 'dni', 'fecha_nacimiento', 'genero', 'telefono',
            'correo', 'direccion', 'observaciones_generales', 'apoderado', 'telefono_apoderado'
        ) if campo in data and normalizar(data[campo]) != normalizar(getattr(paciente, campo))}
        data = {campo: valor for campo, valor in data.items() if campo in cambios or campo in (
            'confirmar_identidad', 'motivo_rectificacion')}

        error = patient_error(data, paciente)
        if error:
            return jsonify({'error': error}), 400
        if 'dni' in data and Paciente.query.filter(Paciente.dni == data['dni'], Paciente.id_paciente != id_paciente).first():
            return jsonify({'error': 'Ya existe un paciente registrado con ese DNI'}), 409

        identidad_modificada = cambios.intersection(CAMPOS_IDENTIDAD)
        motivo = str(data.get('motivo_rectificacion') or '').strip()
        if identidad_modificada:
            if len(motivo) > 500:
                return jsonify({'error': 'El motivo de rectificación no puede superar 500 caracteres.'}), 400
            if data.get('confirmar_identidad') is not True or not motivo:
                return jsonify({
                    'error': 'Confirma la rectificación de identidad e indica su motivo. Los expedientes finalizados conservarán su identidad anterior.',
                    'code': 'CONFIRMAR_IDENTIDAD', 'campos': sorted(identidad_modificada),
                }), 409
            finalizadas = EvaluacionDiagnostica.query.filter(
                EvaluacionDiagnostica.id_paciente == id_paciente,
                db.or_(EvaluacionDiagnostica.estado == 'completada',
                       EvaluacionDiagnostica.id_evaluacion.in_(
                           db.session.query(DiagnosticoOdontologo.id_evaluacion)))
            ).with_for_update().all()
            for evaluacion in finalizadas:
                capturar_identidad(evaluacion, paciente, user, 'previa_rectificacion_legada')

        if 'fecha_nacimiento' in data:
            fecha_nac = datetime.strptime(data['fecha_nacimiento'], '%Y-%m-%d')
            today = datetime.today()
            paciente.edad = today.year - fecha_nac.year - ((today.month, today.day) < (fecha_nac.month, fecha_nac.day))
            paciente.fecha_nacimiento = fecha_nac.date()

        if 'nombres' in data: paciente.nombres = data['nombres']
        if 'apellidos' in data: paciente.apellidos = data['apellidos']
        if 'dni' in data: paciente.dni = data['dni']
        if 'genero' in data: paciente.genero = data['genero']
        if 'telefono' in data: paciente.telefono = data['telefono']
        if 'correo' in data: paciente.correo = data['correo']
        if 'direccion' in data: paciente.direccion = data['direccion']
        if 'observaciones_generales' in data: paciente.observaciones_generales = data['observaciones_generales']
        if 'apoderado' in data: paciente.apoderado = data['apoderado']
        if 'telefono_apoderado' in data: paciente.telefono_apoderado = data['telefono_apoderado']

        registrar_operacion(user, 'paciente', id_paciente,
                           'rectificar_identidad' if identidad_modificada else 'editar', cambios,
                           motivo=motivo if identidad_modificada else None)
        db.session.commit()
        return jsonify(paciente.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
