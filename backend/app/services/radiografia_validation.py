"""Prevalidación de nuevas cargas; no persiste ni modifica imágenes existentes."""
from io import BytesIO
import os

import requests
from PIL import Image, UnidentifiedImageError


class RadiografiaValidationError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def validar_archivo(file):
    extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.webp', '.gif'}
    if os.path.splitext(file.filename or '')[1].lower() not in extensions:
        raise RadiografiaValidationError('Formato no permitido. Selecciona una imagen JPG, PNG u otro formato de imagen compatible.')
    if not (file.mimetype or '').startswith('image/'):
        raise RadiografiaValidationError('El archivo debe ser una imagen radiográfica.')
    content = file.read()
    file.stream.seek(0)
    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
        with Image.open(BytesIO(content)) as image:
            image.load()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise RadiografiaValidationError('El archivo está dañado o no se puede leer como imagen.') from None

    url = os.getenv('IA_VALIDATION_URL') or os.getenv(
        'IA_API_URL', 'http://127.0.0.1:8000/api/predict').rsplit('/', 1)[0] + '/validate'
    try:
        response = requests.post(url, files={'file': (file.filename, content, file.mimetype)}, timeout=60)
        if not response.ok:
            raise RadiografiaValidationError('El servicio de validación no está disponible. Vuelve a intentarlo.', 503)
        data = response.json()
    except (requests.RequestException, ValueError):
        raise RadiografiaValidationError('No se pudo contactar con el servicio de validación. Vuelve a intentarlo.', 503) from None
    if not isinstance(data, dict):
        raise RadiografiaValidationError('El servicio de validación devolvió una respuesta inesperada.', 503)
    if data.get('valid') is False:
        raise RadiografiaValidationError(data.get('error') or data.get('message') or 'La imagen no es una radiografía panorámica válida.')
    if data.get('valid') is not True or data.get('error') not in (None, '') or data.get('status') in ('error', 'unavailable'):
        raise RadiografiaValidationError('El servicio no confirmó la validez de la imagen. Vuelve a intentarlo.', 503)
