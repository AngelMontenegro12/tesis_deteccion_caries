class ValidationUnavailable(Exception):
    """No se puede confirmar la validación; no equivale a una imagen inválida."""


def validation_log(*args, **kwargs):
    # Un fallo de codificación de la consola de Windows no es un fallo del modelo.
    try:
        print(*args, **kwargs)
    except (UnicodeError, OSError):
        pass
