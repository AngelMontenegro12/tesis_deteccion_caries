"""
EVALUACIÓN V1.3 MEJORADO — Comparativa completa de todos los modelos
=====================================================================
Ejecutar desde la raíz del proyecto (donde está api_ia_sonrie/)
"""

import json
from pathlib import Path
from ultralytics import YOLO

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
MODEL_PATH = "api_ia_sonrie/models/dentex_caries_v1_3_mejorado.pt"
YAML_PATH  = "api_ia_sonrie/dataset/dentex_v1_2.yaml"
OUTPUT_DIR = "api_ia_sonrie/models"
CLASSES    = ["Caries", "Deep Caries", "Periapical Lesion"]

# Historial de modelos anteriores para comparativa
HISTORIAL = {
    "V1 (4 clases, CPU)": {
        "map50": 0.304, "map50_95": 0.175, "precision": 0.255, "recall": 0.414,
        "per_class": {}
    },
    "V1.2 (3 clases, base)": {
        "map50": 0.4291, "map50_95": 0.3020, "precision": 0.4753, "recall": 0.4385,
        "per_class": {"Caries": 0.4416, "Deep Caries": 0.4489, "Periapical Lesion": 0.3967}
    },
    "V2 (oversample)": {
        "map50": 0.4335, "map50_95": 0.2887, "precision": 0.5025, "recall": 0.4298,
        "per_class": {"Caries": 0.3568, "Deep Caries": 0.4782, "Periapical Lesion": 0.4656}
    },
}

# ── EVALUACIÓN ────────────────────────────────────────────────────────────────
def main():
    print("=" * 65)
    print("  EVALUACIÓN — V1.3 MEJORADO")
    print("=" * 65)

    model   = YOLO(MODEL_PATH)
    metrics = model.val(
        data=YAML_PATH,
        split="val",
        plots=True,
        save_json=True,
        project="api_ia_sonrie/runs/val",
        name="v1_3_mejorado_eval",
        exist_ok=True,
        workers=0,
    )

    map50     = metrics.box.map50
    map5095   = metrics.box.map
    precision = metrics.box.mp
    recall    = metrics.box.mr
    ap50      = metrics.box.ap50

    ap_by_class = {cls: float(ap50[i]) if i < len(ap50) else 0.0
                   for i, cls in enumerate(CLASSES)}

    # ── RESULTADOS GLOBALES ───────────────────────────────────────────────────────
    print(f"\n{'═'*65}")
    print(f"  RESULTADOS GLOBALES")
    print(f"{'═'*65}")
    print(f"  mAP50:     {map50:.4f}")
    print(f"  mAP50-95:  {map5095:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")

    print(f"\n  Por clase:")
    for cls, ap in ap_by_class.items():
        v12 = HISTORIAL["V1.2 (3 clases, base)"]["per_class"].get(cls, 0)
        delta = ap - v12
        arrow = "▲" if delta > 0 else ("▼" if delta < 0 else "─")
        print(f"    {cls:20s}: {ap:.4f}  {arrow} {abs(delta):.4f} vs V1.2")

    # ── COMPARATIVA COMPLETA ──────────────────────────────────────────────────────
    print(f"\n{'═'*65}")
    print(f"  COMPARATIVA COMPLETA — TODOS LOS MODELOS")
    print(f"{'═'*65}")

    modelos = list(HISTORIAL.keys()) + ["V1.3 Mejorado"]
    valores_map50 = [v["map50"] for v in HISTORIAL.values()] + [map50]

    col_w = 22
    header = f"  {'Métrica':<18}" + "".join(f"{m[:col_w]:>{col_w}}" for m in modelos)
    print(header)
    print("  " + "-" * (18 + col_w * len(modelos)))

    def fmtrow(label, values):
        row = f"  {label:<18}"
        best = max(values)
        for v in values:
            mark = " ★" if v == best else "  "
            row += f"{v:>{col_w-2}.4f}{mark}"
        return row

    all_map50  = [HISTORIAL[m]["map50"]     for m in HISTORIAL] + [map50]
    all_map95  = [HISTORIAL[m]["map50_95"]  for m in HISTORIAL] + [map5095]
    all_prec   = [HISTORIAL[m]["precision"] for m in HISTORIAL] + [precision]
    all_rec    = [HISTORIAL[m]["recall"]    for m in HISTORIAL] + [recall]

    print(fmtrow("mAP50",     all_map50))
    print(fmtrow("mAP50-95",  all_map95))
    print(fmtrow("Precision", all_prec))
    print(fmtrow("Recall",    all_rec))

    # ── CONCLUSIÓN AUTOMÁTICA ─────────────────────────────────────────────────────
    print(f"\n{'═'*65}")
    print(f"  CONCLUSIÓN")
    print(f"{'═'*65}")

    delta_vs_v12 = map50 - 0.4291
    if delta_vs_v12 >= 0.05:
        print(f"  ✅ MEJORA SIGNIFICATIVA: +{delta_vs_v12:.4f} vs V1.2")
        print(f"     Los cambios de hiperparámetros tuvieron efecto notable.")
        print(f"     Este modelo (V1.3 Mejorado) es el recomendado para producción.")
    elif delta_vs_v12 > 0:
        print(f"  ✅ MEJORA LEVE: +{delta_vs_v12:.4f} vs V1.2")
        print(f"     Mejora moderada. Considerar aumentar más epochs o usar yolov8m.")
    elif delta_vs_v12 > -0.02:
        print(f"  ⚠️  SIN CAMBIO SIGNIFICATIVO: {delta_vs_v12:.4f} vs V1.2")
        print(f"     El modelo no empeoró. Probar con más epochs (200) o imgsz=1024.")
    else:
        print(f"  ❌ REGRESIÓN: {delta_vs_v12:.4f} vs V1.2")
        print(f"     Los hiperparámetros no funcionaron. Volver a V1.2 base.")

    periapical_new = ap_by_class.get("Periapical Lesion", 0)
    if periapical_new > 0.4656:
        print(f"  ✅ Periapical Lesion superó al V2 oversample: {periapical_new:.4f} > 0.4656")
    elif periapical_new > 0.3967:
        print(f"  ✅ Periapical Lesion mejoró respecto a V1.2: {periapical_new:.4f} > 0.3967")

    # ── GUARDAR RESULTADOS ────────────────────────────────────────────────────────
    eval_out = {
        "version":   "v1.3_mejorado",
        "global":    {"map50": round(map50,4), "map50_95": round(map5095,4),
                      "precision": round(precision,4), "recall": round(recall,4)},
        "per_class": {cls: round(ap_by_class[cls], 4) for cls in CLASSES},
        "vs_v1_2":   {"map50_delta": round(delta_vs_v12, 4)},
        "historial": HISTORIAL,
    }

    out_path = Path(OUTPUT_DIR) / "eval_v1_3_mejorado.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(eval_out, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Resultados guardados: {out_path}")


if __name__ == '__main__':
    main()