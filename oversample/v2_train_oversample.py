"""
PASO 2 — Entrenamiento V2: Oversample (3 clases)
=================================================
Ejecutar desde la raíz de api_ia_sonrie/
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
        "\n❌ GPU no detectada. Solución:\n"
        "   pip uninstall torch torchvision torchaudio -y\n"
        "   pip install torch torchvision torchaudio "
        "--index-url https://download.pytorch.org/whl/cu121\n"
    )

gpu_name = torch.cuda.get_device_name(0)
vram_gb  = torch.cuda.get_device_properties(0).total_memory / 1e9
print(f"✅ GPU:  {gpu_name}")
print(f"✅ VRAM: {vram_gb:.1f} GB")
print(f"✅ CUDA: {torch.version.cuda}")

# Batch automático según VRAM
BATCH = 16 if vram_gb >= 8 else (8 if vram_gb >= 6 else 4)
print(f"✅ Batch: {BATCH}  (RTX 3050 4GB → 4)")

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
YAML_PATH   = "api_ia_sonrie/dataset/processed_v2_oversample/dentex_v2_oversample.yaml"
RUN_NAME    = "dentex_v2_oversample"
OUTPUT_DIR  = "api_ia_sonrie/models"
EPOCHS      = 100
PATIENCE    = 20
IMG_SIZE    = 640

print("\n" + "=" * 60)
print("  ENTRENAMIENTO V2 — OVERSAMPLE (3 clases)")
print("=" * 60)
print(f"  Clases:  Caries | Deep Caries | Periapical Lesion")
print(f"  Dataset: {YAML_PATH}")
print(f"  Epochs:  {EPOCHS}  (early stopping: patience={PATIENCE})")
print("=" * 60 + "\n")

# ── ENTRENAMIENTO ─────────────────────────────────────────────────────────────
model = YOLO("yolov8s.pt")
start = time.time()

results = model.train(
    data=YAML_PATH,
    epochs=EPOCHS,
    imgsz=IMG_SIZE,
    batch=BATCH,
    workers=0,  # <--- TRUCO PARA EL WINERROR 1455 DE MEMORIA!
    device=0,
    patience=PATIENCE,
    project="api_ia_sonrie/runs/train_oversample",  # Carpeta separada!
    name=RUN_NAME,
    exist_ok=True,

    # Augmentation para radiografías panorámicas
    hsv_h=0.0,
    hsv_s=0.0,
    hsv_v=0.4,
    degrees=5.0,
    fliplr=0.5,
    flipud=0.0,
    mosaic=0.5,
    mixup=0.1,
    copy_paste=0.0,

    # Optimizador
    optimizer="AdamW",
    lr0=0.001,
    lrf=0.01,
    weight_decay=0.0005,
    warmup_epochs=3,

    save=True,
    save_period=10,
    plots=True,
    verbose=True,
)

elapsed = time.time() - start
print(f"\n⏱  Tiempo: {int(elapsed//3600)}h {int((elapsed%3600)//60)}min")

# ── GUARDAR MODELO ────────────────────────────────────────────────────────────
map50   = results.results_dict.get("metrics/mAP50(B)", 0)
map5095 = results.results_dict.get("metrics/mAP50-95(B)", 0)
print(f"📊 mAP50:    {map50:.4f}")
print(f"📊 mAP50-95: {map5095:.4f}")

best_pt = Path(f"api_ia_sonrie/runs/train_oversample/{RUN_NAME}/weights/best.pt")
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path("backend/ia_models").mkdir(parents=True, exist_ok=True)
shutil.copy2(best_pt, f"{OUTPUT_DIR}/dentex_caries_v2_oversample.pt")
shutil.copy2(best_pt, f"backend/ia_models/modelo_caries_v2_oversample.pt")

metadata = {
    "version":          "v2_oversample",
    "model_base":       "yolov8s",
    "map50":            round(map50, 4),
    "map50_95":         round(map5095, 4),
    "batch":            BATCH,
    "imgsz":            IMG_SIZE,
    "gpu":              gpu_name,
    "training_minutes": round(elapsed / 60, 1),
    "nc":               3,
    "classes":          {"0": "Caries", "1": "Deep Caries", "2": "Periapical Lesion"},
    "strategy":         "oversample — clases pequeñas igualadas a la dominante"
}
with open(f"{OUTPUT_DIR}/metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"\n✅ Modelo: {OUTPUT_DIR}/dentex_v2_oversample.pt")
print("▶  Siguiente paso: python v2_evaluate_oversample.py")
