import re
from datetime import date


def valid_email(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value.strip()))


def valid_phone(value):
    return isinstance(value, str) and bool(re.fullmatch(r'9[0-9]{8}', value.strip()))


def valid_dni(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[0-9]{8}', value.strip()))


def valid_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return False
    try:
        selected = date.fromisoformat(value)
    except ValueError:
        return False
    return date(1900, 1, 1) <= selected <= date.today()


def patient_error(data, current=None):
    """Validate submitted fields, including required fields after merging an update."""
    merged = {field: getattr(current, field, None) for field in (
        'nombres', 'apellidos', 'dni', 'fecha_nacimiento', 'genero', 'telefono',
        'correo', 'apoderado', 'telefono_apoderado'
    )} if current else {}
    merged.update(data)

    for field, label in (('nombres', 'Los nombres'), ('apellidos', 'Los apellidos')):
        if len(str(merged.get(field) or '').strip()) < 2:
            return f'{label} son requeridos (mínimo 2 caracteres)'
    if not valid_dni(merged.get('dni')):
        return 'El DNI debe tener exactamente 8 dígitos'
    if not valid_date(str(merged.get('fecha_nacimiento') or '')):
        return 'La fecha de nacimiento debe estar entre 1900 y hoy'
    if merged.get('genero') not in ('M', 'F', 'Otro'):
        return 'El género es requerido'
    if not valid_phone(merged.get('telefono')):
        return 'El teléfono es requerido (9 dígitos y debe empezar en 9)'
    if merged.get('correo') and not valid_email(merged['correo']):
        return 'Ingrese un correo electrónico válido'

    birth = merged['fecha_nacimiento']
    if isinstance(birth, str):
        birth = date.fromisoformat(birth)
    today = date.today()
    minor = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day)) < 18
    if minor and not str(merged.get('apoderado') or '').strip():
        return 'El nombre del apoderado es requerido para menores'
    if minor and not merged.get('telefono_apoderado'):
        return 'El teléfono del apoderado es requerido (9 dígitos y debe empezar en 9)'
    if merged.get('telefono_apoderado') and not valid_phone(merged['telefono_apoderado']):
        return 'El teléfono del apoderado debe tener 9 dígitos y empezar en 9'
    return None
