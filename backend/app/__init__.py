from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Configuración de base de datos
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Registrar Blueprints
    from app.routes.auth import auth_bp
    from app.routes.pacientes import pacientes_bp
    from app.routes.evaluaciones import evaluaciones_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(pacientes_bp)
    app.register_blueprint(evaluaciones_bp)
    
    # Ruta de prueba para verificar conexión
    @app.route('/api/test', methods=['GET'])
    def test_connection():
        try:
            # Intentar conexión real a MySQL
            with db.engine.connect() as conn:
                return jsonify({
                    "status": "success", 
                    "message": "¡Conectado a la base de datos MySQL (bd_detec_caries) correctamente! Flask, React y Tailwind están funcionando."
                })
        except Exception as e:
            return jsonify({
                "status": "error", 
                "message": f"Error de conexión a la BD: {str(e)}"
            }), 500

    return app
