import os
from dotenv import load_dotenv
import cv2
import numpy as np
from ultralytics import YOLO

# ── NUEVO: importar validador CLIP ─────────────────────────────────────────────
from app.utils.clip_validator import validar_con_clip

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/dentex_caries_v1_3_mejorado.pt")
CONFIDENCE = float(os.getenv("CONFIDENCE", 0.45))

CLASS_MAP = {
    0: "Caries",
    1: "Deep Caries",
    2: "Periapical Lesion"
}

CLASS_DISPLAY = {
    "Caries":            "Caries Incipiente",
    "Deep Caries":       "Caries Profunda",
    "Periapical Lesion": "Caries Periapical (Avanzada)"
}

try:
    model = YOLO(MODEL_PATH)
    print(f"Modelo cargado: {MODEL_PATH}")
except Exception as e:
    print(f"Error cargando YOLOv8: {e}")
    model = None


# ══════════════════════════════════════════════════════════════════════════════
#  VALIDACIÓN TÉCNICA — 6 PASOS (sin cambios respecto a tu versión actual)
# ══════════════════════════════════════════════════════════════════════════════

def _check_decodificable(image_bytes: bytes):
    nparr  = np.frombuffer(image_bytes, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None:
        return None, False, "El archivo no pudo ser leído como imagen. Verifique que sea un archivo JPG o PNG válido."
    return img_cv, True, "OK"


def _check_tamanio(img_cv) -> tuple[bool, str]:
    height, width = img_cv.shape[:2]
    if width < 400 or height < 150:
        return False, (
            f"Imagen demasiado pequeña ({width}×{height}px). "
            "Una radiografía panorámica estándar tiene al menos 1000×400px."
        )
    return True, "OK"


def _check_ratio_panoramico(img_cv) -> tuple[bool, str]:
    height, width = img_cv.shape[:2]
    ratio = width / height
    print(f"  [VAL] Tamaño: {width}×{height} | Ratio: {ratio:.2f}")
    if ratio < 1.5:
        tipo = "vertical (como un retrato)" if ratio < 1.0 else "casi cuadrada"
        return False, (
            f"La imagen tiene forma {tipo} (ratio={ratio:.2f}). "
            "Las radiografías panorámicas son siempre horizontales y anchas. "
            "Si tiene una radiografía bite-wing o periapical, este sistema "
            "solo procesa panorámicas completas."
        )
    if ratio > 6.0:
        return False, (
            f"La imagen es demasiado ancha (ratio={ratio:.2f}). "
            "No corresponde al formato de una radiografía panorámica estándar."
        )
    return True, "OK"


def _check_escala_grises(img_cv) -> tuple[bool, str]:
    b = img_cv[:, :, 0].astype(np.int32)
    g = img_cv[:, :, 1].astype(np.int32)
    r = img_cv[:, :, 2].astype(np.int32)
    sat = (np.abs(r - g) + np.abs(g - b) + np.abs(r - b)).mean() / 3
    print(f"  [VAL] Saturación de color: {sat:.2f} (umbral: 60)")
    if sat > 60:   # ← subido de 30 a 60 para cubrir radiografías con tinte
        return False, (
            "La imagen contiene colores muy saturados "
            f"(índice={sat:.1f}, máximo permitido=60). "
            "Las radiografías dentales son en escala de grises o con leve tinte de equipo."
        )
    return True, "OK"


def _check_contraste_radiografico(img_cv) -> tuple[bool, str]:
    gray     = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    mean_val = float(np.mean(gray))
    std_dev  = float(np.std(gray))
    print(f"  [VAL] Brillo medio: {mean_val:.1f} | Desv. estándar: {std_dev:.1f}")
    if mean_val < 8:
        return False, "La imagen es casi completamente negra. Verifique que el archivo sea correcto."
    if mean_val > 247:
        return False, "La imagen es casi completamente blanca. Verifique que el archivo sea correcto."
    if std_dev < 18:
        return False, (
            f"La imagen no tiene suficiente variación de intensidad (σ={std_dev:.1f}). "
            "No presenta el contraste típico de una radiografía."
        )
    return True, "OK"


def _check_distribucion_histograma(img_cv) -> tuple[bool, str]:
    gray      = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    hist      = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
    hist_norm = hist / hist.sum()

    pct_muy_oscuro = hist_norm[:40].sum()
    pct_oscuro     = hist_norm[:60].sum()
    pct_claro      = hist_norm[200:].sum()
    pct_medio      = hist_norm[80:170].sum()

    print(
        f"  [VAL] Hist — muy_oscuro: {pct_muy_oscuro:.2f} | "
        f"oscuro: {pct_oscuro:.2f} | medio: {pct_medio:.2f} | claro: {pct_claro:.2f}"
    )

    if pct_medio > 0.70 and pct_oscuro < 0.05 and pct_claro < 0.05:
        return False, (
            "La distribución de intensidades no corresponde a una radiografía "
            f"(tonos medios={pct_medio:.0%}, oscuros={pct_oscuro:.0%}, claros={pct_claro:.0%}). "
            "Podría ser una fotografía convertida a escala de grises."
        )
    if pct_claro < 0.01:
        return False, (
            f"La imagen no tiene suficientes zonas claras (claros={pct_claro:.1%}, mínimo=1.0%). "
            "Una radiografía panorámica siempre tiene estructuras dentales visibles."
        )
    if pct_oscuro < 0.10:
        return False, (
            f"La imagen no tiene suficientes zonas oscuras (oscuros={pct_oscuro:.1%}, mínimo=10%). "
            "Una radiografía panorámica siempre tiene fondo oscuro."
        )
    if pct_muy_oscuro > 0.80 and pct_claro < 0.03:
        return False, (
            "La imagen tiene fondo casi completamente negro sin estructuras dentales claras."
        )
    return True, "OK"


def validar_imagen_panoramica(image_bytes: bytes) -> tuple[bool, str, object]:
    """Ejecuta los 6 pasos de validación técnica en orden."""
    img_cv, ok, msg = _check_decodificable(image_bytes)
    if not ok:
        return False, msg, None

    for check_fn in [
        _check_tamanio,
        _check_ratio_panoramico,
        _check_escala_grises,
        _check_contraste_radiografico,
        _check_distribucion_histograma,
    ]:
        ok, msg = check_fn(img_cv)
        if not ok:
            return False, msg, None

    print("  [VAL] ✅ Validación técnica aprobada")
    return True, "OK", img_cv


# ══════════════════════════════════════════════════════════════════════════════
#  EXTRACTOR DE PROBABILIDADES (sin cambios)
# ══════════════════════════════════════════════════════════════════════════════

def extraer_probabilidades(result, cls_id, conf_ganadora):
    class_probs = {}
    try:
        raw          = result.boxes.data
        confs_tensor = result.boxes.conf.cpu().numpy()
        cls_tensor   = result.boxes.cls.cpu().numpy()

        idx = None
        for i, (conf_val, cls_val) in enumerate(zip(confs_tensor, cls_tensor)):
            if abs(float(conf_val) - conf_ganadora) < 1e-4 and int(cls_val) == cls_id:
                idx = i
                break

        if idx is not None and raw.shape[1] > 6:
            scores_raw = raw[idx, 4:4 + len(CLASS_MAP)].cpu().numpy()
            total = float(scores_raw.sum())
            if total > 0:
                for class_index, class_name in CLASS_MAP.items():
                    class_probs[CLASS_DISPLAY[class_name]] = round(
                        float(scores_raw[class_index] / total), 4
                    )
                return class_probs
    except Exception:
        pass

    restantes = max(0.0, 1.0 - conf_ganadora)
    otras_ids  = [i for i in CLASS_MAP if i != cls_id]
    class_probs[CLASS_DISPLAY[CLASS_MAP[cls_id]]]       = round(conf_ganadora, 4)
    class_probs[CLASS_DISPLAY[CLASS_MAP[otras_ids[0]]]] = round(restantes * 0.65, 4)
    class_probs[CLASS_DISPLAY[CLASS_MAP[otras_ids[1]]]] = round(restantes * 0.35, 4)
    return class_probs


# ══════════════════════════════════════════════════════════════════════════════
#  INFERENCIA PRINCIPAL — pipeline de 3 capas
# ══════════════════════════════════════════════════════════════════════════════

def run_inference(image_data: bytes) -> dict:
    """
    Pipeline completo de validación + detección:

      Capa 0 — Validación técnica (6 pasos): ratio, color, contraste, histograma
      Capa 1 — CLIP: validación semántica con mensaje descriptivo
      Capa 2 — YOLOv8-cls (pendiente): clasificador entrenado panorámica/no-panorámica
      Capa 3 — YOLOv8 detección: detecta Caries, Deep Caries, Periapical Lesion
    """
    if model is None:
        raise RuntimeError("El modelo YOLOv8 no pudo ser cargado.")

    print(f"  [DEBUG] Bytes recibidos: {len(image_data)}")

    # ── Capa 0.5: Decodificar ──────────────────────────────────────────────────
    from app.services.detector import _check_decodificable
    img_cv, decodificable, msg_dec = _check_decodificable(image_data)
    if not decodificable:
        return {"valid": False, "error": "El archivo no pudo ser leído como imagen. Verifique que sea un archivo válido.", "detections": []}

    # ── Capa 1: CLIP — validación semántica ────────────────────────────────────
    es_valida_clip, mensaje_clip = validar_con_clip(img_cv)
    if not es_valida_clip:
        print(f"  [DEBUG] ❌ Capa 1 (CLIP) rechazó: {mensaje_clip}")
        return {"valid": False, "error": mensaje_clip, "detections": []}

    # ── Capa 0: Validación técnica ─────────────────────────────────────────────
    es_valida, mensaje, _ = validar_imagen_panoramica(image_data)
    if not es_valida:
        print(f"  [DEBUG] ❌ Capa 0 rechazó: {mensaje}")
        return {"valid": False, "error": "Parece que la imagen que se está subiendo no es una radiografía panorámica, vuelva a subir otra imagen correctamente.", "detections": []}

    # ── Capa 2: YOLOv8-cls (comentado hasta entrenar el clasificador) ──────────
    # from app.utils.cls_validator import validar_con_clasificador
    # es_valida_cls, mensaje_cls = validar_con_clasificador(img_cv)
    # if not es_valida_cls:
    #     return {"valid": False, "error": mensaje_cls, "detections": []}

    # ── Capa 3: YOLO detección de caries ──────────────────────────────────────
    print(f"  [DEBUG] Iniciando inferencia con conf={CONFIDENCE}...")
    try:
        results    = model(img_cv, conf=CONFIDENCE, imgsz=800, verbose=False)
        total_real = len(results[0].boxes) if results else 0
        print(f"  [DEBUG] Detecciones con conf={CONFIDENCE}: {total_real}")
    except Exception as e:
        print(f"  [DEBUG] ERROR en inferencia: {type(e).__name__}: {e}")
        return {
            "valid": True,
            "error": f"Error interno durante la inferencia: {str(e)}",
            "detections": []
        }

    detections = []

    if results and len(results) > 0:
        result = results[0]
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf     = float(box.conf[0])
            cls_id   = int(box.cls[0])
            cls_name = CLASS_MAP.get(cls_id, "Desconocida")
            cls_disp = CLASS_DISPLAY.get(cls_name, cls_name)

            class_probs = extraer_probabilidades(result, cls_id, conf)

            detections.append({
                "class":               cls_name,
                "class_display":       cls_disp,
                "confidence":          round(conf, 4),
                "class_probabilities": class_probs,
                "bbox":                [x1, y1, x2, y2]
            })

    print(f"  [DEBUG] Total detecciones finales: {len(detections)}")
    return {
        "valid":      True,
        "error":      None,
        "detections": detections
    }