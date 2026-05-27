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

    # Si run_inference devuelve un dict con valid/detections, unificarla
    if isinstance(results, dict):
        results_out = results.copy()
        results_out['filename'] = file.filename
        return results_out

    return {
        "filename": file.filename,
        "valid": True,
        "error": None,
        "detections": results
    }