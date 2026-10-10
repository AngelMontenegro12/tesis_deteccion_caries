"""
EVALUACIÓN V2.0 — cls=1.5 + box=10.0 + CLAHE + YOLOv8m
"""

import json
from pathlib import Path
from ultralytics import YOLO

MODEL_PATH = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\models\dentex_caries_v2_0.pt"
YAML_PATH  = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\dataset\processed_v1_9_clahe_global\dentex_clahe.yaml"
OUTPUT_DIR = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\runs\val"

CLASES = ["Caries", "Deep Caries", "Periapical Lesion"]

HISTORIAL = {
    "V1.2 (base)":    {"map50": 0.4291, "map50_95": 0.3020, "precision": 0.4753, "recall": 0.4385,
                        "per_class": {"Caries": 0.4416, "Deep Caries": 0.4489, "Periapical Lesion": 0.3967}},
    "V1.3 (hiperp)":  {"map50": 0.4551, "map50_95": 0.3098, "precision": 0.6431, "recall": 0.3815,
                        "per_class": {"Caries": 0.4310, "Deep Caries": 0.4340, "Periapical Lesion": 0.5000}},
    "V1.5 (DENTEX)":  {"map50": 0.5646, "map50_95": 0.4262, "precision": 0.5377, "recall": 0.6508,
                        "per_class": {"Caries": 0.2440, "Deep Caries": 0.6600, "Periapical Lesion": 0.7897}},
    "V1.6 (fullaug)": {"map50": 0.4782, "map50_95": 0.3663, "precision": 0.4702, "recall": 0.7033,
                        "per_class": {"Caries": 0.3337, "Deep Caries": 0.4461, "Periapical Lesion": 0.6548}},
    "V1.8 (YOLOv8m)": {"map50": 0.4822, "map50_95": 0.3550, "precision": 0.4785, "recall": 0.7321,
                        "per_class": {"Caries": 0.3687, "Deep Caries": 0.4314, "Periapical Lesion": 0.6464}},
    "V1.9 (CLAHE)":   {"map50": 0.5006, "map50_95": 0.3410, "precision": 0.4719, "recall": 0.7620,
                        "per_class": {"Caries": 0.3789, "Deep Caries": 0.4731, "Periapical Lesion": 0.6497}},
}

print("=" * 70)
print("  EVALUACIÓN LOCAL — V2.0 cls=1.5 + box=10.0 + CLAHE + YOLOv8m")
print("=" * 70)

model   = YOLO(MODEL_PATH)
metrics = model.val(
    data=YAML_PATH,
    split="val",
    imgsz=800,
    plots=True,
    save_json=True,
    project=OUTPUT_DIR,
    name="dentex_v2_0_eval",
    exist_ok=True,
    workers=0,
)

map50     = metrics.box.map50
map5095   = metrics.box.map
precision = metrics.box.mp
recall    = metrics.box.mr
ap50      = metrics.box.ap50

ap_by_class = {cls: float(ap50[i]) if i < len(ap50) else 0.0 for i, cls in enumerate(CLASES)}

print(f"\n{'═'*70}")
print(f"  RESULTADOS GLOBALES — V2.0")
print(f"{'═'*70}")
print(f"  mAP50:     {map50:.4f}")
print(f"  mAP50-95:  {map5095:.4f}")
print(f"  Precision: {precision:.4f}")
print(f"  Recall:    {recall:.4f}")

print(f"\n  Por clase:")
ref = HISTORIAL["V1.9 (CLAHE)"]["per_class"]
for cls, ap in ap_by_class.items():
    delta = ap - ref.get(cls, 0)
    arrow = "▲" if delta > 0 else ("▼" if delta < 0 else "─")
    print(f"    {cls:20s}: {ap:.4f}  {arrow} {abs(delta):.4f} vs V1.9")

# ── COMPARATIVA ────────────────────────────────────────────────────────────────
print(f"\n{'═'*70}")
print(f"  COMPARATIVA — MODELOS CLAVE")
print(f"{'═'*70}")

todos = list(HISTORIAL.keys()) + ["V2.0"]
vals_map50  = [v["map50"]     for v in HISTORIAL.values()] + [map50]
vals_map95  = [v["map50_95"]  for v in HISTORIAL.values()] + [map5095]
vals_prec   = [v["precision"] for v in HISTORIAL.values()] + [precision]
vals_rec    = [v["recall"]    for v in HISTORIAL.values()] + [recall]

