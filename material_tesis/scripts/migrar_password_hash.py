"""Migra las contraseñas de odontólogos guardadas en texto plano a hash bcrypt.

Uso (desde la raíz del proyecto, con el backend venv activo):
    python material_tesis\\scripts\\migrar_password_hash.py

Es idempotente: solo procesa los registros cuyo contrasena_hash no sea ya un
hash bcrypt (que no empiecen por "$2").
"""

import os
import sys
from pathlib import Path

import bcrypt
from dotenv import load_dotenv

RUTA_PROYECTO = Path(__file__).resolve().parents[2]
RUTA_BACKEND = RUTA_PROYECTO / "backend"

load_dotenv(RUTA_BACKEND / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("[ERROR] No se encontró DATABASE_URL en backend/.env")
    sys.exit(1)

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print("[ERROR] Falta SQLAlchemy. Activa el entorno del backend e instala requirements.")
    sys.exit(1)


def es_hash_bcrypt(valor):
    return isinstance(valor, str) and valor.startswith("$2")


def hash_password(contrasena):
    datos = str(contrasena).encode("utf-8")[:72]
    return bcrypt.hashpw(datos, bcrypt.gensalt()).decode("utf-8")


def main():
    engine = create_engine(DATABASE_URL)

    with engine.begin() as conexion:
        filas = conexion.execute(
            text("SELECT id_odontologo, contrasena_hash FROM odontologos")
        ).fetchall()

        migrados = 0
        omitidos = 0

        for id_odontologo, contrasena_hash in filas:
            if es_hash_bcrypt(contrasena_hash):
                omitidos += 1
                continue

            nuevo_hash = hash_password(contrasena_hash)
            conexion.execute(
                text(
                    "UPDATE odontologos SET contrasena_hash = :hash "
                    "WHERE id_odontologo = :id"
                ),
                {"hash": nuevo_hash, "id": id_odontologo},
            )
            migrados += 1
            print(f"[OK] Odontólogo {id_odontologo} migrado a hash bcrypt.")

    print(f"\nTotal: {migrados} migrados, {omitidos} ya estaban en hash.")


if __name__ == "__main__":
    main()
