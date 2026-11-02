"""Subidas ficticias: SQLite temporal y doble HTTP; no IA ni base real."""
from io import BytesIO
from types import SimpleNamespace
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
import requests

import test_authorization as fixtures
from app.models import AuditoriaClinica, Radiografia


class RadiografiaValidationTests(unittest.TestCase):
    setUp = fixtures.AuthorizationTests.setUp
    tearDown = fixtures.AuthorizationTests.tearDown
    headers = fixtures.AuthorizationTests.headers

    def png(self):
        output = BytesIO()
        Image.new('RGB', (600, 200), 'white').save(output, format='PNG')
        return output.getvalue()

    def send(self, content, filename='demo.png', mime='image/png', extra=None):
        data = {'file_0': (BytesIO(content), filename, mime), 'tipo_0': '1', 'keep_idbd': '12'}
        data.update(extra or {})
        return self.client.put('/api/evaluaciones/12/radiografias', headers=self.headers(1), data=data)

    def unchanged(self):
        self.assertEqual(Radiografia.query.count(), 2)
        self.assertEqual(AuditoriaClinica.query.count(), 0)
        root = Path(self.app.config['UPLOADS_ROOT'])
        self.assertEqual(len(list(root.rglob('*.*'))), 2)
        self.assertEqual((root / 'radiografias/fixture_12.png').read_bytes(), b'imagen-ficticia-sin-datos-clinicos')

    def test_txt_and_corrupt_images_rejected_without_writes_or_service_calls(self):
        for content, name, mime in ((b'texto ficticio', 'demo.txt', 'text/plain'),
                                    (b'corrupta', 'demo.png', 'image/png'),
                                    (b'texto', 'falso.jpg', 'image/jpeg')):
            with patch('app.services.radiografia_validation.requests.post') as service:
                self.assertEqual(self.send(content, name, mime).status_code, 400)
                service.assert_not_called()
            self.unchanged()

    def test_valid_file_requires_service_confirmation_and_records_actor(self):
        response = SimpleNamespace(ok=True, json=lambda: {'valid': True, 'error': None})
        with patch('app.services.radiografia_validation.requests.post', return_value=response) as service:
            result = self.send(self.png())
        self.assertEqual(result.status_code, 201, result.json)
        self.assertEqual(Radiografia.query.count(), 3)
        self.assertEqual(AuditoriaClinica.query.count(), 1)
        self.assertEqual(AuditoriaClinica.query.one().id_actor, 1)
        self.assertTrue(service.call_args.args[0].endswith('/validate'))
        self.assertEqual(service.call_args.kwargs['files']['file'][1], self.png())

    def test_non_panorama_rejected_using_service_rules(self):
        response = SimpleNamespace(ok=True, json=lambda: {'valid': False, 'error': 'No panorámica'})
        with patch('app.services.radiografia_validation.requests.post', return_value=response):
            result = self.send(self.png())
        self.assertEqual(result.status_code, 400)
        self.assertEqual(result.json['validation_status'], 'rejected')
        self.unchanged()

    def test_service_errors_fail_closed_with_no_persistence(self):
        cases = [SimpleNamespace(ok=False, status_code=400), SimpleNamespace(ok=False, status_code=500),
                 SimpleNamespace(ok=True, json=lambda: {}), SimpleNamespace(ok=True, json=lambda: []),
                 SimpleNamespace(ok=True, json=lambda: {'valid': 'true'}),
                 SimpleNamespace(ok=True, json=lambda: {'valid': True, 'error': 'fallo'}),
                 requests.Timeout('simulado'), requests.ConnectionError('simulado'), ValueError('json inválido')]
        for case in cases:
            kwargs = {'side_effect': case} if isinstance(case, Exception) else {'return_value': case}
            with patch('app.services.radiografia_validation.requests.post', **kwargs):
                result = self.send(self.png())
            self.assertEqual(result.status_code, 503, result.json)
            self.assertEqual(result.json['validation_status'], 'unavailable')
            self.unchanged()

    def test_invalid_second_file_rejects_entire_batch_before_any_save(self):
        response = SimpleNamespace(ok=True, json=lambda: {'valid': True})
        with patch('app.services.radiografia_validation.requests.post', return_value=response):
            result = self.send(self.png(), extra={'file_1': (BytesIO(b'texto'), 'demo.txt', 'text/plain'), 'tipo_1': '1'})
        self.assertEqual(result.status_code, 400)
        self.unchanged()

    def test_retry_after_service_failure_requires_a_new_confirmation(self):
        with patch('app.services.radiografia_validation.requests.post', side_effect=requests.Timeout('simulado')):
            self.assertEqual(self.send(self.png()).status_code, 503)
        self.unchanged()
        response = SimpleNamespace(ok=True, json=lambda: {'valid': True})
        with patch('app.services.radiografia_validation.requests.post', return_value=response) as service:
            self.assertEqual(self.send(self.png()).status_code, 201)
            service.assert_called_once()

    def test_unknown_file_field_does_not_delete_existing_images(self):
        response = self.client.put('/api/evaluaciones/12/radiografias', headers=self.headers(1),
                                  data={'archivo': (BytesIO(b'texto'), 'demo.txt', 'text/plain')})
        self.assertEqual(response.status_code, 400)
        self.unchanged()


if __name__ == '__main__':
    unittest.main()
