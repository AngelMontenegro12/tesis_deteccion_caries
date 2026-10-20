import bcrypt


def hash_password(contrasena):
    if contrasena is None:
        raise ValueError('La contraseña no puede ser nula')

    texto = str(contrasena)

    # bcrypt solo considera los primeros 72 bytes de la contraseña
    datos = texto.encode('utf-8')[:72]
    return bcrypt.hashpw(datos, bcrypt.gensalt()).decode('utf-8')


def verify_password(contrasena_ingresada, contrasena_guardada):
    if contrasena_ingresada is None or contrasena_guardada is None:
        return False

    texto = str(contrasena_ingresada)
    guardada = str(contrasena_guardada)

    # Hash bcrypt almacenado
    if guardada.startswith('$2'):
        try:
            return bcrypt.checkpw(texto.encode('utf-8')[:72], guardada.encode('utf-8'))
        except Exception:
            return False

    # Compatibilidad con registros legados guardados en texto plano
    return guardada == texto
