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

@router.post("/validate", tags=["Predicción"])
async def validate_only(file: UploadFile = File(...)):
    from app.services.detector import validar_imagen_panoramica
    
    image_data = await process_image(file)
    es_valida, mensaje, _ = validar_imagen_panoramica(image_data)
    
    if not es_valida:
        return {
            "valid": False,
            "error": mensaje
        }
        
    return {
        "valid": True,
        "error": None
    }