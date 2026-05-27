"""
PASO 3 — Evaluación V2: Oversample (3 clases)
==============================================
Evalúa el modelo entrenado y genera una comparativa directa con V1.
Ejecutar desde la raíz de api_ia_sonrie/
"""

import json
from pathlib import Path
from ultralytics import YOLO

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
MODEL_PATH   = "runs/detect/api_ia_sonrie/runs/train_oversample/dentex_v2_oversample/weights/best.pt"
YAML_PATH    = "api_ia_sonrie/dataset/processed_v2_oversample/dentex_v2_oversample.yaml"
OUTPUT_DIR   = "api_ia_sonrie/models"

# Métricas V1 para comparativa (Copiadas del Modelo v1.2 de Producción - 3 Clases)
V1_METRICS = {
    "map50":            0.4291,
    "map50_95":         0.3020,
    "precision":        0.4753,
    "recall":           0.4385,
    "per_class": {
        "Caries":            0.4416,
        "Deep Caries":       0.4489,
        "Periapical Lesion": 0.3967,
    }
}

CLASSES = ["Caries", "Deep Caries", "Periapical Lesion"]

def main():
    # ── EVALUACIÓN ────────────────────────────────────────────────────────────────
    print("=" * 60)
    print("  EVALUACIÓN V2 — OVERSAMPLE (3 clases)")
    print("=" * 60)

    model   = YOLO(MODEL_PATH)
    metrics = model.val(
        data=YAML_PATH,
        split="val",
        plots=True,
        save_json=False,
        project="api_ia_sonrie/runs/val_oversample",
        name="dentex_v2_eval",
        exist_ok=True,
        workers=0,  # <-- NECESARIO PARA WINDOWS MULTIPROCESSING
    )

    map50    = metrics.box.map50
    map5095  = metrics.box.map
    precision = metrics.box.mp
    recall    = metrics.box.mr
    ap50_per_class = metrics.box.ap50   # lista ordenada por clase

    # ── RESULTADOS GLOBALES ───────────────────────────────────────────────────────
    print("\n=== RESULTADOS GLOBALES V2 ===")
    print(f"  mAP50:     {map50:.4f}")
    print(f"  mAP50-95:  {map5095:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")

    # ── RESULTADOS POR CLASE ──────────────────────────────────────────────────────
    print("\n=== RESULTADOS POR CLASE V2 ===")
    ap_by_class = {}
    for i, cls in enumerate(CLASSES):
        ap = float(ap50_per_class[i]) if i < len(ap50_per_class) else 0.0
        ap_by_class[cls] = ap
        print(f"  {cls:20s}: AP50 = {ap:.4f}")

    # ── COMPARATIVA V1 vs V2 ──────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  COMPARATIVA V1 (baseline) vs V2 (oversample)")
    print("=" * 60)

    def delta(new, old):
        d = new - old
        sign = "▲" if d > 0 else ("▼" if d < 0 else "─")
        return f"{sign} {abs(d):.4f}"

    print(f"\n  {'Métrica':<22} {'V1 Baseline':>12} {'V2 Oversample':>14} {'Cambio':>10}")
    print("  " + "-" * 60)
    print(f"  {'mAP50':<22} {V1_METRICS['map50']:>12.4f} {map50:>14.4f} {delta(map50, V1_METRICS['map50']):>10}")
    print(f"  {'mAP50-95':<22} {V1_METRICS['map50_95']:>12.4f} {map5095:>14.4f} {delta(map5095, V1_METRICS['map50_95']):>10}")
    print(f"  {'Precision':<22} {V1_METRICS['precision']:>12.4f} {precision:>14.4f} {delta(precision, V1_METRICS['precision']):>10}")
    print(f"  {'Recall':<22} {V1_METRICS['recall']:>12.4f} {recall:>14.4f} {delta(recall, V1_METRICS['recall']):>10}")

    print(f"\n  {'Clase':<22} {'V1 AP50':>12} {'V2 AP50':>14} {'Cambio':>10}")
    print("  " + "-" * 60)
    for cls in CLASSES:
        v1 = V1_METRICS["per_class"].get(cls, 0)
        v2 = ap_by_class.get(cls, 0)
        print(f"  {cls:<22} {v1:>12.4f} {v2:>14.4f} {delta(v2, v1):>10}")

    # ── INTERPRETACIÓN AUTOMÁTICA ─────────────────────────────────────────────────
    print("\n=== INTERPRETACIÓN ===")

    if map50 > V1_METRICS["map50"]:
        print("  ✅ mAP50 global mejoró con oversample.")
    else:
        print("  ⚠️  mAP50 global no mejoró — puede haber overfitting en clases aumentadas.")

    periapical_v1 = V1_METRICS["per_class"]["Periapical Lesion"]
    periapical_v2 = ap_by_class.get("Periapical Lesion", 0)
    if periapical_v2 > periapical_v1:
        print(f"  ✅ Periapical Lesion mejoró: {periapical_v1:.4f} → {periapical_v2:.4f} (objetivo del oversample)")
    else:
        print(f"  ⚠️  Periapical Lesion no mejoró: {periapical_v1:.4f} → {periapical_v2:.4f}")

    caries_v1 = V1_METRICS["per_class"]["Caries"]
    caries_v2  = ap_by_class.get("Caries", 0)
    if caries_v2 > caries_v1:
        print(f"  ✅ Caries mejoró: {caries_v1:.4f} → {caries_v2:.4f}")
    else:
        print(f"  ℹ️  Caries bajó levemente: {caries_v1:.4f} → {caries_v2:.4f} (esperado al balancear)")

    # ── GUARDAR RESULTADOS ────────────────────────────────────────────────────────
    eval_results = {
        "version":   "v2_oversample",
        "global": {
            "map50":     round(map50, 4),
            "map50_95":  round(map5095, 4),
            "precision": round(precision, 4),
            "recall":    round(recall, 4),
        },
        "per_class": {cls: round(ap_by_class.get(cls, 0), 4) for cls in CLASSES},
        "vs_v1": {
            "map50_delta":    round(map50 - V1_METRICS["map50"], 4),
            "map5095_delta":  round(map5095 - V1_METRICS["map50_95"], 4),
        }
    }

    eval_path = Path(OUTPUT_DIR) / "eval_results.json"
    with open(eval_path, "w", encoding="utf-8") as f:
        import json
        json.dump(eval_results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Resultados guardados en: {eval_path}")
    print("▶  Siguiente: evaluar los siguientes pasos según convenga.")

if __name__ == '__main__':
    main()
