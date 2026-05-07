from fastapi import UploadFile, HTTPException

async def process_image(file: UploadFile):
    # Validar que sea imagen
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")
    
    content = await file.read()
    
    # TODO: Puedes agregar lógica para convertir los bytes (content) 
    # a un objeto PIL.Image o a un numpy array (cv2) según lo requiera tu modelo.
    
    return content