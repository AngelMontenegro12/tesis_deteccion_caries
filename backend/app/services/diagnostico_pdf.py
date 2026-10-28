"""Renderiza un expediente sobre el fondo PDF exportado de la plantilla Word."""

import unicodedata
from datetime import date, datetime
from pathlib import Path

import pymupdf as fitz


ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / 'app' / 'templates' / 'reportes' / 'diagnostico_referencia.pdf'
UPLOADS = (ROOT / 'uploads').resolve()
INK = (0.06, 0.23, 0.30)
MUTED = (0.35, 0.40, 0.44)

CLINICA = {
    'nombre': 'Clínica Odontológica Sonríe',
    'direccion': '7 de Enero 145, Chiclayo',
    'telefono': '(074) 23-5339 / +51 74 235339',
    'correo': None,
}

SIGNATURE_HEIGHT = 44
MIN_IMAGE_HEIGHT = 150

_DEFAULT_TEXTS = {
    'sin diagnostico redactado',
    'plan de tratamiento estandar derivado de la evaluacion',
    'tratamiento estandar segun hallazgos',
}


def _text(value, fallback='No registrado'):
    return str(value).strip() if value is not None and str(value).strip() else fallback


def _normalized(value):
    text = unicodedata.normalize('NFKD', str(value or '')).encode('ascii', 'ignore').decode()
    return ' '.join(text.split()).casefold()


def _meaningful(value):
    text = str(value or '').strip()
    if not text or _normalized(text) in _DEFAULT_TEXTS:
        return None
    return text


def _date(value):
    return value.strftime('%d/%m/%Y') if value else 'No registrada'


def _sexo(value):
    text = str(value or '').strip().upper()
    return {'M': 'Masculino', 'F': 'Femenino', 'OTRO': 'Otro'}.get(text)


def _as_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return datetime.strptime(value.strip()[:10], '%Y-%m-%d').date()
        except ValueError:
            return None
    return None


def _age_at(birth, reference):
    birth = _as_date(birth)
    reference = _as_date(reference) or date.today()
    if not birth:
        return None
    years = reference.year - birth.year - ((reference.month, reference.day) < (birth.month, birth.day))
    return years if years >= 0 else None


def _image_path(relative_path):
    if not relative_path:
        return None
    candidate = Path(str(relative_path).replace('\\', '/'))
    path = (candidate if candidate.is_absolute() else ROOT / candidate).resolve()
    return path if path.is_relative_to(UPLOADS) and path.is_file() else None


def _draw_letterhead(page, left, right):
    page.insert_text((left, page.rect.height * 0.090), CLINICA['nombre'],
                     fontsize=11, fontname='hebo', color=INK)
    details = '  ·  '.join(part for part in (
        CLINICA.get('direccion'), CLINICA.get('telefono'), CLINICA.get('correo')
    ) if part)
    if details:
        page.insert_text((left, page.rect.height * 0.104), details,
                         fontsize=8, fontname='helv', color=MUTED)
    divider = page.rect.height * 0.112
    page.draw_line(fitz.Point(left, divider), fitz.Point(right, divider),
                   color=(0.72, 0.78, 0.81), width=0.8)


def _center_text(page, text, x0, width, y, size, fontname, color):
    text_width = fitz.get_text_length(text, fontname=fontname, fontsize=size)
    page.insert_text((x0 + max(0, (width - text_width) / 2), y), text,
                     fontsize=size, fontname=fontname, color=color)


