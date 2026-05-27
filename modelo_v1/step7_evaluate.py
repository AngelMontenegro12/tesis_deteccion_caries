from ultralytics import YOLO

# Cargar los mejores pesos resultantes del entrenamiento (dentex_v1)
model = YOLO("runs/detect/api_ia_sonrie/runs/train/dentex_v1/weights/best.pt")

print("\n--- INICIANDO EVALUACIÓN DEL MODELO DENTEX V1 ---")
# Evaluar sobre el conjunto de validación configurado en el YAML
metrics = model.val(
    data="api_ia_sonrie/dataset/processed/dentex.yaml",
    split="val",
    plots=True,   # Genera gráficos de la evaluación
)

clases = ['Caries', 'Deep Caries', 'Periapical Lesion', 'Impacted Tooth']

print("\n=== RESULTADOS GLOBALES ===")
print(f"mAP50:     {metrics.box.map50:.4f}")
print(f"mAP50-95:  {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall:    {metrics.box.mr:.4f}")

print("\n=== RESULTADOS POR CLASE ===")
# Mapeo de resultados por clase. ap50 devuelve la lista de métricas por cada clase aprendida
for i, cls in enumerate(clases):
    try:
        # A veces el índice devuelto no mapea exactamente igual dependiendo si 
        # una clase no tuvo instancias en validación, pero si tiene todas:
        print(f"  {cls}: AP50={metrics.box.ap50[i]:.4f}")
    except IndexError:
        print(f"  {cls}: - Sin datos suficientes en validación -")
