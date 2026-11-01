from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app, expose_headers=['Content-Disposition'])
    
    # Configuración de base de datos
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOADS_ROOT'] = os.path.join(os.getcwd(), 'uploads')
    
    db.init_app(app)
    
    # Registrar Blueprints
    from app.routes.auth import auth_bp
    from app.routes.odontologos import odontologos_bp
    from app.routes.pacientes import pacientes_bp
    from app.routes.evaluaciones import evaluaciones_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reportes import reportes_bp
    from app.routes.solicitudes import solicitudes_bp
    from app.routes.soporte import soporte_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(odontologos_bp)
    app.register_blueprint(pacientes_bp)
    app.register_blueprint(evaluaciones_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reportes_bp)
    app.register_blueprint(solicitudes_bp)
    app.register_blueprint(soporte_bp)

    from app.utils.auth import get_authenticated_user, has_module, is_admin

    @app.before_request
    def require_private_session():
        # Login y recuperación conservan su contrato público. OPTIONS permite CORS preflight.
        if request.method == 'OPTIONS' or request.endpoint in {
            'auth.login', 'auth.forgot_password', 'auth.reset_password'
        }:
            return None
        if (request.path.startswith('/api/') or request.path.startswith('/uploads/')) and not get_authenticated_user():
            return jsonify({'error': 'Debes iniciar sesión para continuar'}), 401
        return None
    
    # Servir imágenes estáticas procesadas o subidas
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        from pathlib import Path
        from app.models import Odontologo, Radiografia, ResultadosDeteccion, EvaluacionDiagnostica

        user = get_authenticated_user()
        root = Path(app.config['UPLOADS_ROOT']).resolve()
        # No servir archivos huérfanos ni rutas fuera del directorio, aunque existan en disco.
        normalized = filename.replace('\\', '/')
        candidate = (root / normalized).resolve()
        if not candidate.is_relative_to(root) or not candidate.is_file():
            return jsonify({'error': 'Archivo no encontrado'}), 404
        db_path = 'uploads/' + normalized
        if normalized.startswith('radiografias/'):
            rad = Radiografia.query.filter_by(ruta_archivo=db_path).first()
            if not rad:
                return jsonify({'error': 'Archivo no encontrado'}), 404
            evaluation = db.session.get(EvaluacionDiagnostica, rad.id_evaluacion)
            if not evaluation or not has_module(user, '/historial', '/nueva-evaluacion', '/reportes', '/pacientes'):
                return jsonify({'error': 'No tienes permisos sobre este archivo'}), 403
        elif normalized.startswith('avatars/'):
            if not Odontologo.query.filter_by(foto_perfil='/' + db_path).first():
                return jsonify({'error': 'Archivo no encontrado'}), 404
        else:
            # Imágenes derivadas heredadas: solo si están referenciadas por un resultado clínico.
            resultado = ResultadosDeteccion.query.filter(
                ResultadosDeteccion.imagen_resultado.in_([db_path, '/' + db_path])
            ).first()
            rad = db.session.get(Radiografia, resultado.id_radiografia) if resultado else None
            evaluation = db.session.get(EvaluacionDiagnostica, rad.id_evaluacion) if rad else None
            if not evaluation:
                return jsonify({'error': 'Archivo no encontrado'}), 404
            if not has_module(user, '/historial', '/nueva-evaluacion', '/reportes', '/pacientes'):
                return jsonify({'error': 'No tienes permisos sobre este archivo'}), 403
        response = send_from_directory(root, normalized)
        response.headers['Cache-Control'] = 'private, no-store'
        return response
    
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
