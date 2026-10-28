import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import pymupdf as fitz

from app.services.diagnostico_pdf import generar_pdf_diagnostico

TEST_TMP = Path(tempfile.gettempdir()) / 'opencode'
if not TEST_TMP.is_dir():
    TEST_TMP = Path(tempfile.gettempdir())


class DiagnosticoPdfTests(unittest.TestCase):
    def test_report_uses_template_and_selected_evaluation_with_image(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as folder:
            template = Path(folder) / 'fondo.pdf'
            background = fitz.open()
            base = background.new_page(width=595, height=842)
            base.insert_text((40, 40), 'MARCA DE LA CLINICA')
            background.save(template)
            background.close()

            image_path = Path(folder) / 'radiografia.png'
            image = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 240, 120), False)
            image.clear_with(230)
            image.save(image_path)

            evaluacion = SimpleNamespace(id_evaluacion=196, fecha_evaluacion=datetime(2026, 1, 12),
                                         tipo_visita='Urgencia', motivo_consulta='Dolor de muela', observaciones=None)
            paciente = SimpleNamespace(nombres='Ana', apellidos='Pérez', dni='12345678',
                                       fecha_nacimiento=date(1990, 5, 2), edad=35, genero='F', apoderado=None)
            odontologo = SimpleNamespace(nombres='Luis', apellidos='Díaz', colegiatura='COP 12345',
                                         especialidad='Ortodoncia')
            diagnostico = SimpleNamespace(diagnostico_texto='Caries en molar superior.',
                                          plan_tratamiento='Restauración.', observaciones=None)
            rad = SimpleNamespace(ruta_archivo='uploads/radiografias/prueba.png')
            hallazgo = SimpleNamespace(bbox_x=20, bbox_y=20, bbox_ancho=50, bbox_alto=40,
                                       severidad='moderada', confianza=0.89, numero_diente=None)

            with patch('app.services.diagnostico_pdf._image_path', return_value=image_path):
                result = generar_pdf_diagnostico(evaluacion, paciente, odontologo, diagnostico,
                                                [(rad, [hallazgo])], template=template)

            pdf = fitz.open(stream=result, filetype='pdf')
            self.assertEqual(pdf.page_count, 1)
            text = pdf[0].get_text()
            self.assertIn('MARCA DE LA CLINICA', text)
            self.assertIn('Ana Pérez', text)
            self.assertIn('Edad: 35 años', text)
            self.assertIn('Sexo: Femenino', text)
            self.assertIn('Caries en molar superior.', text)
            self.assertIn('Clínica Odontológica Sonríe', text)
            self.assertIn('7 de Enero 145, Chiclayo', text)
            self.assertIn('(074) 23-5339', text)
            self.assertNotIn('Colegiatura', text)
            self.assertNotIn('COP 12345', text)
            self.assertIn('PLAN DE TRATAMIENTO', text)
            self.assertIn('Restauración.', text)
            self.assertIn('Severidad: Carie moderada', text)
            self.assertIn('Confianza: 89.0%', text)
            self.assertIn('Luis Díaz', text)
            self.assertIn('Ortodoncia', text)
            self.assertNotIn('FIRMA Y SELLO DEL ODONTÓLOGO', text)
            self.assertNotIn('Pieza:', text)
            self.assertNotIn('Sin identificar', text)

            images = pdf[0].get_image_info()
            self.assertEqual(len(images), 1)
            x0, y0, x1, y1 = images[0]['bbox']
            self.assertAlmostEqual((x1 - x0) / (y1 - y0), 2.0, places=2)
            pdf.close()

    def test_age_is_calculated_from_birth_date_at_report_date(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as folder:
            template = Path(folder) / 'fondo.pdf'
            background = fitz.open()
            background.new_page(width=595, height=842).insert_text((40, 40), 'MARCA DE LA CLINICA')
            background.save(template)
            background.close()

            evaluacion = SimpleNamespace(id_evaluacion=197, fecha_evaluacion=datetime(2026, 10, 27, 10, 42),
                                         tipo_visita='Primera vez', motivo_consulta='Revisión', observaciones=None)
            paciente = SimpleNamespace(nombres='Ángel', apellidos='Montenegro', dni='76543210',
                                       fecha_nacimiento=date(2008, 3, 15), edad=17, apoderado=None)
            diagnostico = SimpleNamespace(diagnostico_texto='Prueba', plan_tratamiento=None, observaciones=None)

            result = generar_pdf_diagnostico(evaluacion, paciente, None, diagnostico, [], template=template)
            pdf = fitz.open(stream=result, filetype='pdf')
            text = pdf[0].get_text()
            self.assertIn('Edad: 18 años', text)
            self.assertNotIn('Edad: 17 años', text)
            self.assertIn('No registrado', text)
            self.assertNotIn('FIRMA Y SELLO DEL ODONTÓLOGO', text)
            pdf.close()

    def test_default_plan_and_placeholder_diagnosis_are_not_rendered(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as folder:
            template = Path(folder) / 'fondo.pdf'
            background = fitz.open()
            background.new_page(width=595, height=842).insert_text((40, 40), 'MARCA DE LA CLINICA')
            background.save(template)
            background.close()

            evaluacion = SimpleNamespace(id_evaluacion=198, fecha_evaluacion=datetime(2026, 10, 27),
                                         tipo_visita='Control', motivo_consulta='Revisión', observaciones=None)
            paciente = SimpleNamespace(nombres='Ana', apellidos='Pérez', dni='12345678',
                                       fecha_nacimiento=date(1990, 1, 1), edad=36, apoderado=None)
            diagnostico = SimpleNamespace(diagnostico_texto='Sin diagnostico redactado',
                                          plan_tratamiento='Plan de tratamiento estándar derivado de la evaluación',
                                          observaciones=None)

            result = generar_pdf_diagnostico(evaluacion, paciente, None, diagnostico, [], template=template)
            pdf = fitz.open(stream=result, filetype='pdf')
            text = pdf[0].get_text()
            self.assertNotIn('PLAN DE TRATAMIENTO', text)
            self.assertNotIn('Sin diagnostico redactado', text)
            self.assertIn('No registrado', text)
            pdf.close()

    def test_long_diagnosis_flows_onto_another_branded_page(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as folder:
            template = Path(folder) / 'fondo.pdf'
            background = fitz.open()
            background.new_page(width=595, height=842).insert_text((40, 40), 'MARCA DE LA CLINICA')
            background.save(template)
            background.close()
            evaluacion = SimpleNamespace(id_evaluacion=197, fecha_evaluacion=datetime(2026, 1, 12),
                                         tipo_visita='Control rutina', motivo_consulta='Revisión', observaciones=None)
            paciente = SimpleNamespace(nombres='Juan', apellidos='Rojas', dni='87654321',
                                       fecha_nacimiento=date(1990, 1, 1), edad=36, apoderado=None)
            diagnostico = SimpleNamespace(diagnostico_texto='Hallazgo importante. ' * 450,
                                          plan_tratamiento='Control.', observaciones=None)

            result = generar_pdf_diagnostico(evaluacion, paciente, None, diagnostico, [], template=template)
            pdf = fitz.open(stream=result, filetype='pdf')
            self.assertGreater(pdf.page_count, 1)
            self.assertTrue(all('MARCA DE LA CLINICA' in page.get_text() for page in pdf))
            self.assertTrue(all('Clínica Odontológica Sonríe' in page.get_text() for page in pdf))
            last_page = pdf[-1].get_text()
            self.assertIn('No registrado', last_page)
            self.assertNotIn('FIRMA Y SELLO DEL ODONTÓLOGO', last_page)
            pdf.close()


if __name__ == '__main__':
    unittest.main()
