"""Funciones aisladas del servicio IA: no importa detector ni abre checkpoints.

Las funciones se extraen del AST para evitar la carga de YOLO al importar detector.
No es una prueba de precisión ni de disponibilidad de modelos en el despliegue.
"""
import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2] / 'api_ia_sonrie/app'


def load_functions(path, names, namespace):
    if 'print' not in namespace:
        log = {}
        log_tree = ast.parse((ROOT / 'utils/validation_errors.py').read_text(encoding='utf-8'))
        exec(compile(ast.Module(body=[n for n in log_tree.body if isinstance(n, ast.FunctionDef)], type_ignores=[]), 'validation_errors.py', 'exec'), log)
        namespace['print'] = log['validation_log']
    tree = ast.parse((ROOT / path).read_text(encoding='utf-8'))
    selected = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names]
    for node in selected:
        node.decorator_list = []
    exec(compile(ast.Module(body=selected, type_ignores=[]), str(path), 'exec'), namespace)
    return namespace


class Unavailable(Exception):
    pass


class HttpError(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail


class ValidationServiceTests(unittest.TestCase):
    def test_clip_and_classifier_are_fail_closed_only_in_strict_validation_mode(self):
        for filename, function, loader in (
            ('utils/clip_validator.py', 'validar_con_clip', '_load_clip'),
            ('utils/cls_validator.py', 'validar_con_clasificador', '_load_clasificador'),
        ):
            ns = load_functions(filename, [function], {loader: lambda: False, 'ValidationUnavailable': Unavailable})
            with self.assertRaises(Unavailable):
                ns[function](object(), strict=True)
            # No se cambia el comportamiento de /predict en H10.
            self.assertEqual(ns[function](object()), (True, 'OK'))
            ns[loader] = lambda: True
            if function == 'validar_con_clip':
                ns['cv2'] = SimpleNamespace(cvtColor=lambda *args: (_ for _ in ()).throw(RuntimeError('fallo simulado')), COLOR_BGR2RGB=0)
            else:
                ns['_cls_model'] = lambda *args, **kwargs: []
            with self.assertRaises(Unavailable):
                ns[function](object(), strict=True)

    def test_classifier_keeps_existing_threshold_and_non_panorama_rejection(self):
        ns = load_functions('utils/cls_validator.py', ['validar_con_clasificador'], {
            '_load_clasificador': lambda: True, 'ValidationUnavailable': Unavailable,
            'IDX_VALIDA': 1, 'CLASIFICADOR_THRESHOLD': 0.60,
        })
        for index, score, valid in ((1, 0.9, True), (0, 0.1, False), (1, 0.4, False)):
            ns['_cls_model'] = lambda *args, **kwargs: [SimpleNamespace(probs=SimpleNamespace(top1=index, top1conf=0.9, data=[1-score, score]))]
            self.assertEqual(ns['validar_con_clasificador'](object(), strict=True)[0], valid)

    def test_existing_technical_size_and_orientation_rules(self):
        ns = load_functions('services/detector.py', ['_check_tamanio_minimo', '_check_ratio_basico'], {})
        self.assertTrue(ns['_check_tamanio_minimo'](SimpleNamespace(shape=(200, 600, 3)))[0])
        self.assertTrue(ns['_check_ratio_basico'](SimpleNamespace(shape=(200, 600, 3)))[0])
        self.assertFalse(ns['_check_tamanio_minimo'](SimpleNamespace(shape=(50, 100, 3)))[0])
        self.assertFalse(ns['_check_ratio_basico'](SimpleNamespace(shape=(600, 200, 3)))[0])

    def test_validate_route_reports_unavailable_instead_of_valid_for_both_validators(self):
        async def process_image(_file):
            return b'fixture'
        ns = load_functions('routes/predict.py', ['validate_only'], {
            'UploadFile': object, 'File': lambda *args, **kwargs: None,
            'process_image': process_image, 'HTTPException': HttpError,
        })
        for unavailable in ('clip', 'cls', None):
            def clip(*args, **kwargs):
                self.assertTrue(kwargs['strict'])
                if unavailable == 'clip': raise Unavailable()
                return True, 'OK'
            def cls(*args, **kwargs):
                self.assertTrue(kwargs['strict'])
                if unavailable == 'cls': raise Unavailable()
                return True, 'OK'
            modules = {
                'app.services.detector': SimpleNamespace(validar_capa0=lambda _: (True, 'OK', object())),
                'app.utils.clip_validator': SimpleNamespace(validar_con_clip=clip),
                'app.utils.cls_validator': SimpleNamespace(validar_con_clasificador=cls),
            }
            with patch.dict(sys.modules, modules):
                if unavailable:
                    with self.assertRaises(HttpError) as error:
                        asyncio.run(ns['validate_only'](object()))
                    self.assertEqual(error.exception.status_code, 503)
                else:
                    self.assertEqual(asyncio.run(ns['validate_only'](object())), {'valid': True, 'error': None})


if __name__ == '__main__':
    unittest.main()
