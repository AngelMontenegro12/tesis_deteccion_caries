"""
ANÁLISIS DE UMBRALES — Modelo V1.9 CLAHE
==========================================
Evalúa el modelo V1.9 con distintos umbrales de confianza para
encontrar el punto óptimo entre Precision y Recall sin reentrenar.

Ejecutar localmente con .venv activo.
No requiere GPU — corre en CPU en ~5-10 minutos.
"""

import json
from pathlib import Path
from ultralytics import YOLO

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
MODEL_PATH = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\models\dentex_caries_v1_9_clahe.pt"
YAML_PATH  = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\dataset\processed_v1_9_clahe_global\dentex_clahe.yaml"
OUTPUT_DIR = r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\runs\val"

CLASES = ["Caries", "Deep Caries", "Periapical Lesion"]

# Umbrales a probar — de más permisivo a más estricto
UMBRALES = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]

model = YOLO(MODEL_PATH)

print("=" * 75)
print("  ANÁLISIS DE UMBRALES — V1.9 CLAHE + YOLOv8m")
print("=" * 75)
print(f"\n  Probando {len(UMBRALES)} umbrales: {UMBRALES}")
print(f"  Umbral actual en producción: 0.45\n")

resultados = []

for conf in UMBRALES:
    metrics = model.val(
        data=YAML_PATH,
        split="val",
        imgsz=800,
        conf=conf,
        iou=0.5,
        project=OUTPUT_DIR,
        name=f"umbral_{int(conf*100):02d}",
        exist_ok=True,
        verbose=False,
        plots=False,
        workers=0,
    )

    map50     = metrics.box.map50
    precision = metrics.box.mp
    recall    = metrics.box.mr
    ap50      = metrics.box.ap50

    ap_by_class = {
        cls: round(float(ap50[i]), 4) if i < len(ap50) else 0.0
        for i, cls in enumerate(CLASES)
    }

    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0

    resultados.append({
        "conf":      conf,
        "map50":     round(map50, 4),
        "precision": round(precision, 4),
        "recall":    round(recall, 4),
        "f1":        round(f1, 4),
        "caries":    ap_by_class["Caries"],
        "deep":      ap_by_class["Deep Caries"],
        "peri":      ap_by_class["Periapical Lesion"],
    })

    print(f"  conf={conf:.2f} | mAP50={map50:.4f} | P={precision:.4f} | R={recall:.4f} | F1={f1:.4f}")

# ── TABLA COMPLETA ─────────────────────────────────────────────────────────────
print(f"\n{'═'*75}")
print(f"  TABLA COMPLETA DE RESULTADOS")
print(f"{'═'*75}")
print(f"  {'Conf':>5}  {'mAP50':>7}  {'Precision':>10}  {'Recall':>8}  {'F1':>7}  {'Caries':>8}  {'DeepC':>7}  {'Peri':>7}")
print(f"  {'─'*5}  {'─'*7}  {'─'*10}  {'─'*8}  {'─'*7}  {'─'*8}  {'─'*7}  {'─'*7}")

for r in resultados:
    marker = " ◄ actual" if r["conf"] == 0.45 else ""
    print(f"  {r['conf']:>5.2f}  {r['map50']:>7.4f}  {r['precision']:>10.4f}  {r['recall']:>8.4f}  {r['f1']:>7.4f}  {r['caries']:>8.4f}  {r['deep']:>7.4f}  {r['peri']:>7.4f}{marker}")

# ── MEJOR UMBRAL SEGÚN CADA CRITERIO ──────────────────────────────────────────
print(f"\n{'═'*75}")
print(f"  MEJOR UMBRAL SEGÚN CADA CRITERIO")
print(f"{'═'*75}")

mejor_f1     = max(resultados, key=lambda x: x["f1"])
mejor_prec   = max(resultados, key=lambda x: x["precision"])
mejor_map50  = max(resultados, key=lambda x: x["map50"])
mejor_caries = max(resultados, key=lambda x: x["caries"])

print(f"  Mejor F1 (balance P/R):     conf={mejor_f1['conf']:.2f}  → P={mejor_f1['precision']:.4f}  R={mejor_f1['recall']:.4f}  F1={mejor_f1['f1']:.4f}")
print(f"  Mejor Precision:            conf={mejor_prec['conf']:.2f}  → P={mejor_prec['precision']:.4f}  R={mejor_prec['recall']:.4f}")
print(f"  Mejor mAP50:                conf={mejor_map50['conf']:.2f}  → mAP50={mejor_map50['map50']:.4f}")
print(f"  Mejor Caries AP50:          conf={mejor_caries['conf']:.2f}  → Caries={mejor_caries['caries']:.4f}")

# ── RECOMENDACIÓN ──────────────────────────────────────────────────────────────
print(f"\n{'═'*75}")
print(f"  RECOMENDACIÓN")
print(f"{'═'*75}")

actual = next(r for r in resultados if r["conf"] == 0.45)
print(f"\n  Umbral actual (0.45): P={actual['precision']:.4f}  R={actual['recall']:.4f}  F1={actual['f1']:.4f}")
print(f"  Mejor F1      ({mejor_f1['conf']:.2f}): P={mejor_f1['precision']:.4f}  R={mejor_f1['recall']:.4f}  F1={mejor_f1['f1']:.4f}")

ganancia_prec = mejor_f1["precision"] - actual["precision"]
perdida_rec   = actual["recall"] - mejor_f1["recall"]

if ganancia_prec > 0.03:
    print(f"\n  ✅ Cambiar CONFIDENCE a {mejor_f1['conf']:.2f} en producción mejora Precision")
    print(f"     en +{ganancia_prec:.4f} a costa de -{perdida_rec:.4f} de Recall.")
    print(f"     Cambio de 1 línea en .env: CONFIDENCE={mejor_f1['conf']:.2f}")
else:
    print(f"\n  ⚠️  Ajustar el umbral no mejora significativamente la Precision.")
    print(f"     Se recomienda reentrenar con cls=1.5 y box=10.0 (experimento V2.0)")

# ── GUARDAR RESULTADOS ─────────────────────────────────────────────────────────
out_path = Path(r"D:\LPT ANGEL\USAT\2026-1\tesis_caries\sistema_sonrie_tesis\api_ia_sonrie\models") / "analisis_umbrales_v1_9.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(resultados, f, indent=2, ensure_ascii=False)

print(f"\n✅ Resultados guardados en: {out_path}")
print(f"\n▶  Si el umbral óptimo mejora Precision sin perder mucho Recall,")
print(f"   actualiza CONFIDENCE en api_ia_sonrie/.env y no necesitas reentrenar.")
print(f"▶  Si la mejora es insuficiente, procedemos con V2.0 (cls=1.5, box=10.0).")