class _Pages:
    def __init__(self, template):
        self.document = fitz.open()
        self.reference = fitz.open(template)
        if not self.reference.page_count:
            raise ValueError('La plantilla del reporte no tiene páginas')
        self.page = None
        self.left = 0
        self.right = 0
        self.bottom = 0
        self.y = 0

    def new(self, title, subtitle=''):
        self.document.insert_pdf(self.reference, from_page=0, to_page=0)
        self.page = self.document[-1]
        self.left = self.page.rect.width * 0.075
        self.right = self.page.rect.width * 0.925
        self.bottom = self.page.rect.height * 0.92
        self.y = self.page.rect.height * 0.144
        _draw_letterhead(self.page, self.left, self.right)
        self.page.insert_text((self.left, self.y), title, fontsize=16, fontname='hebo', color=INK)
        self.y += 17
        if subtitle:
            self.line(subtitle, 8.5, MUTED)
        self.y += 4

    def fits(self, height):
        return self.y + height <= self.bottom

    def space(self, height):
        if not self.fits(height):
            self.new('Expediente clínico (continuación)')

    def line(self, text, size=10, color=INK):
        self.space(size + 4)
        self.page.insert_text((self.left, self.y), text, fontsize=size, fontname='helv', color=color)
        self.y += size + 4

    def heading(self, title):
        self.space(37)
        top = self.y + 5
        self.page.draw_rect(fitz.Rect(self.left, top, self.right, top + 18),
                            color=None, fill=(0.93, 0.96, 0.97))
        self.page.insert_text((self.left + 8, top + 13), title, fontsize=10, fontname='hebo', color=INK)
        self.y = top + 32

    def paragraph(self, text, size=10, fallback='No registrado'):
        max_width = self.right - self.left
        for paragraph in _text(text, fallback).splitlines() or ['']:
            words = paragraph.split()
            if not words:
                self.line(' ', size)
                continue
            row = ''
            for word in words:
                candidate = f'{row} {word}'.strip()
                if fitz.get_text_length(candidate, fontname='helv', fontsize=size) <= max_width:
                    row = candidate
                    continue
                if row:
                    self.line(row, size)
                    row = ''
                for letter in word:
                    if fitz.get_text_length(row + letter, fontname='helv', fontsize=size) > max_width and row:
                        self.line(row, size)
                        row = ''
                    row += letter
            if row:
                self.line(row, size)
        self.y += 2

    def field(self, label, value):
        self.paragraph(f'{label}: {_text(value)}', size=10)

    def finish(self):
        return self.document.tobytes(garbage=4, deflate=True)

    def close(self):
        self.document.close()
        self.reference.close()


def generar_pdf_diagnostico(evaluacion, paciente, odontologo, diagnostico, imagenes, template=TEMPLATE):
    """imagenes: secuencia de pares (radiografia, detecciones del último resultado)."""
    pages = _Pages(template)
    try:
        return _render_pdf(pages, evaluacion, paciente, odontologo, diagnostico, imagenes)
    finally:
        pages.close()


def _detection_color(severidad):
    return {'incipiente': (0.12, 0.63, 0.34), 'moderada': (0.92, 0.56, 0.10),
            'avanzada': (0.85, 0.22, 0.20)}.get(severidad, INK)


def _draw_detections(pages, image_rect, pixmap, detecciones):
    scale = image_rect.width / pixmap.width
    for number, finding in enumerate(detecciones, 1):
        try:
            x, y = float(finding.bbox_x), float(finding.bbox_y)
            w, h = float(finding.bbox_ancho), float(finding.bbox_alto)
        except (TypeError, ValueError):
            continue
        if min(x, y, w, h) < 0 or not w or not h or x + w > pixmap.width or y + h > pixmap.height:
            continue
        color = _detection_color(finding.severidad)
        box = fitz.Rect(image_rect.x0 + x * scale, image_rect.y0 + y * scale,
                        image_rect.x0 + (x + w) * scale, image_rect.y0 + (y + h) * scale)
        pages.page.draw_rect(box, color=color, width=1.4)
        label = str(number)
        label_size = 10
        label_width = fitz.get_text_length(label, fontname='hebo', fontsize=label_size)
        badge_width = label_width + 8
        badge_height = 14
        badge_x = box.x0
        badge_y = box.y0 - badge_height - 2
        if badge_y < image_rect.y0:
            badge_y = box.y0 + 2
        if badge_x + badge_width > image_rect.x1:
            badge_x = image_rect.x1 - badge_width
        badge_x = max(image_rect.x0, badge_x)
        badge = fitz.Rect(badge_x, badge_y, badge_x + badge_width, badge_y + badge_height)
        pages.page.draw_rect(badge, color=(1, 1, 1), fill=color, width=0.6)
        pages.page.insert_text((badge.x0 + (badge_width - label_width) / 2, badge.y1 - 3.5),
                               label, fontsize=label_size, fontname='hebo', color=(1, 1, 1))


def _draw_unavailable(pages, max_width):
    fallback_rect = fitz.Rect(pages.left, pages.y, pages.left + max_width, pages.y + 120)
    pages.page.draw_rect(fallback_rect, color=(0.83, 0.87, 0.89), width=0.7)
    pages.page.insert_text((fallback_rect.x0 + 12, fallback_rect.y0 + 22),
                           'Imagen no disponible', fontsize=10, color=MUTED)
    pages.y = fallback_rect.y1 + 8


