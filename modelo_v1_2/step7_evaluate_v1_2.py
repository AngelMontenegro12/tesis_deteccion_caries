from ultralytics import YOLO

def main():
    print("Cargando modelo entrenado...")
    model = YOLO("runs/detect/api_ia_sonrie/runs/train/dentex_v1_2/weights/best.pt")

    print("\nIniciando validación...")
    metrics = model.val(
        data="api_ia_sonrie/dataset/dentex_v1_2.yaml",
        split="val",
        plots=True,
    )

    clases = ['Caries', 'Deep Caries', 'Periapical Lesion']
    
    print("\n" + "="*40)
    print("📊 RESULTADOS DE LA EVALUACIÓN 📊")
    print("="*40)
    print(f"mAP50:     {metrics.box.map50:.4f}")
    print(f"mAP50-95:  {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall:    {metrics.box.mr:.4f}")
    
    print("\nDesglose por clase (AP50):")
    for i, cls in enumerate(clases):
        if i < len(metrics.box.ap50):
            print(f"  {cls}: {metrics.box.ap50[i]:.4f}")
        else:
            print(f"  {cls}: N/A")
    print("="*40)

if __name__ == "__main__":
    main()
