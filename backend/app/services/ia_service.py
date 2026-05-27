import requests
import os
import time
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import text
from app.models import db, ResultadosDeteccion, DeteccionesCaries, Radiografia

# URL DEL MICROSERVICIO DE IA
IA_API_URL = os.getenv('IA_API_URL', 'http://127.0.0.1:8000/api/predict')

CLASS_TO_SEVERITY = {
    'Caries': 'incipiente',
    'Deep Caries': 'moderada',
    'Periapical Lesion': 'avanzada'
}

LOCALIZACION_POR_SEVERIDAD = {
    'incipiente': ['Caries Incipiente', 'Corona'],
    'moderada': ['Caries Profunda', 'Raíz'],
    'avanzada': ['Caries Periapical (Avanzada)', 'Fisura']
}

RESULTADOS_LOG_PATH = Path(os.getenv(
    'RESULTADOS_LOG_PATH',
    os.path.join(os.getcwd(), 'logs', 'resultados_radiografias.md')
))


def _ensure_log_parent_dir():
    RESULTADOS_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


def _sha256_bytes(content_bytes):
    return hashlib.sha256(content_bytes).hexdigest()


def _summarize_detections(detections):
    summary = {
        'count': len(detections),
        'classes': {},
    }

    for det in detections:
        class_name = det.get('class_display') or det.get('class') or 'Desconocida'
        summary['classes'][class_name] = summary['classes'].get(class_name, 0) + 1

    return summary


def _append_markdown_result_log(*, radiografia, image_hash, image_size_bytes, status, detections=None, confianza_global=None, tiempo_proceso_ms=None, error_message=None):
    _ensure_log_parent_dir()
    detections = detections or []
    summary = _summarize_detections(detections)
    timestamp = datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M:%S %Z')

    detection_rows = []
    for det in detections:
        class_name = det.get('class_display') or det.get('class') or 'Desconocida'
        conf = det.get('confidence', 0)
        detection_rows.append(f"- {class_name} ({conf:.4f})")

    if not detection_rows:
        detection_rows.append('- Sin detecciones')

    classes_line = ', '.join([f"{k}: {v}" for k, v in summary['classes'].items()]) or 'Sin detecciones'

    with RESULTADOS_LOG_PATH.open('a', encoding='utf-8') as log_file:
        log_file.write(f"## {timestamp}\n\n")
        log_file.write(f"- **Radiografía ID:** {radiografia.id_radiografia}\n")
        log_file.write(f"- **Archivo:** {radiografia.nombre_archivo or 'Sin nombre'}\n")
        log_file.write(f"- **Estado:** {status}\n")
        log_file.write(f"- **Hash SHA-256:** `{image_hash}`\n")
        log_file.write(f"- **Tamaño archivo:** {image_size_bytes} bytes\n")
        if confianza_global is not None:
            log_file.write(f"- **Confianza global:** {confianza_global:.4f}\n")
        if tiempo_proceso_ms is not None:
            log_file.write(f"- **Tiempo de proceso:** {tiempo_proceso_ms} ms\n")
        log_file.write(f"- **Total caries/detecciones:** {summary['count']}\n")
        log_file.write(f"- **Distribución por clases:** {classes_line}\n")
        log_file.write("- **Detecciones:**\n")
        for row in detection_rows:
            log_file.write(f"  {row}\n")
        if error_message:
            log_file.write(f"- **Error:** {error_message}\n")
        log_file.write("\n---\n\n")


def _append_markdown_error_log(*, radiografia, image_hash, image_size_bytes, status, error_message):
    _append_markdown_result_log(
        radiografia=radiografia,
        image_hash=image_hash,
        image_size_bytes=image_size_bytes,
        status=status,
        detections=[],
        confianza_global=None,
        tiempo_proceso_ms=None,
        error_message=error_message,
    )


def obtener_id_localizacion(severidad):
    nombres_posibles = LOCALIZACION_POR_SEVERIDAD.get(severidad, [])

    for nombre in nombres_posibles:
        sql = text("SELECT id_localizacion FROM localizacion_caries WHERE nombre = :nombre LIMIT 1")
        row = db.session.execute(sql, {"nombre": nombre}).fetchone()
        if row:
            return row[0]

    return 1

