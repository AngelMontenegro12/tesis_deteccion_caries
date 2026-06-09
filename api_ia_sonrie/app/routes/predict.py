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
    from app.services.detector import validar_imagen_panoramica, _check_decodificable
    from app.utils.clip_validator import validar_con_clip
    
    image_data = await process_image(file)
    
    # 1. Decodificar la imagen primero
    img_cv, decodificable, msg_dec = _check_decodificable(image_data)
    if not decodificable:
        return {
            "valid": False,
            "error": "El archivo no pudo ser leído como imagen. Verifique que sea un archivo válido."
        }
        
    # 2. Capa 1: Validación Semántica con CLIP
    es_valida_clip, mensaje_clip = validar_con_clip(img_cv)
    if not es_valida_clip:
        return {
            "valid": False,
            "error": mensaje_clip
        }
        
    # 3. Capa 0: Validación Técnica
    es_valida, mensaje, _ = validar_imagen_panoramica(image_data)
    if not es_valida:
        return {
            "valid": False,
            "error": "Parece que la imagen que se está subiendo no es una radiografía panorámica, vuelva a subir otra imagen correctamente."
        }
        
    return {
        "valid": True,
        "error": None
    }
