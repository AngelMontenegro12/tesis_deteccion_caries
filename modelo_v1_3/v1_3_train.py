"""
ENTRENAMIENTO V1.2 MEJORADO — YOLOv8 con parámetros optimizados
================================================================
Cambios respecto al V1.2 original:
  1. imgsz: 640 → 800   (mejor detección de lesiones pequeñas)
  2. mosaic: 0.5 → 0.0  (inapropiado para radiografías panorámicas)
  3. copy_paste: 0.0 → 0.3 (más apropiado para imágenes médicas)
  4. patience: 20 → 50  (más tiempo para converger)
  5. epochs: 100 → 150  (más epochs para aprovechar el patience)
  6. cls: 1.0 → 2.0     (penaliza más los errores de clasificación)
  7. Intenta yolov8m primero, cae a yolov8s si hay OOM

Ejecutar desde la raíz del proyecto (donde está api_ia_sonrie/)
"""

import torch
import time
import shutil
import json
from pathlib import Path
from ultralytics import YOLO

# ── VERIFICACIÓN GPU ──────────────────────────────────────────────────────────
print("=" * 60)
print("  VERIFICACIÓN DE HARDWARE")
print("=" * 60)

if not torch.cuda.is_available():
    raise RuntimeError(
        "\n❌ GPU no detectada.\n"
        "   pip uninstall torch torchvision torchaudio -y\n"
        "   pip install torch torchvision torchaudio "
        "--index-url https://download.pytorch.org/whl/cu121\n"
    )

gpu_name = torch.cuda.get_device_name(0)
vram_gb  = torch.cuda.get_device_properties(0).total_memory / 1e9
print(f"✅ GPU:  {gpu_name}")
print(f"✅ VRAM: {vram_gb:.1f} GB")
print(f"✅ CUDA: {torch.version.cuda}")

# ── SELECCIÓN AUTOMÁTICA DE MODELO Y BATCH ────────────────────────────────────

if vram_gb >= 8:
    MODEL_BASE = "yolov8m.pt"
    BATCH      = 8
elif vram_gb >= 6:
    MODEL_BASE = "yolov8m.pt"
    BATCH      = 4
else:
    MODEL_BASE = "yolov8s.pt"
    BATCH      = 2

print(f"✅ Modelo base: {MODEL_BASE}")
print(f"✅ Batch:       {BATCH}")

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
YAML_PATH  = "api_ia_sonrie/dataset/dentex_v1_2.yaml"
RUN_NAME   = "dentex_v1_3_mejorado"
OUTPUT_DIR = "api_ia_sonrie/models"
EPOCHS     = 150       # más epochs para aprovechar patience=50
PATIENCE   = 50        # subido de 20 → 50
IMG_SIZE   = 800       # subido de 640 → 800 (clave para lesiones pequeñas)

print("\n" + "=" * 60)
print("  ENTRENAMIENTO V1.2 MEJORADO")
print("=" * 60)
print(f"  Clases:   Caries | Deep Caries | Periapical Lesion")
print(f"  Dataset:  {YAML_PATH}")
print(f"  Epochs:   {EPOCHS} (patience={PATIENCE})")
print(f"  ImgSz:    {IMG_SIZE}px  ← subido de 640")
print(f"  Mosaic:   0.0  ← desactivado")
print(f"  CopyPaste:0.3  ← activado")
print("=" * 60 + "\n")

# ── ENTRENAMIENTO ─────────────────────────────────────────────────────────────
model = YOLO(MODEL_BASE)
start = time.time()

try:
    results = model.train(
        data=YAML_PATH,
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH,
        workers=0,          # evita WinError 1455 en Windows
        device=0,
        patience=PATIENCE,
        project="api_ia_sonrie/runs/train",
        name=RUN_NAME,
        exist_ok=True,

        # ── AUGMENTATION CORREGIDA PARA RADIOGRAFÍAS ──────────────────────────
        hsv_h=0.0,          # sin cambio de tono (escala de grises)
        hsv_s=0.0,          # sin saturación
        hsv_v=0.4,          # variar brillo (distintos equipos)
        degrees=5.0,        # rotación muy leve
        translate=0.05,     # traslación leve
        scale=0.3,          # escala
        fliplr=0.5,         # flip horizontal (espejo de radiografía)
        flipud=0.0,         # NO flip vertical
        mosaic=0.0,         # DESACTIVADO ← cambio clave
        mixup=0.05,         # reducido de 0.1 a 0.05
        copy_paste=0.3,     # ACTIVADO ← copia instancias entre imágenes

        # ── OPTIMIZADOR ───────────────────────────────────────────────────────
        optimizer="AdamW",
        lr0=0.0005,         # bajado de 0.001 (más estable con dataset pequeño)
        lrf=0.01,
        weight_decay=0.0005,
        warmup_epochs=5,    # subido de 3 → 5 (más warmup con imgsz mayor)

        # ── PÉRDIDAS ──────────────────────────────────────────────────────────
        cls=2.0,            # penaliza más errores de clasificación (default=0.5)
        box=7.5,            # peso de pérdida bbox (default)
        dfl=1.5,            # peso de distribución focal (default)

        # ── GUARDADO ──────────────────────────────────────────────────────────
        save=True,
        save_period=10,
        plots=True,
        verbose=True,
    )