def procesar_radiografia_con_ia(id_radiografia):
    radiografia = Radiografia.query.get(id_radiografia)
    if not radiografia:
        return {'status': 'error', 'message': 'Radiografía no encontrada.'}
    
    ruta_fisica = os.path.join(os.getcwd(), radiografia.ruta_archivo)
    if not os.path.exists(ruta_fisica):
        return {'status': 'error', 'message': 'Archivo físico no encontrado.'}
    
    start_time = time.time()
    try:
        with open(ruta_fisica, 'rb') as img_file:
            image_bytes = img_file.read()
        image_hash = _sha256_bytes(image_bytes)
        image_size_bytes = len(image_bytes)

        resultados_previos = ResultadosDeteccion.query.filter_by(id_radiografia=id_radiografia).all()
        for resultado_prev in resultados_previos:
            db.session.delete(resultado_prev)
        db.session.flush()

        # Enviar petición a api_ia_sonrie
        with open(ruta_fisica, 'rb') as img_file:
            files = {'file': (radiografia.nombre_archivo, img_file, 'image/jpeg')}
            response = requests.post(IA_API_URL, files=files, timeout=60)
            
        print(f"  [DEBUG IA] status_code: {response.status_code}")
        try:
            print(f"  [DEBUG IA] response.json (truncado): {str(response.json())[:1000]}")
        except Exception:
            print(f"  [DEBUG IA] response.text (no JSON): {response.text[:1000]}")

        if response.status_code != 200:
            raise Exception(f'Error en microservicio IA: {response.text}')
            
        data = response.json()

        if not data.get('valid', True):
            radiografia.estado_procesado = 'error'
            db.session.commit()
            _append_markdown_error_log(
                radiografia=radiografia,
                image_hash=image_hash,
                image_size_bytes=image_size_bytes,
                status='invalid_image',
                error_message=data.get('error', 'La imagen no es válida para análisis.')
            )
            return {
                'status': 'invalid_image',
                'message': data.get('error', 'La imagen no es válida para análisis.')
            }

        detections = data.get('detections', [])
        
        tiempo_proceso = int((time.time() - start_time) * 1000)
        caries_detectada = len(detections) > 0
        confianza_global = round(max([d['confidence'] for d in detections]), 4) if caries_detectada else 0.0
        
        # 1. Crear el Resultado general
        nuevo_resultado = ResultadosDeteccion(
            id_radiografia=id_radiografia,
            modelo_version='YOLOv8s-v1.3-Mejorado',
            caries_detectada=caries_detectada,
            confianza_global=confianza_global,
            tiempo_proceso_ms=tiempo_proceso,
            error_descripcion=None
        )
        db.session.add(nuevo_resultado)
        db.session.flush() # Para obtener ID
        print(f"  [DEBUG DB] nuevo_resultado.id_resultado (after flush): {nuevo_resultado.id_resultado}")
        
        # 2. Bounding Boxes
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        cols = [c['name'] for c in inspector.get_columns('detecciones_caries')]
        has_class_probs = 'class_probabilities' in cols

        if has_class_probs:
            for det in detections:
                clase_ia = det['class']
                class_display = det.get('class_display', clase_ia)
                conf = det['confidence']
                bbox = det['bbox'] # [x1, y1, x2, y2]
                severidad = CLASS_TO_SEVERITY.get(clase_ia, 'incipiente')
                class_probabilities = det.get('class_probabilities', {})
                
                nueva_det = DeteccionesCaries(
                    id_resultado=nuevo_resultado.id_resultado,
                    id_localizacion=obtener_id_localizacion(severidad),
                    numero_diente=None, 
                    confianza=conf,
                    bbox_x=bbox[0],
                    bbox_y=bbox[1],
                    bbox_ancho=bbox[2] - bbox[0],
                    bbox_alto=bbox[3] - bbox[1],
                    severidad=severidad,
                    class_probabilities=class_probabilities
                )
                db.session.add(nueva_det)
                # Si el frontend o logs quieren usar el texto visible, lo dejamos en la respuesta.
                det['class_display'] = class_display
                det['class_probabilities'] = class_probabilities
        else:
            # Tabla antigua sin columna `class_probabilities`. Usar inserts crudos sin esa columna.
            print("  [DEBUG DB] tabla 'detecciones_caries' no tiene 'class_probabilities'. Usando INSERT crudo.")
            # Ya hemos hecho flush sobre nuevo_resultado para obtener id_resultado
            for det in detections:
                clase_ia = det['class']
                class_display = det.get('class_display', clase_ia)
                conf = det['confidence']
                bbox = det['bbox']
                severidad = CLASS_TO_SEVERITY.get(clase_ia, 'incipiente')

                sql = text(
                    "INSERT INTO detecciones_caries (id_resultado, id_localizacion, numero_diente, confianza, bbox_x, bbox_y, bbox_ancho, bbox_alto, severidad) VALUES (:id_resultado, :id_localizacion, :numero_diente, :confianza, :bbox_x, :bbox_y, :bbox_ancho, :bbox_alto, :severidad)"
                )
                params = {
                    'id_resultado': nuevo_resultado.id_resultado,
                    'id_localizacion': obtener_id_localizacion(severidad),
                    'numero_diente': None,
                    'confianza': conf,
                    'bbox_x': bbox[0],
                    'bbox_y': bbox[1],
                    'bbox_ancho': bbox[2] - bbox[0],
                    'bbox_alto': bbox[3] - bbox[1],
                    'severidad': severidad
                }
                db.session.execute(sql, params)
                det['class_display'] = class_display
            
        radiografia.estado_procesado = 'completado'
        # DEBUG: cuántas detecciones vamos a commitear
        try:
            cnt = len(detections)
        except Exception:
            cnt = 'unknown'
        print(f"  [DEBUG DB] commitando resultado id_resultado={nuevo_resultado.id_resultado} con detecciones={cnt}")
        db.session.commit()
        print(f"  [DEBUG DB] commit exitoso para id_resultado={nuevo_resultado.id_resultado}")

        _append_markdown_result_log(
            radiografia=radiografia,
            image_hash=image_hash,
            image_size_bytes=image_size_bytes,
            status='success',
            detections=detections,
            confianza_global=confianza_global,
            tiempo_proceso_ms=tiempo_proceso,
        )
        
        return {
            'status': 'success',
            'detections': detections,
            'detections_count': len(detections),
            'caries_detectada': caries_detectada,
            'confianza_global': confianza_global,
            'tiempo_proceso_ms': tiempo_proceso
        }
        
    except Exception as e:
        db.session.rollback()
        radiografia.estado_procesado = 'error'
        db.session.commit()
        try:
            with open(ruta_fisica, 'rb') as img_file:
                error_hash = _sha256_bytes(img_file.read())
                error_size = os.path.getsize(ruta_fisica)
        except Exception:
            error_hash = 'unknown'
            error_size = 0

        _append_markdown_error_log(
            radiografia=radiografia,
            image_hash=error_hash,
            image_size_bytes=error_size,
            status='error',
            error_message=str(e)
        )
        return {'status': 'error', 'message': str(e)}