def _render_radiograph(pages, evaluacion, radiografia, detecciones, index, total, reserve_signature=False):
    subtitle = f'Expediente #{evaluacion.id_evaluacion}  |  Imagen {index} de {total}'
    image_path = _image_path(radiografia.ruta_archivo)
    pixmap = None
    if image_path:
        try:
            pixmap = fitz.Pixmap(str(image_path))
        except (ValueError, RuntimeError):
            pixmap = None

    max_width = pages.right - pages.left
    max_height = pages.page.rect.height * 0.34
    if pixmap:
        scale = min(max_width / pixmap.width, max_height / pixmap.height)
        width, height = pixmap.width * scale, pixmap.height * scale
    else:
        width, height = max_width, 120

    tail_reserve = 104 + (SIGNATURE_HEIGHT + 8 if reserve_signature else 0)
    if index > 1:
        pages.new('EVIDENCIA RADIOGRÁFICA', subtitle)
    elif not pages.fits(height + tail_reserve):
        available = pages.bottom - pages.y - tail_reserve
        if pixmap and available >= MIN_IMAGE_HEIGHT:
            height = available
            width = pixmap.width * (height / pixmap.height)
        else:
            pages.new('EVIDENCIA RADIOGRÁFICA', subtitle)
    pages.heading('RADIOGRAFÍA Y HALLAZGOS')

    if pixmap:
        x0 = pages.left + (max_width - width) / 2
        image_rect = fitz.Rect(x0, pages.y, x0 + width, pages.y + height)
        try:
            pages.page.insert_image(image_rect, filename=str(image_path))
        except (ValueError, RuntimeError):
            pixmap = None
        else:
            pages.page.draw_rect(image_rect, color=(0.83, 0.87, 0.89), width=0.7)
            _draw_detections(pages, image_rect, pixmap, detecciones)
            pages.y = image_rect.y1 + 8

    if pixmap is None:
        _draw_unavailable(pages, max_width)

    pages.heading('DETALLE DE HALLAZGOS')
    if not detecciones:
        pages.paragraph('No se detectaron lesiones en esta radiografía.')
    for number, finding in enumerate(detecciones, 1):
        confidence = f'{float(finding.confianza) * 100:.1f}%' if finding.confianza is not None else 'No disponible'
        pages.paragraph(f'{number}. Severidad: Carie {_text(finding.severidad, "no determinada")}  |  Confianza: {confidence}', size=9)


def _signature(pages, odontologo):
    pages.space(SIGNATURE_HEIGHT + 8)
    width = 240
    x0 = pages.left + (pages.right - pages.left - width) / 2
    y0 = max(pages.y + 8, pages.bottom - SIGNATURE_HEIGHT + 14)
    pages.page.draw_line(fitz.Point(x0, y0), fitz.Point(x0 + width, y0), color=INK, width=0.8)
    name = f'{odontologo.nombres} {odontologo.apellidos}' if odontologo else 'No registrado'
    specialty = _text(odontologo.especialidad) if odontologo else 'No registrada'
    _center_text(pages.page, name, x0, width, y0 + 15, 10, 'hebo', INK)
    _center_text(pages.page, specialty, x0, width, y0 + 29, 9, 'helv', MUTED)
    pages.y = y0 + 34


def _render_pdf(pages, evaluacion, paciente, odontologo, diagnostico, imagenes):
    pages.new('INFORME DE DIAGNÓSTICO',
              f'Expediente #{evaluacion.id_evaluacion}  |  Fecha: {_date(evaluacion.fecha_evaluacion)}')

    pages.heading('DATOS DEL PACIENTE')
    pages.field('Paciente', f'{paciente.nombres} {paciente.apellidos}')
    pages.field('DNI', paciente.dni)
    pages.field('Nacimiento', _date(paciente.fecha_nacimiento))
    edad = _age_at(paciente.fecha_nacimiento, evaluacion.fecha_evaluacion)
    if edad is None:
        edad = paciente.edad
    pages.field('Edad', f'{edad} años' if edad is not None else None)
    pages.field('Sexo', _sexo(getattr(paciente, 'genero', None)))
    if paciente.apoderado:
        pages.field('Apoderado', paciente.apoderado)

    pages.heading('ATENCIÓN CLÍNICA')
    pages.field('Odontólogo', f'{odontologo.nombres} {odontologo.apellidos}' if odontologo else None)
    pages.field('Tipo de visita', evaluacion.tipo_visita)
    pages.field('Motivo de consulta', evaluacion.motivo_consulta)

    pages.heading('DIAGNÓSTICO FINAL')
    pages.paragraph(_meaningful(diagnostico.diagnostico_texto), fallback='No registrado')

    plan = _meaningful(diagnostico.plan_tratamiento)
    if plan:
        pages.heading('PLAN DE TRATAMIENTO')
        pages.paragraph(plan)

    observaciones = _meaningful(diagnostico.observaciones) or _meaningful(evaluacion.observaciones)
    if observaciones:
        pages.heading('OBSERVACIONES')
        pages.paragraph(observaciones)

    for index, (radiografia, detecciones) in enumerate(imagenes, 1):
        _render_radiograph(pages, evaluacion, radiografia, detecciones, index, len(imagenes),
                           reserve_signature=(index == len(imagenes)))

    _signature(pages, odontologo)
    return pages.finish()