except torch.cuda.OutOfMemoryError:
    print("\n⚠️  CUDA Out of Memory con imgsz=800.")
    print("   Reintentando con imgsz=640 y batch=2...\n")

    model = YOLO(MODEL_BASE)
    results = model.train(
        data=YAML_PATH,
        epochs=EPOCHS,
        imgsz=640,          # fallback
        batch=2,
        workers=0,
        device=0,
        patience=PATIENCE,
        project="api_ia_sonrie/runs/train",
        name=RUN_NAME + "_640fallback",
        exist_ok=True,
        hsv_h=0.0, hsv_s=0.0, hsv_v=0.4,
        degrees=5.0, translate=0.05, scale=0.3,
        fliplr=0.5, flipud=0.0,
        mosaic=0.0, mixup=0.05, copy_paste=0.3,
        optimizer="AdamW", lr0=0.0005, lrf=0.01,
        weight_decay=0.0005, warmup_epochs=5,
        cls=2.0, box=7.5, dfl=1.5,
        save=True, save_period=10, plots=True, verbose=True,
    )
    RUN_NAME = RUN_NAME + "_640fallback"

elapsed = time.time() - start
print(f"\n⏱  Tiempo: {int(elapsed//3600)}h {int((elapsed%3600)//60)}min")

# ── RESULTADOS ────────────────────────────────────────────────────────────────
map50   = results.results_dict.get("metrics/mAP50(B)", 0)
map5095 = results.results_dict.get("metrics/mAP50-95(B)", 0)
prec    = results.results_dict.get("metrics/precision(B)", 0)
rec     = results.results_dict.get("metrics/recall(B)", 0)

print(f"\n📊 mAP50:     {map50:.4f}  (V1.2 original: 0.4291)")
print(f"📊 mAP50-95:  {map5095:.4f}  (V1.2 original: 0.3020)")
print(f"📊 Precision: {prec:.4f}  (V1.2 original: 0.4753)")
print(f"📊 Recall:    {rec:.4f}  (V1.2 original: 0.4385)")

delta = map50 - 0.4291
print(f"\n{'✅ MEJORA' if delta > 0 else '⚠️  SIN MEJORA'}: {delta:+.4f} vs V1.2")

# ── EXPORTAR MODELO ───────────────────────────────────────────────────────────
best_pt = Path(f"api_ia_sonrie/runs/train/{RUN_NAME}/weights/best.pt")
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path("backend/ia_models").mkdir(parents=True, exist_ok=True)

dst_name = "dentex_caries_v1_3_mejorado.pt"
shutil.copy2(best_pt, f"{OUTPUT_DIR}/{dst_name}")
shutil.copy2(best_pt, f"backend/ia_models/{dst_name}")

# Metadata completa
metadata = {
    "version":          "v1.3",
    "model_base":       MODEL_BASE.replace(".pt", ""),
    "map50":            round(map50, 4),
    "map50_95":         round(map5095, 4),
    "precision":        round(prec, 4),
    "recall":           round(rec, 4),
    "vs_v1_2": {
        "map50_delta":   round(map50 - 0.4291, 4),
        "map5095_delta": round(map5095 - 0.3020, 4),
    },
    "hyperparams": {
        "imgsz":       IMG_SIZE,
        "batch":       BATCH,
        "epochs":      EPOCHS,
        "patience":    PATIENCE,
        "mosaic":      0.0,
        "copy_paste":  0.3,
        "lr0":         0.0005,
        "cls_loss":    2.0,
    },
    "gpu":              gpu_name,
    "training_minutes": round(elapsed / 60, 1),
    "nc":               3,
    "classes":          {"0": "Caries", "1": "Deep Caries", "2": "Periapical Lesion"},
    "strategy":         "V1.3 (Base data) + imgsz=800 + no mosaic + copy_paste + patience=50"
}
with open(f"{OUTPUT_DIR}/metadata_v1_3_mejorado.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"\n✅ Modelo guardado: {OUTPUT_DIR}/{dst_name}")
print(f"✅ Metadata:        {OUTPUT_DIR}/metadata_v1_3_mejorado.json")
print("\n▶  Siguiente: python modelo_v1_3/v1_3_evaluate.py")
