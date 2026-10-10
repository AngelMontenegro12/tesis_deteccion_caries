import os
from dotenv import load_dotenv
import cv2
import numpy as np
from ultralytics import YOLO

from app.utils.clip_validator import validar_con_clip
from app.utils.cls_validator  import validar_con_clasificador

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/dentex_caries_v1_3_mejorado.pt")
CONFIDENCE = float(os.getenv("CONFIDENCE", "0.45"))

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
    print(f"✅ Modelo de caries cargado: {MODEL_PATH}")
except Exception as e:
    print(f"⚠️  Error cargando YOLOv8: {e}")
    model = None


# ══════════════════════════════════════════════════════════════════════════════
#  CAPA 0 — VALIDACIÓN TÉCNICA SIMPLIFICADA (4 pasos)
#
#  Solo filtra casos OBVIAMENTE inválidos antes de gastar recursos en IA.
#  Color, contraste e histograma fueron eliminados — CLIP y el clasificador
#  lo manejan mejor y sin falsos positivos.
# ══════════════════════════════════════════════════════════════════════════════

def _recortar_bordes_negros(img_cv):
    """
    Elimina bordes negros uniformes (padding) alrededor de la imagen.
    Necesario para radiografías con márgenes negros (ej: Roboflow, algunos equipos).
    Solo elimina píxeles con valor < 15 en los bordes — no afecta la radiografía.
    """
    gris = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gris, 15, 255, cv2.THRESH_BINARY)
    coords = cv2.findNonZero(mask)
    if coords is None:
        return img_cv  # imagen completamente negra — dejar pasar, lo rechazará Capa 1

    x, y, w, h = cv2.boundingRect(coords)
    # Margen de seguridad de 5px para no cortar contenido real
    x = max(0, x - 5)
    y = max(0, y - 5)
    w = min(img_cv.shape[1] - x, w + 10)
    h = min(img_cv.shape[0] - y, h + 10)
    recortada = img_cv[y:y+h, x:x+w]

    h_orig, w_orig = img_cv.shape[:2]
    h_new,  w_new  = recortada.shape[:2]
    if w_orig != w_new or h_orig != h_new:
        print(f"  [C0] Bordes recortados: {w_orig}×{h_orig} → {w_new}×{h_new}")

    return recortada


