from ultralytics import YOLO
import os
import json

def main():
    print("Probando el detector con el modelo exportado...")
    
    CLASES = ['Caries', 'Deep Caries', 'Periapical Lesion']
    SEVERIDAD_MAP = {
        0: 'incipiente',   # Caries
        1: 'avanzada',     # Deep Caries
        2: 'moderada',     # Periapical Lesion
    }

    # Usamos el modelo que acabamos de exportar en el Paso 8
    model_path = "api_ia_sonrie/models/dentex_caries_v1_2.pt"
    if not os.path.exists(model_path):
        print(f"❌ Error: El modelo {model_path} no existe.")
        return
        
    model = YOLO(model_path)

    # Tomar cualquier imagen de validación
    val_dir = "api_ia_sonrie/dataset/processed_v1_2/images/val"
    if not os.path.exists(val_dir) or not os.listdir(val_dir):
        print(f"❌ Error: No se encontraron imágenes en {val_dir}")
        return
        
    sample_img = os.path.join(val_dir, os.listdir(val_dir)[0])
    print(f"Imagen seleccionada: {sample_img}")

    results = model(sample_img, conf=0.25, verbose=False)

    # Formato de respuesta que recibirá tu backend Python
    detecciones = []
    for box in results[0].boxes:
        cls_id = int(box.cls)
        xyxy = box.xyxy[0].tolist()
        detecciones.append({
            "clase_id":      cls_id,
            "clase_nombre":  CLASES[cls_id],
            "confianza":     round(float(box.conf), 4),
            "severidad":     SEVERIDAD_MAP[cls_id],   # → campo severidad de tu BD
            "bbox": {
                "x":     int(xyxy[0]),
                "y":     int(xyxy[1]),
                "ancho": int(xyxy[2] - xyxy[0]),
                "alto":  int(xyxy[3] - xyxy[1]),
            }
        })

    salida_json = {
        "modelo_version":    "YOLOv8s-dentex-v1.2-3clases",
        "caries_detectada":  any(d['clase_id'] in [0,1,2] for d in detecciones),
        "confianza_global":  round(sum(d['confianza'] for d in detecciones) / max(len(detecciones), 1), 4) if detecciones else 0.0,
        "total_detecciones": len(detecciones),
        "detecciones":       detecciones
    }
    
    print("\n📦 Respuesta JSON simulada del endpoint (Paso 9):")
    print(json.dumps(salida_json, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
