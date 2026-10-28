import os
import unittest
from datetime import date
from unittest.mock import patch

import pymupdf

from app import create_app, db
from app.models import DiagnosticoOdontologo, EvaluacionDiagnostica, Odontologo, Paciente
from app.services.diagnostico_pdf import TEMPLATE


class PdfEndpointTests(unittest.TestCase):
    def setUp(self):
        with patch.dict(os.environ, {'DATABASE_URL': 'sqlite:///:memory:'}):
            self.app = create_app()
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        dentist = Odontologo(id_odontologo=1, nombres='Luis', apellidos='Díaz',
                             correo='luis@example.pe', contrasena_hash='prueba')
        db.session.add(dentist)
        db.session.flush()
        patient = Paciente(id_odontologo=1, nombres='Ana', apellidos='Pérez', dni='12345678',
                           fecha_nacimiento=date(1990, 1, 1), edad=36, genero='F', telefono='912345678')
        db.session.add(patient)
        db.session.flush()
        evaluation = EvaluacionDiagnostica(id_paciente=patient.id_paciente, id_odontologo=1,
                                           tipo_visita='Urgencia', motivo_consulta='Dolor')
        db.session.add(evaluation)
        db.session.commit()
        self.id = evaluation.id_evaluacion
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_pdf_is_per_evaluation_and_only_after_completion(self):
        self.assertEqual(self.client.get('/api/evaluaciones/9999/pdf').status_code, 404)
        self.assertEqual(self.client.get(f'/api/evaluaciones/{self.id}/pdf').status_code, 409)

        endpoint = f'/api/evaluaciones/{self.id}/completar'
        for _ in range(2):
            response = self.client.put(endpoint, json={'finalDiagnosis': 'Caries molar'})
            self.assertEqual(response.status_code, 200)
        self.assertEqual(DiagnosticoOdontologo.query.filter_by(id_evaluacion=self.id).count(), 1)

        fixture = pymupdf.open()
        fixture.new_page().insert_text((50, 50), 'PDF de prueba')
        pdf_bytes = fixture.tobytes()
        fixture.close()
        with patch('app.services.diagnostico_pdf.generar_pdf_diagnostico', return_value=pdf_bytes) as render:
            response = self.client.get(f'/api/evaluaciones/{self.id}/pdf', headers={'Origin': 'http://localhost:3000'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, pdf_bytes)
        self.assertIn('application/pdf', response.content_type)
        self.assertIn('diagnostico_AnaPerez.pdf', response.headers['Content-Disposition'])
        self.assertEqual(response.headers['Access-Control-Expose-Headers'], 'Content-Disposition')
        self.assertEqual(render.call_args.args[0].id_evaluacion, self.id)
        self.assertEqual(render.call_args.args[1].dni, '12345678')

    @unittest.skipUnless(TEMPLATE.is_file(), 'Falta la referencia PDF de la clínica')
    def test_real_clinic_template_can_be_downloaded(self):
        self.assertEqual(self.client.put(f'/api/evaluaciones/{self.id}/completar',
                                         json={'finalDiagnosis': 'Caries molar'}).status_code, 200)
        response = self.client.get(f'/api/evaluaciones/{self.id}/pdf')
        self.assertEqual(response.status_code, 200)
        pdf = pymupdf.open(stream=response.data, filetype='pdf')
        self.assertIn('Caries molar', pdf[0].get_text())
        self.assertIn('Ana Pérez', pdf[0].get_text())
        self.assertTrue(pdf[0].get_images())
        pdf.close()

    def test_missing_pdf_dependency_explains_which_python_needs_it(self):
        self.client.put(f'/api/evaluaciones/{self.id}/completar', json={'finalDiagnosis': 'Caries molar'})
        with patch.object(self.app.logger, 'exception'), patch(
            'app.services.diagnostico_pdf.generar_pdf_diagnostico',
            side_effect=ModuleNotFoundError("No module named 'pymupdf'", name='pymupdf')
        ):
            response = self.client.get(f'/api/evaluaciones/{self.id}/pdf')
        self.assertEqual(response.status_code, 503)
        self.assertIn('Python que ejecuta el backend', response.json['error'])

    def test_filename_joins_all_names_without_spaces_or_accents(self):
        patient = Paciente.query.filter_by(dni='12345678').first()
        patient.nombres = 'María Elena'
        patient.apellidos = 'Núñez Silva'
        db.session.commit()
        self.client.put(f'/api/evaluaciones/{self.id}/completar', json={'finalDiagnosis': 'Caries molar'})
        with patch('app.services.diagnostico_pdf.generar_pdf_diagnostico', return_value=b'%PDF-fixture'):
            response = self.client.get(f'/api/evaluaciones/{self.id}/pdf')
        self.assertIn('diagnostico_MariaElenaNunezSilva.pdf', response.headers['Content-Disposition'])


if __name__ == '__main__':
    unittest.main()
