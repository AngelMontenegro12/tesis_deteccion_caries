from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, predict

app = FastAPI(title="API IA Sonrie - Detección de Caries")

# Configurar CORS (ajustar en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los routers
app.include_router(health.router, prefix="/api")
app.include_router(predict.router, prefix="/api")