"""
app/utils/cls_validator.py
--------------------------
Capa 2 del firewall de validación — Clasificador YOLOv8n-cls entrenado.
Clasifica binariamente: valida (panorámica humana) vs invalida (todo lo demás).

Corre DESPUÉS de CLIP (Capa 1) y ANTES del modelo de caries (Capa 3).
"""

from pathlib import Path
import os

# Ruta al modelo clasificador — se lee del .env o usa ruta por defecto
from dotenv import load_dotenv
load_dotenv()

CLASIFICADOR_PATH = os.getenv(
    "CLASIFICADOR_PATH",
    "models/clasificador_panoramica.pt"
)

# Umbral de confianza para la clase 'valida'
# 100% accuracy → usamos 0.60 (permisivo, evita falsos rechazos)
CLASIFICADOR_THRESHOLD = float(os.getenv("CLASIFICADOR_THRESHOLD", "0.60"))

# Índice de la clase 'valida' según YOLOv8-cls (orden alfabético)
# invalida=0, valida=1
IDX_VALIDA = 1

_cls_model  = None
_cls_loaded = False


def _load_clasificador():
    """Carga el clasificador una sola vez en memoria."""
    global _cls_model, _cls_loaded

    if _cls_loaded:
        return _cls_model is not None

    try:
        from ultralytics import YOLO
        print(f"  [CLS] Cargando clasificador: {CLASIFICADOR_PATH}")
        _cls_model  = YOLO(CLASIFICADOR_PATH)
        _cls_loaded = True
        print("  [CLS] ✅ Clasificador cargado correctamente")
        return True
    except Exception as e:
        print(f"  [CLS] ⚠️  No se pudo cargar: {e}")
        _cls_loaded = True
        return False


def validar_con_clasificador(img_cv) -> tuple[bool, str]:
    """
    Clasifica la imagen como 'valida' (panorámica humana) o 'invalida'.

    Parámetros:
        img_cv: imagen en formato OpenCV (numpy array BGR)

    Retorna:
        (es_valida: bool, mensaje: str)
        - Si es válida:   (True, "OK")
        - Si es inválida: (False, "Mensaje descriptivo")
        - Si falla:       (True, "OK") — nunca bloquear por error interno
    """
    disponible = _load_clasificador()
    if not disponible:
        return True, "OK"

    try:
        results = _cls_model(img_cv, verbose=False, imgsz=224)

        if not results or len(results) == 0:
            return True, "OK"

        probs       = results[0].probs
        idx_pred    = int(probs.top1)
        conf_pred   = float(probs.top1conf)
        score_valida = float(probs.data[IDX_VALIDA])

        print(f"  [CLS] Clase predicha: {'valida' if idx_pred == IDX_VALIDA else 'invalida'} "
              f"(conf={conf_pred:.3f})")
        print(f"  [CLS] Score clase 'valida': {score_valida:.3f} "
              f"(umbral: {CLASIFICADOR_THRESHOLD})")

        # Caso 1: predijo 'valida' con confianza suficiente → OK
        if idx_pred == IDX_VALIDA and score_valida >= CLASIFICADOR_THRESHOLD:
            print("  [CLS] ✅ Aprobada como panorámica dental humana")
            return True, "OK"

        # Caso 2: predijo 'invalida' o score bajo → rechazar
        if idx_pred != IDX_VALIDA:
            msg = (
                "La imagen ingresada no parece ser una radiografía panorámica dental. "
                "Por favor, asegúrese de subir una radiografía panorámica correcta."
            )
            print(f"  [CLS] ❌ Rechazada: clase invalida detectada")
            return False, msg

        # Caso 3: predijo valida pero con confianza baja
        msg = (
            "No se pudo confirmar con certeza que la imagen sea una radiografía panorámica dental. "
            "Por favor, intente subir una imagen de mejor calidad o más clara."
        )
        print(f"  [CLS] ❌ Rechazada: score bajo ({score_valida:.3f})")
        return False, msg

    except Exception as e:
        print(f"  [CLS] ⚠️  Error: {e} — dejando pasar")
        return True, "OK"
