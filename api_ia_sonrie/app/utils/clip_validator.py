"""
app/utils/clip_validator.py
---------------------------
Validación semántica con CLIP (OpenAI) — Capa 1 del firewall de validación.
Identifica QUÉ ES la imagen y devuelve mensajes descriptivos al usuario.
No requiere entrenamiento — CLIP ya conoce conceptos visuales.

Corre ANTES del clasificador YOLOv8-cls (Capa 2, pendiente de entrenar)
y DESPUÉS de la validación técnica de 6 pasos (Capa 0).
"""

import torch
import cv2
import numpy as np
from PIL import Image as PILImage

# Carga lazy — se importa solo cuando se necesita
_clip_model     = None
_clip_processor = None
_clip_loaded    = False


def _load_clip():
    """Carga CLIP una sola vez y lo guarda en memoria."""
    global _clip_model, _clip_processor, _clip_loaded

    if _clip_loaded:
        return _clip_model is not None

    try:
        from transformers import CLIPModel, CLIPProcessor
        print("  [CLIP] Cargando modelo...")
        _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model.eval()
        _clip_loaded = True
        print("  [CLIP] ✅ Modelo cargado correctamente")
        return True
    except Exception as e:
        print(f"  [CLIP] ⚠️ No se pudo cargar: {e}")
        _clip_loaded = True   # marcar como intentado para no reintentar
        return False


# ── Descripciones que CLIP evaluará ───────────────────────────────────────────
# IMPORTANTE: el índice 0 siempre debe ser la clase VÁLIDA
CLIP_LABELS = [
    "a dental panoramic X-ray radiograph of a human showing teeth and jaw",
    "a dental X-ray or radiograph of an animal such as a dog, cat or monkey",
    "a chest X-ray or lung radiograph or spine radiograph",
    "a photograph or portrait of a person, animal or landscape",
    "a screenshot of a website, application or document",
    "a dental periapical X-ray or bitewing X-ray showing individual teeth",
    "a black and white photograph or grayscale image",
    "a medical scan such as MRI or CT scan",
]

# Mensajes en español para el usuario — None significa que es válida
CLIP_MENSAJES = {
    0: None,   # válida — pasa
    1: "La imagen parece ser una radiografía dental de un animal (perro, gato o primate), no de un humano.",
    2: "La imagen parece ser una radiografía de tórax, columna u otra parte del cuerpo, no una panorámica dental.",
    3: "La imagen parece ser una fotografía, no una radiografía dental panorámica.",
    4: "La imagen parece ser una captura de pantalla o documento, no una radiografía.",
    5: "La imagen parece ser una imágen dental, radiografía dental periapical o bite-wing. Este sistema solo acepta panorámicas completas.",
    6: "La imagen parece ser una fotografía en blanco y negro, no una radiografía panorámica dental.",
    7: "La imagen parece ser un estudio de imagen médica (MRI/CT), no una radiografía panorámica dental.",
}

# Umbral mínimo de confianza para la clase válida (índice 0)
# Si la clase válida tiene score < THRESHOLD → rechazar aunque sea la "ganadora"
CLIP_THRESHOLD = 0.25


def validar_con_clip(img_cv) -> tuple[bool, str]:
    """
    Valida semánticamente si la imagen es una radiografía panorámica dental humana.

    Parámetros:
        img_cv: imagen en formato OpenCV (numpy array BGR)

    Retorna:
        (es_valida: bool, mensaje: str)
        - Si es válida: (True, "OK")
        - Si no es válida: (False, "Mensaje descriptivo para el usuario")
        - Si CLIP no está disponible: (True, "OK") — no bloquear por fallo de CLIP
    """
    disponible = _load_clip()
    if not disponible:
        # CLIP no está disponible — dejar pasar (no bloquear el sistema)
        return True, "OK"

    try:
        # Convertir BGR (OpenCV) → RGB (PIL)
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        pil_img = PILImage.fromarray(img_rgb)

        # Procesar con CLIP
        inputs = _clip_processor(
            text=CLIP_LABELS,
            images=pil_img,
            return_tensors="pt",
            padding=True
        )

        with torch.no_grad():
            outputs = _clip_model(**inputs)
            logits  = outputs.logits_per_image   # shape: [1, n_labels]
            probs   = logits.softmax(dim=1)[0]   # probabilidades normalizadas

        # Scores de cada label
        scores = [float(probs[i]) for i in range(len(CLIP_LABELS))]
        idx_ganador  = int(probs.argmax())
        score_valida = scores[0]   # score de "panorámica humana"

        print(f"  [CLIP] Score panorámica humana: {score_valida:.3f} (umbral: {CLIP_THRESHOLD})")
        print(f"  [CLIP] Label ganador: [{idx_ganador}] '{CLIP_LABELS[idx_ganador]}' ({scores[idx_ganador]:.3f})")

        # ── Decisión ──────────────────────────────────────────────────────────

        # Caso 1: la clase válida gana con confianza suficiente → OK
        if idx_ganador == 0 and score_valida >= CLIP_THRESHOLD:
            print("  [CLIP] ✅ Aprobada como panorámica dental humana")
            return True, "OK"

        # Caso 2: la clase válida tiene score aceptable aunque no sea la ganadora
        # (CLIP puede dudar entre "panorámica humana" y "periapical" en algunos casos)
        if score_valida >= CLIP_THRESHOLD and idx_ganador not in [3, 4, 6]:
            print(f"  [CLIP] ✅ Score válido ({score_valida:.3f}) aunque no ganó — aprobada")
            return True, "OK"

        # Caso 3: rechazar con mensaje específico según el label ganador
        mensaje = CLIP_MENSAJES.get(idx_ganador)
        if mensaje:
            print(f"  [CLIP] ❌ Rechazada: {mensaje}")
            return False, mensaje

        # Caso 4: score de válida muy bajo y no hay mensaje específico
        if score_valida < CLIP_THRESHOLD:
            msg = (
                f"La imagen no parece ser una radiografía panorámica dental humana "
                f"(confianza={score_valida:.0%}). Verifique que sea una panorámica completa."
            )
            print(f"  [CLIP] ❌ Rechazada por bajo score: {msg}")
            return False, msg

        # Fallback: si hay duda, dejar pasar
        print("  [CLIP] ⚠️  Resultado ambiguo — dejando pasar")
        return True, "OK"

    except Exception as e:
        print(f"  [CLIP] ⚠️  Error durante validación: {e} — dejando pasar")
        return True, "OK"   # Nunca bloquear por error interno de CLIP