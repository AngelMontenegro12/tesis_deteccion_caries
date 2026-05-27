from ultralytics import YOLO

def main():
    print("Iniciando entrenamiento en GPU...")
    # yolov8s es el modelo recomendado para la tesis
    model = YOLO("yolov8s.pt")

    # Iniciar el entrenamiento
    results = model.train(
        data="api_ia_sonrie/dataset/dentex_v1_2.yaml",  # Nuestro yaml recién creado (3 clases)
        epochs=100,
        imgsz=640,
        batch=4,            # Reducido a 4 por la VRAM de tu GPU
        workers=0,          # ¡Solución al WinError 1455 de memoria de paginación en Windows!
        patience=20,        # Early stopping si no mejora
        device=0,           # ¡GPU HABILITADA!
        project="api_ia_sonrie/runs/train",
        name="dentex_v1_2",
        exist_ok=True,

        # Augmentation adaptada a radiografías
        hsv_h=0.0,
        hsv_s=0.0,
        hsv_v=0.4,
        degrees=5.0,
        fliplr=0.5,
        flipud=0.0,
        mosaic=0.5,
        mixup=0.1,

        # Optimizador
        optimizer="AdamW",
        lr0=0.001,
        weight_decay=0.0005,
        warmup_epochs=3,

        save=True,
        save_period=10,
        plots=True,
        verbose=True,
    )

    print(f"\nmAP50:    {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")
    print(f"mAP50-95: {results.results_dict.get('metrics/mAP50-95(B)', 'N/A')}")

if __name__ == "__main__":
    main()
