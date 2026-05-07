import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    # Para desarrollo, reload=True. Asegúrate de ejecutar este archivo para levantar el server.
    uvicorn.run("app.main:app", host=host, port=port, reload=True)