"""Permisos en SQLite en memoria, archivos temporales y exclusivamente datos ficticios."""
import os
import tempfile
import unittest
from datetime import date, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import event, text

from app import create_app, db
from app.models import (AuditoriaClinica, IdentidadExpediente, DiagnosticoOdontologo, EvaluacionDiagnostica, Odontologo,
                        Paciente, Radiografia, ResultadosDeteccion, Sesion, SolicitudRol)


MODULES = ['/dashboard', '/pacientes', '/nueva-evaluacion', '/historial', '/reportes']


class AuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        with patch.dict(os.environ, {'DATABASE_URL': 'sqlite:///:memory:'}):
            self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['UPLOADS_ROOT'] = str(Path(self.temp.name) / 'uploads')
        self.ctx = self.app.app_context()
        self.ctx.push()
        @event.listens_for(db.engine, 'connect')
        def sqlite_concat(connection, record):
            connection.create_function('concat', -1, lambda *parts: ''.join(str(p or '') for p in parts))
        db.create_all()
        # Columnas/catálogo que el dashboard consulta mediante SQL crudo: solo en SQLite temporal.
        db.session.execute(text('ALTER TABLE evaluaciones_diagnosticas ADD COLUMN creado_en DATETIME'))
        db.session.execute(text('ALTER TABLE evaluaciones_diagnosticas ADD COLUMN actualizado_en DATETIME'))
        db.session.execute(text('CREATE TABLE localizacion_caries (id_localizacion INTEGER PRIMARY KEY, nombre TEXT)'))
        accounts = [
            (1, 'odontologo', MODULES), (2, 'odontologo', MODULES),
            (3, 'admin', None), (4, 'superadmin', None), (5, 'odontologo', []),
        ]
        for identity, role, modules in accounts:
            db.session.add(Odontologo(id_odontologo=identity, nombres='Usuario',
                        apellidos=f'Ficticio{identity}', correo=f'user{identity}@example.invalid',
                        contrasena_hash='solo-fixture', activo=True, rol=role, permisos=modules))
            db.session.add(Sesion(id_odontologo=identity, token_sesion=f'fixture-{identity}',
                                  expira_en=datetime.now() + timedelta(hours=2)))
        db.session.add(Sesion(id_odontologo=2, token_sesion='vencida',
                              expira_en=datetime.now() - timedelta(seconds=1)))
        for identity, owner in ((11, 1), (12, 2)):
            db.session.add(Paciente(id_paciente=identity, id_odontologo=owner,
                        nombres='Paciente', apellidos=f'Demo{identity}',
                        fecha_nacimiento=date(2000, 1, 1), edad=26, genero='F',
                        dni=f'{identity:08d}', telefono='900000001'))
            db.session.add(EvaluacionDiagnostica(id_evaluacion=identity, id_paciente=identity,
                        id_odontologo=owner, motivo_consulta='Prueba ficticia', estado='pendiente'))
            relative = f'uploads/radiografias/fixture_{identity}.png'
            db.session.add(Radiografia(id_radiografia=identity, id_evaluacion=identity, id_tipo=1,
                                       nombre_archivo='imagen_ficticia.png', ruta_archivo=relative,
                                       formato='PNG'))
            file = Path(self.app.config['UPLOADS_ROOT']) / 'radiografias' / f'fixture_{identity}.png'
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(b'imagen-ficticia-sin-datos-clinicos')
        db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()
        self.temp.cleanup()

    def headers(self, identity):
        return {'Authorization': f'Bearer fixture-{identity}'}

    def test_private_endpoints_require_session_before_accessing_database_objects(self):
        endpoints = [
            ('get', '/api/pacientes'), ('get', '/api/pacientes/buscar?q=Demo'),
            ('post', '/api/pacientes'), ('put', '/api/pacientes/11'),
            ('get', '/api/evaluaciones'), ('post', '/api/evaluaciones'),
            ('put', '/api/evaluaciones/11'), ('put', '/api/evaluaciones/11/completar'),
            ('get', '/api/evaluaciones/11/pdf'), ('get', '/api/evaluaciones/11/detalle'),
            ('get', '/api/evaluaciones/pendientes/paciente/11'),
            ('put', '/api/evaluaciones/11/radiografias'),
            ('post', '/api/evaluaciones/11/procesar'),
            ('get', '/api/reportes/ia-rendimiento'),
            ('get', '/api/reportes/epidemiologico-caries'),
            ('get', '/api/reportes/productividad-clinica'),
            ('get', '/api/reportes/diagnostico-individual?id_paciente=11'),
            ('get', '/api/dashboard/stats'), ('get', '/api/odontologos'),
            ('get', '/api/odontologos/1'), ('post', '/api/odontologos'),
            ('put', '/api/odontologos/1'), ('patch', '/api/odontologos/1/estado'),
            ('put', '/api/odontologos/1/password'),
            ('post', '/api/odontologos/1/avatar'),
            ('get', '/api/solicitudes'), ('get', '/api/soporte/mensajes'),
            ('post', '/api/auth/logout'), ('get', '/api/test'),
            ('get', '/uploads/radiografias/fixture_11.png'),
        ]
        for method, endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(getattr(self.client, method)(endpoint).status_code, 401)
        self.assertEqual(self.client.get('/api/pacientes', headers={
            'Authorization': 'Bearer vencida'}).status_code, 401)

    def test_inactive_accounts_and_unreferenced_uploads_are_denied(self):
        db.session.get(Odontologo, 5).activo = False
        db.session.commit()
        self.assertEqual(self.client.get('/api/pacientes', headers=self.headers(5)).status_code, 401)
        self.assertEqual(self.client.get('/uploads/radiografias/fixture_11.png',
                                         headers=self.headers(5)).status_code, 401)
        self.assertEqual(self.client.get('/uploads/radiografias/../radiografias/fixture_11.png',
                                         headers=self.headers(1)).status_code, 404)

    def test_all_staff_with_module_can_read_every_patient_and_clinical_file(self):
        for actor in (1, 2, 3, 4):
            with self.subTest(actor=actor):
                h = self.headers(actor)
                self.assertEqual(len(self.client.get('/api/pacientes', headers=h).json), 2)
                self.assertEqual(self.client.get('/api/pacientes/12', headers=h).status_code, 200)
                self.assertEqual(self.client.get('/api/evaluaciones/12/detalle', headers=h).status_code, 200)
                response = self.client.get('/uploads/radiografias/fixture_12.png', headers=h)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers['Cache-Control'], 'private, no-store')
                response.close()
        self.assertEqual(self.client.get('/uploads/radiografias/fixture_12.png',
                                         headers=self.headers(5)).status_code, 403)
        orphan = Path(self.app.config['UPLOADS_ROOT']) / 'radiografias' / 'orphan.png'
        orphan.write_bytes(b'not-an-authorized-file')
        self.assertEqual(self.client.get('/uploads/radiografias/orphan.png',
                                         headers=self.headers(1)).status_code, 404)

    def test_referenced_avatar_and_processed_file_require_session(self):
        avatar = Path(self.app.config['UPLOADS_ROOT']) / 'avatars' / 'fixture.png'
        avatar.parent.mkdir(parents=True, exist_ok=True)
        avatar.write_bytes(b'avatar-ficticio')
        db.session.get(Odontologo, 1).foto_perfil = '/uploads/avatars/fixture.png'
        derived = Path(self.app.config['UPLOADS_ROOT']) / 'procesadas' / 'fixture.png'
        derived.parent.mkdir(parents=True, exist_ok=True)
        derived.write_bytes(b'procesada-ficticia')
        db.session.add(ResultadosDeteccion(id_radiografia=11, modelo_version='fixture',
                       caries_detectada=False, imagen_resultado='uploads/procesadas/fixture.png'))
        db.session.commit()
        for filename in ('avatars/fixture.png', 'procesadas/fixture.png'):
            with self.subTest(filename=filename):
                path = '/uploads/' + filename
                self.assertEqual(self.client.get(path).status_code, 401)
                response = self.client.get(path, headers=self.headers(1))
                self.assertEqual(response.status_code, 200)
                response.close()

    def test_dentists_can_edit_shared_cases_without_replacing_original_author(self):
        h = self.headers(1)
        self.assertEqual(self.client.put('/api/pacientes/12', headers=h,
                                         json={'telefono': '900000002', 'id_odontologo': 1}).status_code, 200)
        self.assertEqual(db.session.get(Paciente, 12).id_odontologo, 2)
        self.assertEqual(db.session.get(Paciente, 12).telefono, '900000002')
        self.assertEqual(self.client.put('/api/evaluaciones/12', headers=h,
                                         json={'motivo_consulta': 'Otro', 'id_odontologo': 1}).status_code, 200)
        self.assertEqual(db.session.get(EvaluacionDiagnostica, 12).id_odontologo, 2)
        self.assertEqual(self.client.get('/api/evaluaciones/pendientes/paciente/12', headers=h).json['id_evaluacion'], 12)
        for resource in ('paciente', 'evaluacion'):
            audit = AuditoriaClinica.query.filter_by(recurso=resource, id_recurso=12, accion='editar').one()
            self.assertEqual(audit.id_actor, 1)
            self.assertNotIn('id_odontologo', audit.campos)
        # Sin IA real ni reemplazos/borrados de archivos: preservar la radiografía existente.
        with patch('app.routes.evaluaciones.procesar_radiografia_con_ia', return_value={'status': 'fixture'}) as service:
            self.assertEqual(self.client.post('/api/evaluaciones/12/procesar', headers=h).status_code, 200)
            service.assert_called_once_with(12)
        self.assertEqual(self.client.put('/api/evaluaciones/12/radiografias', headers=h,
                                         data={'keep_idbd': '12'}).status_code, 201)
        for action in ('solicitar_procesamiento', 'guardar_radiografias'):
            self.assertEqual(AuditoriaClinica.query.filter_by(id_recurso=12, accion=action).one().id_actor, 1)
        self.assertEqual(self.client.put('/api/evaluaciones/12/completar', headers=h,
                                         json={'finalDiagnosis': 'Ficticio'}).status_code, 200)
        self.assertEqual(db.session.get(EvaluacionDiagnostica, 12).id_odontologo, 2)
        self.assertEqual(DiagnosticoOdontologo.query.filter_by(id_evaluacion=12).one().id_odontologo, 1)
        self.assertEqual(AuditoriaClinica.query.filter_by(id_recurso=12, accion='finalizar').one().id_actor, 1)

    def test_module_permissions_still_limit_shared_writes(self):
        for endpoint, body in (('/api/pacientes/12', {'telefono': '900000002'}),
                               ('/api/evaluaciones/12', {'motivo_consulta': 'Otro'}),
                               ('/api/evaluaciones/12/completar', {'finalDiagnosis': 'Ficticio'})):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.put(endpoint, headers=self.headers(5), json=body).status_code, 403)
        self.assertEqual(self.client.post('/api/evaluaciones/12/procesar', headers=self.headers(5)).status_code, 403)
        self.assertEqual(self.client.put('/api/evaluaciones/12/radiografias', headers=self.headers(5)).status_code, 403)
        self.assertEqual(self.client.get('/api/dashboard/stats', headers=self.headers(5)).status_code, 403)
        self.assertEqual(self.client.get('/api/reportes/productividad-clinica',
                                         headers=self.headers(5)).status_code, 403)
        self.assertEqual(db.session.get(EvaluacionDiagnostica, 12).estado, 'pendiente')
        self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(3),
                                         json={'telefono': '900000002'}).status_code, 200)
        self.assertEqual(AuditoriaClinica.query.filter_by(id_actor=5).count(), 0)

    def test_patient_module_does_not_grant_evaluation_or_administration_writes(self):
        db.session.get(Odontologo, 1).permisos = ['/pacientes']
        db.session.commit()
        h = self.headers(1)
        self.assertEqual(self.client.put('/api/pacientes/12', headers=h,
                                         json={'telefono': '900000002'}).status_code, 200)
        self.assertEqual(self.client.put('/api/evaluaciones/12', headers=h,
                                         json={'motivo_consulta': 'Otro'}).status_code, 403)
        self.assertEqual(self.client.post('/api/evaluaciones', headers=h, json={
            'id_paciente': 12, 'tipo_visita': 'Control', 'motivo_consulta': 'Ensayo'
        }).status_code, 403)
        self.assertEqual(self.client.patch('/api/odontologos/2/estado', headers=h,
                                           json={'activo': False}).status_code, 403)
        db.session.get(Odontologo, 1).permisos = ['/nueva-evaluacion']
        db.session.commit()
        created = self.client.post('/api/evaluaciones', headers=h, json={
            'id_paciente': 12, 'tipo_visita': 'Control', 'motivo_consulta': 'Ensayo', 'id_odontologo': 2,
        })
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json['id_odontologo'], 1)
        self.assertEqual(db.session.get(Paciente, 12).id_odontologo, 2)

    def test_finalized_cases_cannot_be_changed_even_by_admin(self):
        self.assertEqual(self.client.put('/api/evaluaciones/12/completar', headers=self.headers(2),
                                         json={'finalDiagnosis': 'Original ficticio'}).status_code, 200)
        original = DiagnosticoOdontologo.query.filter_by(id_evaluacion=12).one()
        total_events = AuditoriaClinica.query.count()
        for actor in (1, 2, 3, 4):
            h = self.headers(actor)
            with self.subTest(actor=actor):
                self.assertEqual(self.client.put('/api/evaluaciones/12', headers=h,
                                                 json={'motivo_consulta': 'Alterado'}).status_code, 409)
                self.assertEqual(self.client.put('/api/evaluaciones/12/radiografias', headers=h).status_code, 409)
                with patch('app.routes.evaluaciones.procesar_radiografia_con_ia') as service:
                    self.assertEqual(self.client.post('/api/evaluaciones/12/procesar', headers=h).status_code, 409)
                    service.assert_not_called()
                self.assertEqual(self.client.put('/api/evaluaciones/12/completar', headers=h,
                                                 json={'finalDiagnosis': 'Sustitución'}).status_code, 409)
                self.assertEqual(self.client.put('/api/pacientes/12', headers=h,
                                                 json={'nombres': 'Identidad alterada'}).status_code, 409)
        self.assertEqual(AuditoriaClinica.query.count(), total_events)
        self.assertEqual(original.diagnostico_texto, 'Original ficticio')
        self.assertEqual(original.id_odontologo, 2)
        self.assertEqual(db.session.get(EvaluacionDiagnostica, 12).motivo_consulta, 'Prueba ficticia')
        self.assertTrue((Path(self.app.config['UPLOADS_ROOT']) / 'radiografias/fixture_12.png').exists())
        # Un reintento idéntico del firmante es idempotente; no crea otro cierre/evento.
        self.assertEqual(self.client.put('/api/evaluaciones/12/completar', headers=self.headers(2),
                                         json={'finalDiagnosis': 'Original ficticio'}).status_code, 200)
        self.assertEqual(AuditoriaClinica.query.count(), total_events)
        self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(1),
                                         json={'telefono': '900000002'}).status_code, 200)
        self.assertEqual(db.session.get(Paciente, 12).id_odontologo, 2)

    def test_legacy_diagnosis_blocks_changes_even_if_state_is_pending(self):
        db.session.add(DiagnosticoOdontologo(id_evaluacion=12, id_odontologo=2,
                                            diagnostico_texto='Cierre legado ficticio'))
        db.session.commit()
        self.assertEqual(self.client.put('/api/evaluaciones/12', headers=self.headers(1),
                                         json={'motivo_consulta': 'Otro'}).status_code, 409)
        self.assertEqual(self.client.put('/api/evaluaciones/12/completar', headers=self.headers(1),
                                         json={'finalDiagnosis': 'Otro'}).status_code, 409)
        self.assertEqual(self.client.get('/api/evaluaciones/pendientes/paciente/12',
                                         headers=self.headers(1)).status_code, 404)

    def test_patient_edit_and_audit_rollback_together(self):
        with patch.object(db.session, 'commit', side_effect=RuntimeError('fixture failure')):
            self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(1),
                                             json={'telefono': '900000002'}).status_code, 400)
        self.assertEqual(db.session.get(Paciente, 12).telefono, '900000001')
        self.assertEqual(AuditoriaClinica.query.count(), 0)

    def test_contact_edit_full_payload_does_not_trigger_identity_confirmation(self):
        self.client.put('/api/evaluaciones/12/completar', headers=self.headers(2),
                        json={'finalDiagnosis': 'Cierre ficticio'})
        patient = db.session.get(Paciente, 12)
        payload = patient.to_dict()
        payload.update(telefono='900000002', correo='demo@example.invalid', direccion='Dirección ficticia',
                       apoderado='', nombres='  Paciente  ')
        response = self.client.put('/api/pacientes/12', headers=self.headers(1), json=payload)
        self.assertEqual(response.status_code, 200, response.json)
        audit = AuditoriaClinica.query.filter_by(recurso='paciente', accion='editar').one()
        self.assertEqual(audit.campos, ['correo', 'direccion', 'telefono'])
        self.assertEqual(audit.id_actor, 1)
        self.assertEqual(patient.nombres, 'Paciente')

    def test_identity_changes_require_confirmation_even_without_finalized_cases(self):
        h = self.headers(1)
        for field, value in (('nombres', 'Nombre nuevo'), ('apellidos', 'Apellido nuevo'),
                             ('dni', '88888888'), ('fecha_nacimiento', '1999-01-01')):
            response = self.client.put('/api/pacientes/12', headers=h, json={field: value})
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json['code'], 'CONFIRMAR_IDENTIDAD')
            self.assertEqual(response.json['campos'], [field])
        response = self.client.put('/api/pacientes/12', headers=h, json={
            'nombres': 'Nombre nuevo', 'confirmar_identidad': True,
            'motivo_rectificacion': 'Corrección ficticia',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(IdentidadExpediente.query.count(), 0)
        self.assertEqual(db.session.get(Paciente, 12).id_odontologo, 2)
        audit = AuditoriaClinica.query.filter_by(accion='rectificar_identidad').one()
        self.assertEqual(audit.id_actor, 1)
        self.assertEqual(audit.motivo, 'Corrección ficticia')

    def test_finalized_identity_is_preserved_in_detail_pdf_and_later_rectifications(self):
        self.client.put('/api/evaluaciones/12/completar', headers=self.headers(2),
                        json={'finalDiagnosis': 'Cierre ficticio'})
        snapshot = db.session.get(IdentidadExpediente, 12)
        self.assertEqual(snapshot.origen, 'cierre')
        original = dict(snapshot.identidad)
        for name in ('Identidad corregida', 'Segunda corrección'):
            response = self.client.put('/api/pacientes/12', headers=self.headers(1), json={
                'nombres': name, 'fecha_nacimiento': '1999-02-02',
                'confirmar_identidad': True, 'motivo_rectificacion': 'Ensayo de rectificación',
            })
            self.assertEqual(response.status_code, 200, response.json)
        self.assertEqual(snapshot.identidad, original)
        self.assertEqual(db.session.get(Paciente, 12).nombres, 'Segunda corrección')
        self.assertEqual(self.client.get('/api/evaluaciones/12/detalle',
                         headers=self.headers(1)).json['paciente']['nombres'], original['nombres'])
        with patch('app.services.diagnostico_pdf.generar_pdf_diagnostico', return_value=b'%PDF-fixture') as pdf:
            response = self.client.get('/api/evaluaciones/12/pdf', headers=self.headers(1))
            self.assertEqual(response.status_code, 200)
            historical_patient = pdf.call_args.args[1]
            self.assertEqual(historical_patient.nombres, original['nombres'])
            self.assertEqual(str(historical_patient.fecha_nacimiento), original['fecha_nacimiento'])
            self.assertIn('diagnostico_PacienteDemo12.pdf', response.headers['Content-Disposition'])
        diagnosis = DiagnosticoOdontologo.query.filter_by(id_evaluacion=12).one()
        self.assertEqual(diagnosis.diagnostico_texto, 'Cierre ficticio')
        self.assertEqual(diagnosis.id_odontologo, 2)

    def test_legacy_snapshot_is_created_before_identity_edit_and_rollback_is_atomic(self):
        db.session.add(DiagnosticoOdontologo(id_evaluacion=12, id_odontologo=2,
                                            diagnostico_texto='Cierre legado'))
        db.session.commit()
        payload = {'dni': '88888888', 'confirmar_identidad': True,
                   'motivo_rectificacion': 'Corrección de ensayo'}
        with patch.object(db.session, 'commit', side_effect=RuntimeError('fixture failure')):
            self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(1), json=payload).status_code, 400)
        self.assertIsNone(db.session.get(IdentidadExpediente, 12))
        self.assertEqual(db.session.get(Paciente, 12).dni, '00000012')
        self.assertEqual(AuditoriaClinica.query.count(), 0)
        response = self.client.put('/api/pacientes/12', headers=self.headers(1), json=payload)
        self.assertEqual(response.status_code, 200, response.json)
        snapshot = db.session.get(IdentidadExpediente, 12)
        self.assertEqual(snapshot.origen, 'previa_rectificacion_legada')
        self.assertEqual(snapshot.identidad['dni'], '00000012')
        self.assertEqual(snapshot.id_actor, 1)

    def test_confirmation_does_not_bypass_validation_or_permissions(self):
        payload = {'dni': '88888888', 'confirmar_identidad': True,
                   'motivo_rectificacion': 'Corrección de ensayo'}
        self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(5), json=payload).status_code, 403)
        self.assertEqual(self.client.put('/api/pacientes/12', json=payload).status_code, 401)
        for patch_data, status in (({'confirmar_identidad': 'true'}, 409),
                                   ({'motivo_rectificacion': ''}, 409),
                                   ({'dni': 'abc'}, 400), ({'dni': '00000011'}, 409),
                                   ({'motivo_rectificacion': 'x' * 501}, 400)):
            self.assertEqual(self.client.put('/api/pacientes/12', headers=self.headers(1),
                                             json={**payload, **patch_data}).status_code, status)
        self.assertEqual(AuditoriaClinica.query.count(), 0)

    def test_dashboard_reports_and_pdf_are_shared_only_with_authorized_staff(self):
        self.assertEqual(self.client.get('/api/dashboard/stats?id_odontologo=4',
                                         headers=self.headers(1)).status_code, 200)
        for path in ('ia-rendimiento', 'epidemiologico-caries', 'productividad-clinica',
                     'diagnostico-individual?id_paciente=12'):
            with self.subTest(path=path):
                self.assertEqual(self.client.get('/api/reportes/' + path,
                                                 headers=self.headers(1)).status_code, 200)
        self.assertEqual(self.client.put('/api/evaluaciones/12/completar',
                                         headers=self.headers(2),
                                         json={'finalDiagnosis': 'Resultado ficticio'}).status_code, 200)
        with patch('app.services.diagnostico_pdf.generar_pdf_diagnostico', return_value=b'%PDF-fixture'):
            self.assertEqual(self.client.get('/api/evaluaciones/12/pdf',
                                             headers=self.headers(1)).status_code, 200)
        self.assertEqual(self.client.get('/api/evaluaciones/12/pdf',
                                         headers=self.headers(5)).status_code, 403)

    def test_actor_is_from_session_not_client(self):
        h = self.headers(2)
        created = self.client.post('/api/pacientes', headers=h, json={
            'nombres': 'Paciente', 'apellidos': 'Inventado', 'dni': '99999991',
            'fecha_nacimiento': '2000-01-01', 'genero': 'F', 'telefono': '900000001',
            'id_odontologo': 1,
        })
        self.assertEqual(created.status_code, 201, created.json)
        self.assertEqual(created.json['id_odontologo'], 2)
        evaluation = self.client.post('/api/evaluaciones', headers=h, json={
            'id_paciente': created.json['id_paciente'], 'id_odontologo': 1,
            'tipo_visita': 'Primera vez', 'motivo_consulta': 'Ensayo',
        })
        self.assertEqual(evaluation.status_code, 201)
        self.assertEqual(evaluation.json['id_odontologo'], 2)
        evaluation_id = evaluation.json['id_evaluacion']
        self.assertEqual(self.client.put(f'/api/evaluaciones/{evaluation_id}/completar',
                                         headers=h, json={'finalDiagnosis': 'Prueba ficticia',
                                                          'id_odontologo': 1}).status_code, 200)
        self.assertEqual(DiagnosticoOdontologo.query.filter_by(id_evaluacion=evaluation_id).first().id_odontologo, 2)

    def test_administration_cannot_be_spoofed_and_profile_requires_owner(self):
        dentist = self.headers(1)  # ID 1 no concede privilegios por sí solo.
        self.assertEqual(self.client.put('/api/odontologos/2', headers=dentist,
                          json={'rol': 'superadmin', 'permisos': MODULES, 'id_solicitante': 4}).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/2', headers=dentist,
                          json={'telefono': '900000001'}).status_code, 403)
        self.assertEqual(self.client.post('/api/odontologos', headers=dentist, json={}).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/2/password', headers=dentist,
                                         json={}).status_code, 403)
        self.assertEqual(self.client.post('/api/odontologos/2/avatar', headers=dentist).status_code, 403)
        self.assertEqual(self.client.get('/api/solicitudes', headers=dentist).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/2', headers=self.headers(3),
                         json={'rol': 'superadmin', 'id_solicitante': 4}).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/4', headers=self.headers(3),
                         json={'telefono': '900000001'}).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/3', headers=self.headers(3),
                         json={'rol': 'superadmin'}).status_code, 403)
        self.assertEqual(self.client.put('/api/odontologos/2', headers=self.headers(3),
                         json={'rol': 'admin', 'permisos': MODULES}).status_code, 200)
        self.assertEqual(SolicitudRol.query.one().id_solicitante, 3)
        self.assertEqual(db.session.get(Odontologo, 2).rol, 'odontologo')
        self.assertEqual(self.client.put('/api/odontologos/2', headers=self.headers(4),
                         json={'rol': 'admin'}).status_code, 200)
        self.assertEqual(db.session.get(Odontologo, 2).rol, 'admin')
        self.assertEqual(SolicitudRol.query.count(), 1)

    def test_logout_invalidates_only_presented_session(self):
        self.assertEqual(self.client.post('/api/auth/logout', headers=self.headers(1),
                                         json={'id_odontologo': 2, 'token': 'fixture-2'}).status_code, 200)
        self.assertEqual(self.client.get('/api/pacientes', headers=self.headers(1)).status_code, 401)
        self.assertEqual(self.client.get('/api/pacientes', headers=self.headers(2)).status_code, 200)

    def test_login_only_returns_token_after_session_is_persisted(self):
        account = db.session.get(Odontologo, 1)
        account.contrasena_hash = 'solo-fixture'
        db.session.commit()
        with patch.object(db.session, 'commit', side_effect=RuntimeError('simulated commit failure')):
            response = self.client.post('/api/auth/login', json={
                'correo': 'user1@example.invalid', 'contrasena': 'solo-fixture',
            })
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('token', response.json)


if __name__ == '__main__':
    unittest.main()
