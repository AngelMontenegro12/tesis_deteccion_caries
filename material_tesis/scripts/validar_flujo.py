import requests
import sys
import json
import os

BASE_URL = "http://127.0.0.1:5000/api"

def validar_flujo(correo, contrasena, id_paciente, ruta_imagen):
    print("=== INICIANDO VALIDACIÓN DEL FLUJO DE DETECCIÓN ===")
    
    if not os.path.exists(ruta_imagen):
        print(f"[ERROR] No se encuentra la imagen en la ruta: {ruta_imagen}")
        return

    # 1. Login
    print(f"\n1. Intentando login con el usuario: {correo}...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "correo": correo,
        "contrasena": contrasena
    })
    
    if login_response.status_code != 200:
        print(f"[ERROR] Falló el login: {login_response.text}")
        return
        
    print("[ÉXITO] Login correcto.")
    
    # 2. Crear Evaluación
    print(f"\n2. Creando evaluación para el paciente con ID {id_paciente}...")
    eval_response = requests.post(f"{BASE_URL}/evaluaciones", json={
        "id_paciente": id_paciente,
        "tipo_visita": "Primera vez",
        "motivo_consulta": "Validación automática de IA",
        "observaciones": "Generado desde script de validación"
    })
    
    if eval_response.status_code != 201:
        print(f"[ERROR] Falló al crear la evaluación: {eval_response.text}")
        return
        
    eval_data = eval_response.json()
    id_evaluacion = eval_data.get("id_evaluacion")
    print(f"[ÉXITO] Evaluación creada con ID: {id_evaluacion}")

    # 3. Subir Radiografía
    print(f"\n3. Subiendo radiografía: {ruta_imagen} ...")
    with open(ruta_imagen, 'rb') as f:
        files = {
            'file_0': (os.path.basename(ruta_imagen), f, 'image/jpeg')
        }
        data = {
            'tipo_0': '1', # 1=Panorámica (según BD)
        }
        upload_response = requests.post(f"{BASE_URL}/evaluaciones/{id_evaluacion}/radiografias", files=files, data=data)
        
    if upload_response.status_code != 201:
        print(f"[ERROR] Falló al subir radiografía: {upload_response.text}")
        return
        
    print("[ÉXITO] Radiografía subida correctamente.")

    # 4. Procesar (Iniciar detección IA)
    print("\n4. Iniciando detección con IA...")
    procesar_response = requests.post(f"{BASE_URL}/evaluaciones/{id_evaluacion}/procesar")
    
    if procesar_response.status_code != 200:
        print(f"[ERROR] Falló el procesamiento de IA: {procesar_response.text}")
        return
        
    print("[ÉXITO] Procesamiento de IA completado.")
    
    # 5. Obtener Detalle Completo
    print(f"\n5. Obteniendo detalle de la evaluación {id_evaluacion} y resultados finales...")
    detalle_response = requests.get(f"{BASE_URL}/evaluaciones/{id_evaluacion}/detalle")
    
    if detalle_response.status_code == 200:
        detalle_data = detalle_response.json()
        detecciones = detalle_data.get("detecciones_caries", [])
        print("\n=== RESULTADOS FINALES ===")
        if not detecciones:
            print("No se encontraron detecciones de caries.")
        else:
            print(f"Se encontraron {len(detecciones)} detecciones:")
            for d in detecciones:
                confianza = d.get("confianza", 0)
                try:
                    confianza_formateada = f"{float(confianza):.2f}"
                except (TypeError, ValueError):
                    confianza_formateada = str(confianza)

                print(
                    f" - ID Detección: {d.get('id_deteccion', 'N/A')} | "
                    f"Diente {d.get('numero_diente', 'N/A')}: "
                    f"Confianza {confianza_formateada}, "
                    f"Severidad: {d.get('severidad', 'N/A')}"
                )
        print("==================================================")
    else:
        print(f"[ERROR] Falló al obtener el detalle: {detalle_response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python validar_flujo.py <ruta_a_la_imagen>")
        sys.exit(1)
        
    imagen_a_subir = sys.argv[1]
    
    # Datos por defecto basados en tu base de datos bd_detec_caries_condatos.sql
    USUARIO_CORREO = "aldo.montenegro@sonrie.pe"
    USUARIO_PASSWORD = "123456"
    PACIENTE_ID = 1 
    
    validar_flujo(USUARIO_CORREO, USUARIO_PASSWORD, PACIENTE_ID, imagen_a_subir)
