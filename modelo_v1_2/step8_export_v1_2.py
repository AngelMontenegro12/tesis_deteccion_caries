import shutil
import os
from pathlib import Path

def main():
    print("Exportando modelo...")
    
    # Rutas actuales de origen (donde ultralytics lo guardó) y de destino
    origen = "runs/detect/api_ia_sonrie/runs/train/dentex_v1_2/weights/best.pt"
    
    # Destino principal para la API FastAPI
    destino_api = "api_ia_sonrie/models/dentex_caries_v1_2.pt"
    # Destino secundario (si el backend principal también usa los pesos locales)
    destino_backend = "backend/ia_models/modelo_caries_v1_2.pt"
    
    # Crear carpetas si no existen
    Path("api_ia_sonrie/models").mkdir(parents=True, exist_ok=True)
    Path("backend/ia_models").mkdir(parents=True, exist_ok=True)
    
    if os.path.exists(origen):
        shutil.copy(origen, destino_api)
        print(f"✅ Modelo exportado exitosamente a: {destino_api}")
        
        shutil.copy(origen, destino_backend)
        print(f"✅ Modelo exportado exitosamente a: {destino_backend}")
    else:
        print(f"❌ Error: No se encontró el modelo en {origen}")

if __name__ == "__main__":
    main()
