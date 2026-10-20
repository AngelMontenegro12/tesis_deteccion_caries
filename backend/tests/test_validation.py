import importlib.util
import unittest
from datetime import date, timedelta
from pathlib import Path
from types import SimpleNamespace


# Load pure validation rules without starting Flask or connecting to the database.
module_path = Path(__file__).resolve().parents[1] / 'app' / 'utils' / 'validation.py'
spec = importlib.util.spec_from_file_location('validation', module_path)
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.adult = {
            'nombres': 'Ana', 'apellidos': 'Pérez', 'dni': '00123456',
            'fecha_nacimiento': '1990-01-01', 'genero': 'F',
            'telefono': '912345678', 'correo': 'ana@example.pe',
        }

    def test_patient_and_contact_rules(self):
        self.assertIsNone(validation.patient_error(self.adult))
        for field, bad_value in (
            ('dni', '1234567a'), ('telefono', '812345678'),
            ('correo', 'ana@example'), ('fecha_nacimiento', '1899-12-31'),
            ('fecha_nacimiento', '2025-02-29'),
            ('fecha_nacimiento', (date.today() + timedelta(days=1)).isoformat()),
        ):
            with self.subTest(field=field, value=bad_value):
                self.assertIsNotNone(validation.patient_error({**self.adult, field: bad_value}))

    def test_minor_requires_guardian_and_valid_peruvian_mobile(self):
        minor = {**self.adult, 'fecha_nacimiento': date.today().isoformat()}
        self.assertIn('apoderado', validation.patient_error(minor))
        minor['apoderado'] = 'María Pérez'
        self.assertIn('teléfono del apoderado', validation.patient_error(minor))
        minor['telefono_apoderado'] = '812345678'
        self.assertIn('empezar en 9', validation.patient_error(minor))
        minor['telefono_apoderado'] = '987654321'
        self.assertIsNone(validation.patient_error(minor))

    def test_partial_update_checks_merged_patient(self):
        existing = SimpleNamespace(**{**self.adult, 'fecha_nacimiento': date(1990, 1, 1),
                                      'apoderado': None, 'telefono_apoderado': None})
        self.assertIsNone(validation.patient_error({'correo': ''}, existing))
        self.assertIn('apoderado', validation.patient_error({'fecha_nacimiento': date.today().isoformat()}, existing))


if __name__ == '__main__':
    unittest.main()
