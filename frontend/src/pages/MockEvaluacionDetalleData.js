export default {
    "evaluacion": {
        "fecha_evaluacion": "2024-05-15 14:30:00",
        "motivo_consulta": "Revisión general y dolor en molar superior derecho",
        "observaciones": "Paciente presenta sensibilidad al frio. Mala higiene oral.",
        "tipo_visita": "Consulta Primera Vez",
        "id_evaluacion": 1
    },
    "paciente": {
        "apellidos": "Pérez Torres",
        "nombres": "Ana María",
        "dni": "72345678",
        "edad": 12,
        "apoderado": "Juan Pérez",
        "telefono": "987654321",
        "correo": "juan.perez@email.com",
        "id_paciente": 1
    },
    "detecciones_caries": [
        {
            "id_resultado": 1,
            "numero_diente": "16",
            "confianza": 0.95,
            "severidad": "avanzada",
            "bbox_x": null,
            "bbox_y": null,
            "bbox_ancho": null,
            "bbox_alto": null
        },
        {
            "id_resultado": 1,
            "numero_diente": "24",
            "confianza": 0.82,
            "severidad": "moderada",
            "bbox_x": null,
            "bbox_y": null,
            "bbox_ancho": null,
            "bbox_alto": null
        }
    ],
    "radiografias": [
        {
            "ruta_archivo": "uploads/radiografias/2026/04/mock.jpg",
            "id_resultado": 1
        }
    ],
    "diagnostico": {
        "diagnostico_texto": "Caries profunda en la pieza 16 con riesgo de compromiso pulpar. Caries incipiente interproximal en pieza 24.",
        "plan_tratamiento": "1) Tratamiento pulpar indirecto y resina compuesta en pieza 16. 2) Aplicación de sellante/fluor en pieza 24 y control en 3 meses.",
        "observaciones": ""
    }
}