"""H04: HTTP simulado y SQLite en memoria; nunca usa modelos ni datos reales."""
from types import SimpleNamespace
from unittest.mock import patch
import unittest
import requests

import test_authorization as fixtures
from app.models import db, Radiografia, ResultadosDeteccion, DeteccionesCaries, AuditoriaClinica


def success(detections=None):
    return {'status': 'success', 'valid': True, 'error': None,
            'detections': detections if detections is not None else []}


def detection():
    return {'class': 'Caries', 'class_display': 'Caries Incipiente', 'confidence': 0.9,
            'bbox': [10, 20, 30, 40], 'class_probabilities': {'Caries Incipiente': 0.9}}


def response(data, status=200):
    return SimpleNamespace(status_code=status, json=lambda: data)


class InferencePersistenceTests(unittest.TestCase):
    setUp = fixtures.AuthorizationTests.setUp
    tearDown = fixtures.AuthorizationTests.tearDown
    headers = fixtures.AuthorizationTests.headers

    def process(self, payload=None, failure=None):
        options = {'side_effect': failure} if failure is not None else {'return_value': response(payload)}
        with patch('app.services.ia_service.requests.post', **options):
            return self.client.post('/api/evaluaciones/12/procesar', headers=self.headers(1))

    def previous(self):
        previous = ResultadosDeteccion(id_radiografia=12, modelo_version='fixture-previo',
                                       caries_detectada=True, confianza_global=0.8)
        previous.detecciones.append(DeteccionesCaries(id_localizacion=1, confianza=0.8,
                                                       bbox_x=1, bbox_y=2, bbox_ancho=3, bbox_alto=4))
        db.session.add(previous)
        db.session.get(Radiografia, 12).estado_procesado = 'completado'
        db.session.commit()
        return previous.id_resultado

    def assert_preserved(self, identity):
        previous = ResultadosDeteccion.query.one()
        self.assertEqual(previous.id_resultado, identity)
        self.assertEqual(previous.modelo_version, 'fixture-previo')
        self.assertTrue(previous.caries_detectada)
        self.assertEqual(DeteccionesCaries.query.count(), 1)
        self.assertEqual(db.session.get(Radiografia, 12).estado_procesado, 'completado')

    def test_success_with_one_and_multiple_detections(self):
        for count in (1, 2):
            result = self.process(success([detection() for _ in range(count)]))
            self.assertEqual(result.status_code, 200, result.json)
            self.assertEqual(ResultadosDeteccion.query.count(), 1)
            self.assertEqual(DeteccionesCaries.query.count(), count)
            self.assertTrue(ResultadosDeteccion.query.one().caries_detectada)
            self.assertEqual(result.json['resultados'][0]['resultado']['detections'][0]['bbox'], [10, 20, 30, 40])

    def test_success_without_detections_is_a_real_completed_result(self):
        result = self.process(success())
        self.assertEqual(result.status_code, 200, result.json)
        self.assertFalse(ResultadosDeteccion.query.one().caries_detectada)
        self.assertEqual(DeteccionesCaries.query.count(), 0)
        self.assertEqual(db.session.get(Radiografia, 12).estado_procesado, 'completado')

    def test_incomplete_and_error_payloads_never_persist_success(self):
        cases = [{}, None, [], {'valid': True, 'error': 'fallo', 'detections': []},
                 {**success(), 'error': 'fallo'}, {**success(), 'valid': 'true'},
                 {'status': 'success', 'valid': True, 'error': None},
                 {**success(), 'detections': None}, success([{}]),
                 success([{**detection(), 'confidence': float('nan')}]),
                 success([{**detection(), 'bbox': [1, 2]}])]
        for payload in cases:
            with self.subTest(payload=payload):
                result = self.process(payload)
                self.assertEqual(result.status_code, 502, result.json)
                self.assertEqual(ResultadosDeteccion.query.count(), 0)
                self.assertNotEqual(db.session.get(Radiografia, 12).estado_procesado, 'completado')

    def test_network_http_and_json_errors_preserve_previous_results(self):
        identity = self.previous()
        cases = [(requests.Timeout('secreto'), 504), (requests.ConnectionError('secreto'), 503),
                 (response({}, 500), 502), (response({}, 422), 422), (ValueError('secreto'), 502)]
        for item, status in cases:
            options = {'side_effect': item} if isinstance(item, Exception) else {'return_value': item}
            with patch('app.services.ia_service.requests.post', **options):
                result = self.client.post('/api/evaluaciones/12/procesar', headers=self.headers(1))
            self.assertEqual(result.status_code, status, result.json)
            self.assertNotIn('secreto', result.get_data(as_text=True))
            self.assert_preserved(identity)

    def test_error_payload_preserves_previous_results_and_retry_succeeds(self):
        identity = self.previous()
        self.assertEqual(self.process({**success(), 'error': 'fallo'}).status_code, 502)
        self.assert_preserved(identity)
        self.assertEqual(self.process(success()).status_code, 200)
        self.assertEqual(ResultadosDeteccion.query.count(), 1)
        self.assertFalse(ResultadosDeteccion.query.one().caries_detectada)
        self.assertEqual(DeteccionesCaries.query.count(), 0)

    def test_partial_batch_rolls_back_all_results_and_states_then_retries(self):
        identity = self.previous()
        db.session.add(Radiografia(id_radiografia=13, id_evaluacion=12, id_tipo=1,
                                  nombre_archivo='fixture.png', ruta_archivo='uploads/radiografias/fixture_12.png',
                                  formato='PNG', estado_procesado='pendiente'))
        db.session.commit()
        with patch('app.services.ia_service.requests.post', side_effect=[response(success()), requests.Timeout('simulado')]):
            result = self.client.post('/api/evaluaciones/12/procesar', headers=self.headers(1))
        self.assertEqual(result.status_code, 504, result.json)
        self.assert_preserved(identity)
        self.assertEqual(db.session.get(Radiografia, 13).estado_procesado, 'pendiente')
        self.assertEqual(AuditoriaClinica.query.filter_by(accion='solicitar_procesamiento').count(), 1)
        self.assertEqual(self.process(success([detection()])).status_code, 200)
        self.assertEqual(ResultadosDeteccion.query.count(), 2)
        self.assertEqual(DeteccionesCaries.query.count(), 2)
        self.assertEqual(db.session.get(Radiografia, 13).estado_procesado, 'completado')

    def test_commit_failure_rolls_back_and_never_returns_success(self):
        identity = self.previous()
        original_commit = db.session.commit
        commits = 0
        def commit():
            nonlocal commits
            commits += 1
            if commits == 2:
                raise RuntimeError('fallo simulado de confirmación')
            original_commit()
        with patch.object(db.session, 'commit', side_effect=commit):
            result = self.process(success())
        self.assertEqual(result.status_code, 500)
        self.assert_preserved(identity)


if __name__ == '__main__':
    unittest.main()