def fila(label, valores):
    best = max(valores)
    row = f"  {label:<11}"
    for v in valores:
        mark = " ★" if abs(v - best) < 1e-6 else "  "
        row += f"{v:>9.4f}{mark}"
    return row

print(f"  {'Métrica':<11}" + "".join(f"{m[:7]:>11}" for m in todos))
print("  " + "─" * (11 + 11 * len(todos)))
print(fila("mAP50",     vals_map50))
print(fila("mAP50-95",  vals_map95))
print(fila("Precision", vals_prec))
print(fila("Recall",    vals_rec))

print(f"\n  Por clase (AP50):")
print(f"  {'Clase':<19}" + "".join(f"{m[:7]:>11}" for m in todos))
print("  " + "─" * (19 + 11 * len(todos)))

for cls in CLASES:
    valores_cls = [HISTORIAL[m]["per_class"].get(cls, 0.0) for m in HISTORIAL] + [ap_by_class.get(cls, 0.0)]
    best = max(valores_cls)
    row = f"  {cls:<19}"
    for v in valores_cls:
        mark = " ★" if abs(v - best) < 1e-6 else "  "
        row += f"{v:>9.4f}{mark}"
    print(row)

# ── ANÁLISIS DETALLADO ────────────────────────────────────────────────────────
print(f"\n{'═'*70}")
print(f"  ANÁLISIS — ¿Qué logró V2.0 respecto a V1.9?")
print(f"{'═'*70}")

v19 = HISTORIAL["V1.9 (CLAHE)"]

mejoras = []
retrocesos = []

if map5095 > v19["map50_95"] + 0.01:
    mejoras.append(f"mAP50-95: +{map5095 - v19['map50_95']:.4f} (bounding boxes más precisos)")
if precision > v19["precision"] + 0.01:
    mejoras.append(f"Precision: +{precision - v19['precision']:.4f}")
if map50 > v19["map50"] + 0.005:
    mejoras.append(f"mAP50: +{map50 - v19['map50']:.4f}")

if recall < v19["recall"] - 0.02:
    retrocesos.append(f"Recall: -{v19['recall'] - recall:.4f}")

for cls in CLASES:
    delta = ap_by_class.get(cls, 0) - v19["per_class"].get(cls, 0)
    if delta > 0.01:
        mejoras.append(f"{cls} AP50: +{delta:.4f}")
    elif delta < -0.01:
        retrocesos.append(f"{cls} AP50: -{abs(delta):.4f}")

print(f"\n  ✅ Mejoras:")
for m in mejoras:
    print(f"     + {m}")
print(f"\n  ⚠️  Retrocesos:")
for r in retrocesos:
    print(f"     - {r}")

# ── PRÓXIMOS PASOS ────────────────────────────────────────────────────────────
print(f"\n{'═'*70}")
print(f"  PRÓXIMOS PASOS SUGERIDOS")
print(f"{'═'*70}")

caries_v20 = ap_by_class.get("Caries", 0)
if caries_v20 < 0.40:
    print(f"\n  ⚠️  Caries sigue por debajo de 0.40 ({caries_v20:.4f})")
    print(f"     Opciones para el siguiente experimento (V2.1):")
    print(f"     A) cls=2.0 + box=10.0 — más agresivo en clasificación")
    print(f"     B) cls=1.5 + box=10.0 + lr0=0.001 — mayor tasa de aprendizaje")
    print(f"     C) cls=1.5 + box=10.0 + mosaic=0.5 — activar mosaic")
else:
    print(f"\n  ✅ Caries superó 0.40 ({caries_v20:.4f})")

# ── GUARDAR ────────────────────────────────────────────────────────────────────
eval_out = {
    "version": "v2.0_cls1.5_box10",
    "global": {"map50": round(map50,4), "map50_95": round(map5095,4),
               "precision": round(precision,4), "recall": round(recall,4)},
    "per_class": {c: round(ap_by_class.get(c,0),4) for c in CLASES},
}
out_path = Path(r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\models") / "eval_v2_0.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(eval_out, f, indent=2, ensure_ascii=False)

print(f"\n✅ Resultados guardados en: {out_path}")
