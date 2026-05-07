from fastapi import APIRouter, File, UploadFile
from app.services.detector import run_inference
from app.utils.image_utils import process_image

router = APIRouter()

@router.post("/predict", tags=["Predicción"])
async def predict_image(file: UploadFile = File(...)):
    # 1. Validar y procesar la imagen
    image_data = await process_image(file)
    
    # 2. Ejecutar inferencia
    results = run_inference(image_data)
    
    # 3. Retornar resultados
    return {
        "filename": file.filename,
        "detections": results
    }