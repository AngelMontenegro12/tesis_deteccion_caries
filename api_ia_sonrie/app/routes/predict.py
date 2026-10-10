from fastapi import APIRouter, File, UploadFile
from app.services.detector import run_inference
from app.utils.image_utils import process_image
import os

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
    results = run_inference(image_data)

    # Si run_inference devuelve un dict con valid/detections, unificarla
    if isinstance(results, dict):
        results_out = results.copy()
        results_out['filename'] = file.filename
        
        if results_out.get('valid', False):
            documentar_evaluacion(file.filename, results_out.get('detections', []))
            
        return results_out

    documentar_evaluacion(file.filename, results)

    return {
        "filename": file.filename,
        "valid": True,
        "error": None,
        "detections": results
    }

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
    es_valida_clip, mensaje_clip = validar_con_clip(img_cv)
    if not es_valida_clip:
        return {
            "valid": False,
            "error": mensaje_clip
        }
        
    # 3. Capa 2: Clasificador YOLOv8-cls
    es_valida_cls, mensaje_cls = validar_con_clasificador(img_cv)
    if not es_valida_cls:
        return {
            "valid": False,
            "error": mensaje_cls
        }
        
    return {
        "valid": True,
        "error": None
    }
