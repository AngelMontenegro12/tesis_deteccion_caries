"""Regresiones finales. Solo SQLite y archivos ficticios temporales."""
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
import unittest

from app.models import db, EvaluacionDiagnostica, ResultadosDeteccion, Radiografia
import test_inference_errors as inference_fixtures
import test_radiografia_validation as upload_fixtures
from test_inference_errors import success, response


class FinalVerificationTests(unittest.TestCase):
    setUp = inference_fixtures.InferencePersistenceTests.setUp
    tearDown = inference_fixtures.InferencePersistenceTests.tearDown
    headers = inference_fixtures.InferencePersistenceTests.headers

    def process(self):
        return self.client.post('/api/evaluaciones/12/procesar', headers=self.headers(1))

    def replace(self):
        png = upload_fixtures.RadiografiaValidationTests.png(self)
        return self.client.put('/api/evaluaciones/12/radiografias', headers=self.headers(1), data={
            'file_0': (BytesIO(png), 'reemplazo.png', 'image/png'), 'tipo_0': '1', 'idbd_0': '12',
        })

    def original(self):
        return Path(self.app.config['UPLOADS_ROOT']) / 'radiografias/fixture_12.png'

    def assert_original(self):
        self.assertEqual(self.original().read_bytes(), b'imagen-ficticia-sin-datos-clinicos')
        self.assertEqual(db.session.get(Radiografia, 12).ruta_archivo, 'uploads/radiografias/fixture_12.png')

    def test_close_during_inference_cannot_replace_results(self):
        def inference(*args, **kwargs):
            # Intercalación determinista; no pretende probar bloqueos de MySQL.
            db.session.get(EvaluacionDiagnostica, 12).estado = 'completada'
            db.session.commit()
            return response(success())
        with patch('app.services.ia_service.requests.post', side_effect=inference):
            result = self.process()
        self.assertEqual(result.status_code, 409, result.json)
        self.assertEqual(ResultadosDeteccion.query.count(), 0)

    def test_closed_evaluation_never_calls_yolo(self):
        db.session.get(EvaluacionDiagnostica, 12).estado = 'completada'
        db.session.commit()
        with patch('app.services.ia_service.requests.post') as inference:
            self.assertEqual(self.process().status_code, 409)
            inference.assert_not_called()

    def test_replacement_commit_failure_preserves_original(self):
        with patch('app.routes.evaluaciones.validar_archivo'), patch.object(db.session, 'commit', side_effect=RuntimeError('simulado')):
            result = self.replace()
        self.assertEqual(result.status_code, 500)
        self.assert_original()

    def test_replacement_move_failure_preserves_original(self):
        with patch('app.routes.evaluaciones.validar_archivo'), patch('os.replace', side_effect=OSError('simulado')):
            result = self.replace()
        self.assertEqual(result.status_code, 500)
        self.assert_original()

    def test_replacement_success_always_preserves_original_file(self):
        with patch('app.routes.evaluaciones.validar_archivo'):
            result = self.replace()
        self.assertEqual(result.status_code, 201, result.json)
        self.assertTrue(self.original().exists())
        stored = db.session.get(Radiografia, 12).ruta_archivo.removeprefix('uploads/')
        self.assertTrue((Path(self.app.config['UPLOADS_ROOT']) / stored).is_file())

    def test_inference_network_runs_without_an_active_database_transaction(self):
        def inference(*args, **kwargs):
            self.assertFalse(db.session().in_transaction())
            self.assertEqual(ResultadosDeteccion.query.count(), 0)
            db.session.rollback()  # Solo la lectura de comprobación de esta prueba.
            return response(success())
        with patch('app.services.ia_service.requests.post', side_effect=inference):
            self.assertEqual(self.process().status_code, 200)

    def test_real_close_route_during_inference_preserves_old_results_and_diagnosis(self):
        identity = inference_fixtures.InferencePersistenceTests.previous(self)
        def inference(*args, **kwargs):
            closed = self.client.put('/api/evaluaciones/12/completar', headers=self.headers(2),
                                     json={'finalDiagnosis': 'Cierre ficticio concurrente'})
            self.assertEqual(closed.status_code, 200, closed.json)
            return response(success())
        with patch('app.services.ia_service.requests.post', side_effect=inference):
            result = self.process()
        self.assertEqual(result.status_code, 409, result.json)
        inference_fixtures.InferencePersistenceTests.assert_preserved(self, identity)
        self.assertEqual(db.session.get(EvaluacionDiagnostica, 12).estado, 'completada')

    def test_changed_images_during_inference_reject_stale_prediction(self):
        def inference(*args, **kwargs):
            db.session.get(Radiografia, 12).nombre_archivo = 'otro_ficticio.png'
            db.session.commit()
            return response(success())
        with patch('app.services.ia_service.requests.post', side_effect=inference):
            self.assertEqual(self.process().status_code, 409)
        self.assertEqual(ResultadosDeteccion.query.count(), 0)

    def test_temporary_write_failure_preserves_original(self):
        with patch('app.routes.evaluaciones.validar_archivo'), patch('werkzeug.datastructures.FileStorage.save', side_effect=OSError('simulado')):
            self.assertEqual(self.replace().status_code, 500)
        self.assert_original()

    def test_ambiguous_commit_keeps_new_file_if_database_did_commit(self):
        commit = db.session.commit
        def commit_then_disconnect():
            commit()
            raise RuntimeError('confirmación perdida simulada')
        with patch('app.routes.evaluaciones.validar_archivo'), patch.object(db.session, 'commit', side_effect=commit_then_disconnect):
            self.assertEqual(self.replace().status_code, 500)
        self.assertTrue(self.original().exists())
        row = db.session.get(Radiografia, 12)
        self.assertTrue((Path(self.app.config['UPLOADS_ROOT']) / row.ruta_archivo.removeprefix('uploads/')).is_file())

    def test_mysql_lock_is_a_current_read_on_the_evaluation(self):
        from sqlalchemy.dialects import mysql
        query = EvaluacionDiagnostica.query.filter_by(id_evaluacion=12).populate_existing().with_for_update()
        sql = str(query.statement.compile(dialect=mysql.dialect()))
        self.assertIn('FOR UPDATE', sql)

    def test_detail_contains_committed_result_identity_and_state(self):
        with patch('app.services.ia_service.requests.post', return_value=response(success())):
            processing = self.process()
        self.assertEqual(processing.status_code, 200)
        detail = self.client.get('/api/evaluaciones/12/detalle', headers=self.headers(1))
        self.assertEqual(detail.status_code, 200, detail.json)
        self.assertEqual(detail.json['radiografias'][0]['estado_procesado'], 'completado')
        self.assertEqual(detail.json['radiografias'][0]['id_resultado'], processing.json['resultados'][0]['resultado']['id_resultado'])


if __name__ == '__main__':
    unittest.main()
