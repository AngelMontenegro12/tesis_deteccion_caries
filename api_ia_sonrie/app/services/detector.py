import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/dentex_caries.pt")
CONFIDENCE = float(os.getenv("CONFIDENCE", 0.5))

# Aquí simularás la carga del modelo. Ej: model = YOLO(MODEL_PATH)

def run_inference(image_data):
    # TODO: Implementar la inferencia real con el modelo cargado
    # return model(image_data, conf=CONFIDENCE)
    
    # Mock de resultados para probar el endpoint
    return [
        {
            "class": "caries",
            "confidence": 0.89,
            "bbox": [150, 100, 200, 180] # [x_min, y_min, x_max, y_max]
        }
    ]