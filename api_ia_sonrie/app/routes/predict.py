from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.detector import run_inference
from app.utils.image_utils import process_image
import os
import logging
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

def documentar_evaluacion(filename, detections):
    filepath = "ubicacion_caries.md"
    try:
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(f"## Evaluación: {filename}\n")
            f.write(f"- **Número de caries detectadas:** {len(detections)}\n")
            if detections:
                f.write("- **Detalles de cada carie:**\n")
                for i, det in enumerate(detections, 1):
                    tipo = det.get('class_display', det.get('class', 'Desconocido'))
                    bbox = det.get('bbox', [])
                    f.write(f"  {i}. Tipo: {tipo} | Coordenadas (x1, y1, x2, y2): {bbox}\n")
            f.write("\n---\n\n")
    except Exception as e:
        print(f"Error al documentar evaluación: {e}")

@router.post("/predict", tags=["Predicción"])
async def predict_image(file: UploadFile = File(...)):
    # 1. Validar y procesar la imagen
    image_data = await process_image(file)
    
    # 2. Ejecutar inferencia
    try:
        results = run_inference(image_data)
        if isinstance(results, dict) and results.get('valid') is False:
            return JSONResponse(status_code=422, content={
                'status': 'invalid_image', 'valid': False,
                'error': results.get('error') or 'Imagen no válida para análisis.',
            })
        if (not isinstance(results, dict) or results.get('status') != 'success'
                or results.get('valid') is not True or results.get('error') is not None
                or not isinstance(results.get('detections'), list)):
            raise RuntimeError('Contrato de inferencia incompleto.')
    except Exception as error:
        # No incluir bytes, nombres de archivo, rutas ni texto libre de excepciones.
        logger.error('inference_failed exception_type=%s', type(error).__name__)
        return JSONResponse(status_code=500, content={
            'status': 'error', 'valid': False, 'error_code': 'inference_failed',
            'error': 'No fue posible completar el análisis de IA. Vuelve a intentarlo.',
        })

    results_out = {**results, 'filename': file.filename}
    documentar_evaluacion(file.filename, results_out['detections'])
    return results_out

@router.post("/validate", tags=["Predicción"])
async def validate_only(file: UploadFile = File(...)):
    from app.services.detector import validar_capa0
    from app.utils.clip_validator import validar_con_clip
    from app.utils.cls_validator import validar_con_clasificador
    
    image_data = await process_image(file)
    
    # 1. Capa 0: Validación Técnica (incluye decodificación)
    es_valida, mensaje, img_cv = validar_capa0(image_data)
    if not es_valida:
        return {
            "valid": False,
            "error": mensaje
        }
        
    # 2. Capa 1: Validación Semántica con CLIP
    try:
        es_valida_clip, mensaje_clip = validar_con_clip(img_cv, strict=True)
    except Exception:
        raise HTTPException(status_code=503, detail='Servicio de validación no disponible. Vuelve a intentarlo.') from None
    if not es_valida_clip:
        return {
            "valid": False,
            "error": mensaje_clip
        }
        
    # 3. Capa 2: Clasificador YOLOv8-cls
    try:
        es_valida_cls, mensaje_cls = validar_con_clasificador(img_cv, strict=True)
    except Exception:
        raise HTTPException(status_code=503, detail='Servicio de validación no disponible. Vuelve a intentarlo.') from None
    if not es_valida_cls:
        return {
            "valid": False,
            "error": mensaje_cls
        }
        
    return {
        "valid": True,
        "error": None
    }
