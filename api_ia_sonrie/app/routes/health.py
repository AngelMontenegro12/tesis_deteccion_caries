from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Salud del Sistema"])
async def health_check():
    return {
        "status": "ok",
        "message": "API de IA corriendo exitosamente"
    }