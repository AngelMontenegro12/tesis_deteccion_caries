"""Contrato FastAPI/YOLO aislado por AST: no importa ultralytics ni carga .pt."""
import asyncio
import logging
from types import SimpleNamespace
from unittest.mock import Mock
import unittest

from test_validation_service_contract import load_functions


class JsonResponse:
    def __init__(self, status_code, content):
        self.status_code, self.content = status_code, content


class InferenceContractTests(unittest.TestCase):
    def pipeline(self, model):
        return load_functions('services/detector.py', ['run_inference'], {
            'model': model, 'CONFIDENCE': 0.45,
            'validar_capa0': lambda _: (True, 'OK', object()),
            'validar_con_clip': lambda _: (True, 'OK'),
            'validar_con_clasificador': lambda _: (True, 'OK'),
            'CLASS_MAP': {0: 'Caries'}, 'CLASS_DISPLAY': {'Caries': 'Caries Incipiente'},
            'extraer_probabilidades': lambda *args: {}, 'print': lambda *args: None,
        })['run_inference']

    def test_yolo_exception_missing_model_and_incomplete_result_never_succeed(self):
        for model in (None, Mock(side_effect=RuntimeError('detalle privado')), Mock(return_value=[]),
                      Mock(return_value=[SimpleNamespace(boxes=None)])):
            with self.assertRaises(RuntimeError):
                self.pipeline(model)(b'imagen-ficticia')

    def test_empty_boxes_are_success_not_a_model_error(self):
        model = Mock(return_value=[SimpleNamespace(boxes=[])])
        result = self.pipeline(model)(b'imagen-ficticia')
        self.assertEqual(result, {'status': 'success', 'valid': True, 'error': None, 'detections': []})
        model.assert_called_once()
        self.assertEqual(model.call_args.kwargs, {'conf': 0.45, 'imgsz': 800, 'verbose': False})

    def test_success_preserves_detection_format(self):
        box = SimpleNamespace(xyxy=[[10, 20, 30, 40]], conf=[0.9], cls=[0])
        result = self.pipeline(Mock(return_value=[SimpleNamespace(boxes=[box])]))(b'fixture')
        self.assertEqual(result['detections'], [{'class': 'Caries', 'class_display': 'Caries Incipiente',
                                               'confidence': 0.9, 'class_probabilities': {}, 'bbox': [10, 20, 30, 40]}])

    def route(self, inference):
        async def process_image(_):
            return b'imagen-ficticia'
        document = Mock()
        ns = load_functions('routes/predict.py', ['predict_image'], {
            'UploadFile': object, 'File': lambda *args: None, 'process_image': process_image,
            'run_inference': inference, 'JSONResponse': JsonResponse,
            'logger': logging.getLogger('h04-test'), 'documentar_evaluacion': document,
        })
        return asyncio.run(ns['predict_image'](SimpleNamespace(filename='fixture.png'))), document

    def test_fastapi_error_http500_sanitized_and_no_success_document(self):
        cases = [Mock(side_effect=RuntimeError('paciente-secreto')), Mock(return_value={'valid': True, 'error': 'fallo', 'detections': []}),
                 Mock(return_value={}), Mock(return_value=[])]
        for inference in cases:
            with self.assertLogs('h04-test', level='ERROR') as logs:
                result, document = self.route(inference)
            self.assertEqual(result.status_code, 500)
            self.assertEqual(result.content['status'], 'error')
            self.assertFalse(result.content['valid'])
            self.assertNotIn('paciente-secreto', str(result.content) + str(logs.output))
            document.assert_not_called()

    def test_fastapi_success_and_rejected_image_are_distinct(self):
        result, document = self.route(Mock(return_value={'status': 'success', 'valid': True, 'error': None, 'detections': []}))
        self.assertEqual(result['status'], 'success')
        document.assert_called_once_with('fixture.png', [])
        result, document = self.route(Mock(return_value={'valid': False, 'error': 'No panorámica', 'detections': []}))
        self.assertEqual(result.status_code, 422)
        self.assertEqual(result.content['status'], 'invalid_image')
        document.assert_not_called()
