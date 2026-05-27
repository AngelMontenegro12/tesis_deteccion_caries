from ultralytics import YOLO
import sys

try:
    model = YOLO("yolov8s.pt")

    results = model.train(
        data="api_ia_sonrie/dataset/processed/dentex.yaml",
        epochs=100,
        imgsz=640,
        batch=4,            # Bajar a 4 de forma precautoria
        patience=20,        
        device='cpu',       # Usamos cpu por defecto debido al error de DLL de CUDA previo
        project="api_ia_sonrie/runs/train",
        name="dentex_v1",
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

except Exception as e:
    print(f"Error durante el entrenamiento: {e}")
    sys.exit(1)