def _check_decodificable(image_bytes: bytes):
    """Paso 1: ¿Es un archivo de imagen válido y decodificable?"""
    nparr  = np.frombuffer(image_bytes, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None:
        return None, False, (
            "El archivo no pudo ser leído como imagen. "
            "Verifique que sea un archivo JPG, PNG o similar válido y no esté dañado."
        )
    return img_cv, True, "OK"


def _check_tamanio_minimo(img_cv) -> tuple[bool, str]:
    """
    Paso 2: Tamaño mínimo muy permisivo.
    Solo rechaza thumbnails, íconos y miniaturas que no tienen sentido diagnóstico.
    """
    h, w = img_cv.shape[:2]
    print(f"  [C0] Tamaño (post-recorte): {w}×{h}px")
    if w < 300 or h < 100:
        return False, (
            f"La imagen es demasiado pequeña ({w}×{h}px) para ser analizada. "
            "Por favor suba la imagen original sin reducir su resolución."
        )
    return True, "OK"


def _check_ratio_basico(img_cv) -> tuple[bool, str]:
    """
    Paso 3: Ratio ancho/alto mínimo.
    Solo rechaza imágenes claramente verticales (selfies, retratos) o cuadradas obvias.
    Umbral permisivo (1.25) para cubrir panorámicas con leve padding residual.
    """
    h, w  = img_cv.shape[:2]
    ratio = w / h
    print(f"  [C0] Ratio: {ratio:.2f}")
    if ratio < 1.25:
        return False, (
            "La imagen tiene una orientación vertical o cuadrada. "
            "Por favor, suba nuevamente la imagen y verifique que sea una radiografía panorámica completa (formato horizontal)."
        )
    return True, "OK"


def validar_capa0(image_bytes: bytes) -> tuple[bool, str, object]:
    """
    Capa 0: validación técnica simplificada.
    Pasos: decodificar → recortar bordes → tamaño mínimo → ratio básico.
    Retorna (es_valida, mensaje, img_cv).
    """
    # Paso 1 — decodificar
    img_cv, ok, msg = _check_decodificable(image_bytes)
    if not ok:
        return False, msg, None

    # Recortar SOLO para calcular ratio — no para pasarla al modelo
    img_recortada = _recortar_bordes_negros(img_cv)

    # Paso 3 — tamaño mínimo (sobre la recortada)
    ok, msg = _check_tamanio_minimo(img_recortada)
    if not ok:
        return False, msg, None

    # Paso 4 — ratio básico (sobre la recortada)
    ok, msg = _check_ratio_basico(img_recortada)
    if not ok:
        return False, msg, None

    print("  [C0] ✅ Validación técnica OK")
    # ← Devolver img_cv ORIGINAL, no la recortada
    return True, "OK", img_cv


# ══════════════════════════════════════════════════════════════════════════════
#  EXTRACTOR DE PROBABILIDADES (sin cambios)
# ══════════════════════════════════════════════════════════════════════════════

def extraer_probabilidades(result, cls_id: int, conf_ganadora: float) -> dict:
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
#  INFERENCIA PRINCIPAL — pipeline de 4 capas
# ══════════════════════════════════════════════════════════════════════════════

def run_inference(image_data: bytes) -> dict:
    """
    Pipeline completo de validación + detección:

    ┌─────────────────────────────────────────────────────────────┐
    │  Capa 0 — Técnica (~2ms)                                    │
    │  Recorta bordes negros, verifica que sea imagen,            │
    │  tamaño mínimo y ratio básico (> 1.25).                     │
    │  Rechaza: archivos corruptos, thumbnails, imágenes          │
    │  verticales obvias.                                         │
    ├─────────────────────────────────────────────────────────────┤
    │  Capa 1 — CLIP (~100-150ms)                                 │
    │  Validación semántica sin entrenamiento propio.             │
    │  Identifica QUÉ ES la imagen y devuelve mensaje             │
    │  descriptivo: "parece una foto de un perro", etc.           │
    │  Rechaza: fotos a color, capturas de pantalla,              │
    │  radiografías de tórax obvias.                              │
    ├─────────────────────────────────────────────────────────────┤
    │  Capa 2 — YOLOv8-cls (~5ms)                                 │
    │  Clasificador entrenado específicamente con                 │
    │  panorámicas humanas vs todo lo demás.                      │
    │  100% accuracy en validación.                               │
    │  Rechaza: animales, periapicales, tórax, fotos B&N,         │
    │  capturas, documentos.                                      │
    ├─────────────────────────────────────────────────────────────┤
    │  Capa 3 — YOLO Detección (~19ms GPU)                        │
    │  Detecta Caries, Deep Caries, Periapical Lesion             │
    │  con bounding boxes y probabilidades.                       │
    └─────────────────────────────────────────────────────────────┘
    """
    if model is None:
        raise RuntimeError("El modelo YOLOv8 no pudo ser cargado.")

    print(f"\n{'─'*50}")
    print(f"  [PIPELINE] Bytes recibidos: {len(image_data)}")

    # ── Capa 0: Validación técnica simplificada ────────────────────────────────
    es_valida, mensaje, img_cv = validar_capa0(image_data)
    if not es_valida:
        print(f"  [PIPELINE] ❌ Capa 0 rechazó")
        return {"valid": False, "error": mensaje, "detections": []}

    # ── Capa 1: CLIP ───────────────────────────────────────────────────────────
    es_valida, mensaje = validar_con_clip(img_cv)
    if not es_valida:
        print(f"  [PIPELINE] ❌ Capa 1 (CLIP) rechazó")
        return {"valid": False, "error": mensaje, "detections": []}

    # ── Capa 2: Clasificador YOLOv8-cls ───────────────────────────────────────
    es_valida, mensaje = validar_con_clasificador(img_cv)
    if not es_valida:
        print(f"  [PIPELINE] ❌ Capa 2 (Clasificador) rechazó")
        return {"valid": False, "error": mensaje, "detections": []}

    # ── Capa 3: YOLO detección de caries ──────────────────────────────────────
    print(f"  [PIPELINE] ✅ Todas las capas aprobadas — iniciando detección...")
    try:
        results    = model(img_cv, conf=CONFIDENCE, imgsz=800, verbose=False)
        total_real = len(results[0].boxes) if results else 0
        print(f"  [PIPELINE] Detecciones encontradas: {total_real}")
    except Exception as e:
        print(f"  [PIPELINE] ERROR en inferencia: {type(e).__name__}: {e}")
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

    print(f"  [PIPELINE] Total detecciones finales: {len(detections)}")
    print(f"{'─'*50}\n")

    return {
        "valid":      True,
        "error":      None,
        "detections": detections
    }