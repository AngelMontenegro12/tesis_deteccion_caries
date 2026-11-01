# AUDITORÍA INTEGRAL DEL SISTEMA SEGÚN RÚBRICA DE EVALUACIÓN (14 PUNTOS)

Fecha: 1 de noviembre de 2026, America/Bogota. Proyecto: Sistema Sonríe.

## SECCIÓN 1: RESUMEN EJECUTIVO

Se encontró una aplicación con inicio de sesión, pacientes, evaluación clínica en cinco pasos, validación de radiografías, inferencia, visor de hallazgos, diagnóstico humano final, historial, PDF, reportes, administración de usuarios, solicitudes, ayuda y soporte. React 18, React Router, Vite 5, Tailwind, Axios, Lucide y Recharts están declarados en `frontend/package.json`. Flask, SQLAlchemy, PyMySQL, bcrypt y PyMuPDF están declarados en `backend/requirements.txt`. FastAPI y Uvicorn están declarados para IA; su código utiliza además Ultralytics, OpenCV, NumPy, PyTorch, Pillow y Transformers, con dependencias de IA insuficientemente declaradas.

El prototipo tiene una cobertura funcional amplia, una interfaz trabajada, validaciones reutilizables, persistencia relacional, generación de expediente y separación entre servicios. Hay controles reales de sesión y rol en soporte y solicitudes, además de un manual extenso y pruebas históricas.

No está preparado para acreditar BUENO en los siete criterios. Las principales debilidades son autorización ausente en rutas clínicas y administrativas; errores de inferencia que pueden guardarse como ausencia de detecciones y porcentajes artificiales; y desempeño no medido, con una espera visual aleatoria de 4–6 segundos añadida por el frontend. También hay contraseña recordada en texto legible en el navegador, recuperación de cuenta sin prueba de posesión, cargas sin límites efectivos en backend, atribución clínica al usuario fijo 1 y pérdida potencial de archivos ante rollback.

**Preparación general:** demostrable como prototipo académico con reservas; no hay evidencia suficiente de exactitud clínica, ejecución sin errores, resistencia avanzada, recuperación sin pérdida o escalabilidad bajo carga. **Puntuación estimada: 5.15/14.00**, provisional y no oficial.

### Método y límites de esta revisión

Se revisaron rutas registradas, lógica de negocio, modelos ORM y estructura SQL, servicio IA, detector, validadores, conexiones frontend/API, formularios, visor, PDF, configuración, dependencias, documentación y pruebas existentes. Solo se hicieron lecturas y búsquedas. No se ejecutaron servicios, tests, builds, scripts clínicos, evaluadores, entrenamientos, migraciones, peticiones HTTP ni consultas a MySQL. No se importaron módulos de aplicación ni checkpoints `.pt`.

Arrancar `backend/run.py` ejecutaría `db.create_all()`; importar evaluaciones crea directorios; inferencia y varios tests generan logs o artefactos. Por ello tampoco se usaron como verificación. No se renderizaron documentos Word/PDF ni imágenes clínicas. Se inspeccionaron referencias a estos artefactos, no su presentación visual. Los datasets masivos, dependencias instaladas y binarios no se auditaron archivo por archivo. La revisión no certifica el despliegue activo, las bibliotecas de terceros o cumplimiento normativo.

No se copiaron datos del volcado con pacientes. No se publican secretos, contraseñas, tokens ni cadenas de conexión. Se leyó únicamente la configuración no secreta necesaria del servicio IA: `MODEL_PATH=models/best_model_v2_3.pt`, `CONFIDENCE=0.45`, `CLASIFICADOR_PATH=models/clasificador_panoramica.pt` y umbral 0.60. Los dos pesos existen localmente. No se verificó la arquitectura interna del checkpoint: nombre y tamaño no acreditan YOLOv8m. Sí se verificó la llamada a Ultralytics YOLO con `imgsz=800` y tres clases.

Git ya mostraba modificaciones en `api_ia_sonrie/ubicacion_caries.md` y `material_tesis/documentacion/manual_usuario_sistema_sonrie.md`, además de `Pruebas_Tesis_Sonrie/` sin seguimiento. Se preservaron intactos. Sus resultados se consideran evidencia histórica local, no ejecución de esta auditoría.

Las rutas citadas son exactas y relativas a la raíz del proyecto. Las líneas corresponden al código inspeccionado. Estados de implementación: **I**, implementado y verificable por código; **F**, implementado pero pendiente funcional; **P**, parcial; **N**, no implementado en el alcance inspeccionado; **NV**, no verificable. Existencia de código nunca equivale a prueba funcional.

### Inventario funcional y trazabilidad real

| Funcionalidad | Archivos, símbolos y conexión real | Estado y límite |
|---|---|---|
| Rutas web | `frontend/src/App.jsx:19–43`, `Layout.jsx:40–48,131–196` | I/F; Layout confía en localStorage para acceso visual |
| Login/sesión | `pages/Login.jsx:63–83` → `backend/app/routes/auth.py:44–148`, `utils/auth.py:8–29` | P; sesión opaca Bearer, no JWT; validación aplicada solo en ciertos módulos |
| Recuperación | `Login.jsx:107,143` → `auth.py:151–220` | P; aprobación sin token de posesión |
| Pacientes | `ListaPacientes.jsx:72`, `ModalNuevoPaciente.jsx:84`, `ModalEditarPaciente.jsx:95` → `routes/pacientes.py:9–140` | F/P; listar, buscar, crear, obtener y editar; no ruta DELETE en ese módulo |
| Evaluación | `EvaluacionClinica.jsx:1094–1262` → `routes/evaluaciones.py:128–171,302–430` | F/P; flujo real con fetch sin Bearer; actor fijo |
| Validación previa | `EvaluacionClinica.jsx:877–901` → `api_ia_sonrie/app/routes/predict.py:53` `/api/validate` | P; cliente continúa tras HTTP fallido o desconexión |
| Inferencia | `EvaluacionClinica.jsx:710` → `evaluaciones.py:433–460` → `services/ia_service.py:114` → `/api/predict` | F/P; procesa cada radiografía secuencialmente |
| Detector | `api_ia_sonrie/app/services/detector.py:185`, `validar_capa0`, validadores CLIP y CLS | F/P; pipeline real, métricas del activo no certificadas |
| Persistencia | `ia_service.py:130–263`, modelos ResultadosDeteccion/DeteccionesCaries | P; reemplaza resultados; versión persistida fija incorrecta |
| Visor/detalle | `EvaluacionDetalle.jsx:98`, `BoundingBoxViewer.jsx:45–180`, `EvaluacionClinica.jsx:2531–2600` | F/P; cajas y zoom reales; algunas probabilidades calculadas artificialmente |
| Finalizar/PDF | `EvaluacionClinica.jsx:335`, `utils/downloadDiagnosticoPdf.js:3` → `evaluaciones.py:173–278` → `diagnostico_pdf.py:190` | F; guarda y exporta; exige completada y diagnóstico para PDF, sin autorización clínica |
| Historial/pendientes | `HistorialEvaluaciones.jsx:88`, `Pendientes.jsx:41` → GET `/api/evaluaciones` | F; paginación backend y filtros |
| Reportes | `Reportes.jsx:408–440`, `ReporteIndividual.jsx:296` → `routes/reportes.py:36,84,180,250` | F/P; cuatro reportes sobre DB; métricas mal interpretables |
| Dashboard | `Dashboard.jsx:57` → `routes/dashboard.py:8` | F; id_odontologo de query no aísla las consultas |
| Usuarios/perfil | `Usuarios.jsx:263,284,994`, `Perfil.jsx:139,180,223` → `routes/odontologos.py` | F/P; APIs reales con autorización insuficiente |
| Solicitudes | `Solicitudes.jsx:24,46` → `routes/solicitudes.py:13,35,73` | P; control backend real; cambio por alternancia sin rol destino persistido |
| Ayuda/soporte | `Ayuda.jsx:223,289`, `MensajesSoporte.jsx:72,142` → `routes/soporte.py` | F; sesión y superadmin comprobados en servidor |
| Preferencias | `Preferencias.jsx:117–170`, `utils/preferences.js` | F; preferencias locales por usuario; health no prueba readiness de modelos |
| Modelo de datos | `backend/app/models.py`, `bd_detec_caries_tablas.sql`, SQL complementario de soporte | I como definición; DB real NV; DDL principal no incluye solicitudes_rol/password del ORM |
| PDF interno | `diagnostico_pdf.py:80–85,190`; plantilla `backend/app/templates/reportes/diagnostico_referencia.pdf` | I/F; generación en memoria y ruta acotada a uploads; presentación no renderizada aquí |
| Archivos vacíos/históricos | `routes/analisis.py`, `context/AuthContext.jsx`, `components/Navbar.jsx` vacíos; `MockEvaluacionDetalleData.js`, `EnConstruccion.jsx` | No acreditar funciones por estos nombres; App y detalle usan pantallas/API reales |
| Documentación | README, manual, `documentacion_modelos_tesis.md`, `explicacion_sistema.md` | Existe; varias afirmaciones desactualizadas o no respaldadas |

`create_app` registra ocho blueprints en `backend/app/__init__.py:25–40`. No hay middleware general que autorice todas las rutas. No se identificó configuración operativa propia de cola, réplicas, proxy o restauración comprobada. README recomienda HTTPS y backups; eso no acredita implementación. `.gitignore` excluye modelos/datasets/uploads/logs: no reemplaza control de acceso y exige distribuir artefactos aparte.

### Pruebas y documentación preexistentes

`Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json` declara **111 variantes, 108 aprobadas y 3 fallidas**. `Verificacion_Final_Fase3.json` marca **CN-04 y CB-04 fallidos**. No se reejecutaron. `Scripts_Pruebas/caja_blanca_real.py` extrae funciones mediante AST, usa dobles de ORM y bloquea red: no acredita integración completa o cobertura total de ramas. Su caso de commit fallido de login espera HTTP 200: pasar ese test no significa cumplir seguridad.

`Evidencias_Caja_Negra/CN-04_resumen_variantes.json` documenta rechazo de imagen corrupta y vertical, pero aceptación visual de TXT tras HTTP 400. No se pulsó Continuar: no demuestra almacenamiento del TXT. Coincide con el defecto de validateImage. Hay evidencias CN-01/02/03/05 y observaciones de persistencia/PDF; no se copian sus datos identificables.

`backend/tests/test_validation.py` cubre DNI/contacto/fecha/menor y actualización parcial. `test_pdf_endpoint.py` crea SQLite en memoria, tablas y registros, finaliza evaluaciones y usa mocks. `test_diagnostico_pdf.py` crea temporales para plantilla, edad, textos largos e imágenes. `frontend/src/utils/validation.test.js` cubre reglas puras. No se ejecutó ninguna prueba. Faltan garantías integrales de autorización, pertenencia, fallos IA, carga, restauración, accesibilidad y precisión del checkpoint activo.

El manual de usuario cubre funciones reales, pero no prueba satisfacción. `explicacion_sistema.md` usa otra distribución de puntos y afirma protección universal que el código no tiene. `documentacion_modelos_tesis.md` contiene porcentajes contradictorios, incluyendo 0.71% junto a 0.7140 y otras cifras posteriores. No debe utilizarse como evidencia exacta sin reconciliar.

### Hallazgos principales

| ID | Prioridad | Qué sucede y dónde | Por qué importa / demostración segura futura | Corrección posterior |
|---|---|---|---|---|
| H01 | Crítica | Pacientes, evaluaciones, reportes, dashboard, gran parte de odontólogos y `/uploads` no verifican sesión/objeto | Datos y operaciones expuestos; solo GET de fixtures aislados en V06 | Sesión obligatoria y permiso por acción/objeto; descargas privadas |
| H02 | Crítica | `odontologos.py:160–202` confía en id_solicitante del cuerpo y permite permisos/activo/contraseña sin autorización general | Actor administrativo suplantable; mostrar código sin enviar modificaciones | Actor desde sesión; separar edición propia y administración |
| H03 | Crítica | `auth.py:186–212` cambia contraseña con correo y solicitud aprobada | No prueba que quien aprovecha aprobación sea titular; inspección sin ejecutar reset | Token aleatorio de un uso con vencimiento y canal verificado; revocar sesiones |
| H04 | Crítica | `detector.py:245–251` retorna valid=True con error; `ia_service.py:151–179` solo comprueba valid | Puede guardar completado y sin caries tras fallo; simular después con dobles | Estados de inferencia explícitos y bloquear éxito si existe error |
| H05 | Alta | `detector.py:173–177` reparte remanente 65/35; `EvaluacionClinica.jsx:2577–2586` también simula | Barras no son probabilidades multiclase auténticas | Mostrar solo scores auténticos y validar etiquetas clínicas |
| H06 | Alta | `Login.jsx:81` persiste correo/contrasena; user contiene token | Exposición en almacenamiento del navegador; mostrar escritura, no valores | Recordar solo identificador; minimizar datos persistidos y asegurar sesión |
| H07 | Alta | `evaluaciones.py:347–408` guarda bytes y borra originales antes de commit | Archivo inválido o pérdida ante rollback; simulación independiente | Validación servidor, staging y publicación/eliminación tras éxito |
| H08 | Alta | `EvaluacionClinica.jsx:636–641,716,776` demora aleatoria y cola visual | Puede superar requisito <5s aunque IA responda antes | Retirar espera artificial y medir |
| H09 | Alta | `pacientes.py:70–74`, `evaluaciones.py:134–139,197–203` usan actor=1 | No atribuye creación/diagnóstico al ejecutor real | Actor de sesión y auditoría clínica |
| H10 | Alta | CLIP/CLS y validateImage dejan pasar fallos | Validación degradada sin aviso suficiente | Readiness y estado no disponible; política segura explícita |
| H11 | Media | `ia_service.py:175` persiste YOLOv8s-v1.3 con modelo configurado v2.3 | Rompe trazabilidad modelo–resultado–métrica | Versión/hash/configuración reales en contrato y DB |
| H12 | Media | `reportes.py:51–63` cuenta confianza cero como rechazo y aceptación=100−rechazo | Imagen sana puede aparecer rechazada; no es precisión ni aceptación profesional | Separar errores/inválidas/sin hallazgos/confirmación humana |
| H13 | Media | SolicitudRol no guarda rol destino; `solicitudes.py:60–65` alterna rol | Aprobar puede no aplicar lo solicitado | Persistir transición explícita, actor y versión |
| H14 | Media | DDL principal sin solicitudes y diferencias ORM/SQL | Instalación limpia y DB activa pueden divergir | Contrastar esquema y preparar migraciones revisadas posteriormente |

## SECCIÓN 2: TABLA GENERAL DE CALIFICACIÓN

Intervalos oficiales respetados: AF/FI/FL, Deficiente [0,0.2], Malo (0.2,0.5], Debe mejorar (0.5,0.9], Bueno (0.9,1.5]. ED: [0,0.2], (0.2,0.7], (0.7,1.2], (1.2,2]. CI/SE/PR: [0,0.4], (0.4,0.8], (0.8,1.5], (1.5,2.5]. Protección repite descriptor en MALO y DEBE MEJORAR: no se inventa una distinción; se usa el rango bajo por las brechas clínicas.

| Criterio | Máximo | Puntaje estimado | Nivel | Estado | Evidencia disponible |
|---|---:|---:|---|---|---|
| Adecuación funcional | 1.50 | 0.80 | DEBE MEJORAR | Provisional, parcial | Flujo amplio; exactitud y errores pendientes |
| Eficiencia de desempeño | 2.00 | 0.60 | MALO | Provisional, no medido | Espera 4–6s, sin carga medida |
| Capacidad de interacción | 2.50 | 1.50 | DEBE MEJORAR | Provisional | Formularios/visor/ayuda; accesibilidad y satisfacción pendientes |
| Fiabilidad | 1.50 | 0.45 | MALO | Provisional, parcial | Rollback y mensajes; falso éxito IA y pérdida potencial |
| Seguridad | 2.50 | 0.40 | DEFICIENTE | Provisional | bcrypt/sesiones parciales; APIs desprotegidas |
| Flexibilidad | 1.50 | 0.80 | DEBE MEJORAR | Provisional | Modularidad; crecimiento no demostrado |
| Protección | 2.50 | 0.60 | MALO | Provisional | Restricciones puntuales; abuso y amenazas pendientes |
| TOTAL | 14.00 | 5.15 | Sin nivel total oficial | Estimación, no calificación oficial | Sin ejecución nueva |

**Evidencia vs potencial:** 5.15 es una estimación de preparación basada en implementación y defectos, no una nota funcional certificada. ED 0.60 no significa que se hayan medido demoras de hasta 7 segundos o inestabilidad; la clasificación temporal definitiva queda NV. AF/FL reconocen cobertura y modularidad sin certificar todas las afirmaciones del descriptor. CI 1.50 no supera el umbral de BUENO. El objetivo potencial es 14.00 únicamente después de corregir brechas y acreditar todas las exigencias, incluidas precisión, <5s, carga, accesibilidad y recuperación. Validar o grabar un video no suma automáticamente puntos ni garantiza máximos.

## SECCIÓN 3: AUDITORÍA DETALLADA POR CRITERIO

Cada ficha identifica A–J. La evidencia funcional y el guion son instrucciones para pruebas posteriores, no acciones realizadas. Las escenas V01–V12 se detallan en sección 5; los casos PM en sección 7. Un mismo procedimiento puede respaldar varios requisitos, pero nunca sustituye su evaluación individual.

## 3.1 ADECUACIÓN FUNCIONAL

### 3.1.1 Requisitos de la rúbrica

BUENO: Cubrir correctamente todas las funciones necesarias; capacidades adicionales pertinentes y sin errores; precisión requerida; resultados fiables y exactos; necesidades reales y funciones apropiadas que faciliten tareas.

### 3.1.2 Estado de cumplimiento

#### AF-01: Cobertura correcta de todas las funciones necesarias

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Crear, cargar, analizar, finalizar y descargar tienen conexiones reales; pacientes, historial y reportes también. Falta validación integral del circuito y de sus invariantes. |
| C. Ubicación | `backend/app/routes/evaluaciones.py:128–278; frontend/src/pages/EvaluacionClinica.jsx:1094–1262` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar flujo completo con datos coherentes y estados persistidos. |
| F. Video | V03: 1) Abrir /nueva-evaluacion; 2) seleccionar paciente ficticio; 3) completar contexto; 4) cargar panorámica; 5) procesar y abrir resultados. |
| G. Resultado esperado | Flujo completo con datos coherentes y estados persistidos. |
| H. Mejora pendiente | Validar circuito completo y actor real en servidor. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Cobertura correcta de todas las funciones necesarias». |

#### AF-02: Capacidades adicionales de valor y alta pertinencia

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Comparativa longitudinal, reportes, pendientes y soporte son capacidades adicionales conectadas; utilidad clínica no acreditada con usuarios. |
| C. Ubicación | `backend/app/routes/reportes.py:250; frontend/src/components/ReporteIndividual.jsx:296; frontend/src/pages/Ayuda.jsx:223–305` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar comparación y ayuda útiles para tareas del odontólogo. |
| F. Video | V05: 1) Abrir /reportes; 2) buscar fixture; 3) mostrar línea temporal y comparativa; 4) abrir ayuda para la interpretación. |
| G. Resultado esperado | Comparación y ayuda útiles para tareas del odontólogo. |
| H. Mejora pendiente | Validar pertinencia con usuarios y corregir significado de métricas. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta directamente «Capacidades adicionales de valor y alta pertinencia». |

#### AF-03: Ejecución de funciones sin errores

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Excepción de model(...) retorna valid=True, error y detections=[]. Backend solo rechaza valid=False y puede guardar caries_detectada=False con error_descripcion=None. |
| C. Ubicación | `api_ia_sonrie/app/services/detector.py:245–251; backend/app/services/ia_service.py:151–179` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar error técnico diferenciado de radiografía sin lesiones. |
| F. Video | V09: 1) Mostrar except de run_inference; 2) seguir consumidor en Flask; 3) explicar persistencia de éxito; 4) reservar simulación para PM-13, sin tocar modelo real. |
| G. Resultado esperado | Error técnico diferenciado de radiografía sin lesiones. |
| H. Mejora pendiente | Contrato de estados explícito; impedir éxito si error no nulo. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta directamente «Ejecución de funciones sin errores». |

#### AF-04: Nivel de precisión requerido

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Activo configurado v2.3; métricas disponibles de v2.0 no acreditan el activo. No hay umbral clínico acordado ni evaluación independiente específica adolescente verificada. |
| C. Ubicación | `api_ia_sonrie/app/services/detector.py:12–25,242; api_ia_sonrie/models/eval_v2_0.json` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar métricas atribuibles al mismo modelo de la demostración. |
| F. Video | V11: 1) Identificar checkpoint configurado sin cargarlo; 2) abrir métricas y su versión; 3) mostrar split del evaluador; 4) declarar evaluación v2.3 pendiente. |
| G. Resultado esperado | Métricas atribuibles al mismo modelo de la demostración. |
| H. Mejora pendiente | Manifiesto de hash/versión/split; evaluación independiente revisada por odontólogo. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Nivel de precisión requerido». |

#### AF-05: Resultados fiables y exactos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | extraer_probabilidades reparte 1−score con 0.65/0.35; cliente también simula remanente. No son probabilidades multiclase auténticas. Periapical Lesion se renombra caries avanzada sin validación de equivalencia clínica. |
| C. Ubicación | `api_ia_sonrie/app/services/detector.py:148–178; frontend/src/pages/EvaluacionClinica.jsx:2553–2586; EvaluacionDetalle.jsx:152–171` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar scores auténticos identificados y taxonomía clínicamente justificada. |
| F. Video | V03: 1) Abrir resultado ficticio; 2) seleccionar hallazgo; 3) comparar confidence y barras; 4) enseñar reparto; 5) explicar que confianza no es precisión clínica. |
| G. Resultado esperado | Scores auténticos identificados y taxonomía clínicamente justificada. |
| H. Mejora pendiente | Retirar distribuciones sintéticas y validar etiquetas/severidad con especialista. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Resultados fiables y exactos». |

#### AF-06: Necesidades reales de la organización

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Flujo incluye diagnóstico humano y expediente con plantilla clínica; sugiere pertinencia, pero no hay aceptación de requisitos acreditada en esta revisión. |
| C. Ubicación | `material_tesis/documentacion/manual_usuario_sistema_sonrie.md:7,408,632; backend/app/services/diagnostico_pdf.py:190` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar aceptación de tareas y alcance por responsable clínico. |
| F. Video | V04: 1) Mostrar flujo y plantilla; 2) explicar tarea clínica objetivo; 3) solicitar después al odontólogo validar tareas y precisión requerida; 4) registrar aceptación y límites. |
| G. Resultado esperado | Aceptación de tareas y alcance por responsable clínico. |
| H. Mejora pendiente | Documentar requisitos/criterios de aceptación y población adolescente. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta directamente «Necesidades reales de la organización». |

#### AF-07: Funciones apropiadas que facilitan tareas

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Visor/zoom/historial/PDF facilitan consulta. Finalizar acepta texto vacío y pone Sin diagnostico redactado, por lo que completada no demuestra revisión válida. numero_diente se guarda None en ia_service. |
| C. Ubicación | `frontend/src/components/BoundingBoxViewer.jsx:45–180; backend/app/routes/evaluaciones.py:188–214,225–278` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar expediente fiel a una revisión humana explícita. |
| F. Video | V04: 1) Mostrar zoom/cajas; 2) redactar diagnóstico ficticio no vacío; 3) finalizar; 4) recargar historial; 5) descargar expediente correcto. |
| G. Resultado esperado | Expediente fiel a una revisión humana explícita. |
| H. Mejora pendiente | Requerir confirmación/diagnóstico significativo; no anunciar numeración dental automática. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Funciones apropiadas que facilitan tareas». |

### 3.1.3 Análisis del código

**AF-01.** `backend/app/routes/evaluaciones.py:128–278; frontend/src/pages/EvaluacionClinica.jsx:1094–1262`: Crear, cargar, analizar, finalizar y descargar tienen conexiones reales; pacientes, historial y reportes también. Falta validación integral del circuito y de sus invariantes.

**AF-02.** `backend/app/routes/reportes.py:250; frontend/src/components/ReporteIndividual.jsx:296; frontend/src/pages/Ayuda.jsx:223–305`: Comparativa longitudinal, reportes, pendientes y soporte son capacidades adicionales conectadas; utilidad clínica no acreditada con usuarios.

**AF-03.** `api_ia_sonrie/app/services/detector.py:245–251; backend/app/services/ia_service.py:151–179`: Excepción de model(...) retorna valid=True, error y detections=[]. Backend solo rechaza valid=False y puede guardar caries_detectada=False con error_descripcion=None.

**AF-04.** `api_ia_sonrie/app/services/detector.py:12–25,242; api_ia_sonrie/models/eval_v2_0.json`: Activo configurado v2.3; métricas disponibles de v2.0 no acreditan el activo. No hay umbral clínico acordado ni evaluación independiente específica adolescente verificada.

**AF-05.** `api_ia_sonrie/app/services/detector.py:148–178; frontend/src/pages/EvaluacionClinica.jsx:2553–2586; EvaluacionDetalle.jsx:152–171`: extraer_probabilidades reparte 1−score con 0.65/0.35; cliente también simula remanente. No son probabilidades multiclase auténticas. Periapical Lesion se renombra caries avanzada sin validación de equivalencia clínica.

**AF-06.** `material_tesis/documentacion/manual_usuario_sistema_sonrie.md:7,408,632; backend/app/services/diagnostico_pdf.py:190`: Flujo incluye diagnóstico humano y expediente con plantilla clínica; sugiere pertinencia, pero no hay aceptación de requisitos acreditada en esta revisión.

**AF-07.** `frontend/src/components/BoundingBoxViewer.jsx:45–180; backend/app/routes/evaluaciones.py:188–214,225–278`: Visor/zoom/historial/PDF facilitan consulta. Finalizar acepta texto vacío y pone Sin diagnostico redactado, por lo que completada no demuestra revisión válida. numero_diente se guarda None en ia_service.

### 3.1.4 Evidencias existentes

Código de las fichas y evidencia histórica de sección 1. Los estados parciales no acreditan ejecución. Las ubicaciones identifican funciones, componentes y endpoints por el inventario. No hay resultados funcionales nuevos.

### 3.1.5 Guía para grabar el video

Para cada ficha: usar la pantalla, datos ficticios y precondiciones de su escena en sección 5; ejecutar F en orden y contrastar G. Enseñar C sin secretos. Narrar: «Esta escena verifica adecuación funcional en la propiedad indicada; el código no basta para afirmar aprobación». Si A es No cumple, mostrar la brecha y reservar demostración positiva para después de corregir. Si A es No verificable, no anticipar resultado.

**AF-01, V03. Objetivo:** Cobertura correcta de todas las funciones necesarias. **Acciones:** 1) Abrir /nueva-evaluacion; 2) seleccionar paciente ficticio; 3) completar contexto; 4) cargar panorámica; 5) procesar y abrir resultados. **Código:** `backend/app/routes/evaluaciones.py:128–278; frontend/src/pages/EvaluacionClinica.jsx:1094–1262`. **Observación focal:** Flujo completo con datos coherentes y estados persistidos. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-02, V05. Objetivo:** Capacidades adicionales de valor y alta pertinencia. **Acciones:** 1) Abrir /reportes; 2) buscar fixture; 3) mostrar línea temporal y comparativa; 4) abrir ayuda para la interpretación. **Código:** `backend/app/routes/reportes.py:250; frontend/src/components/ReporteIndividual.jsx:296; frontend/src/pages/Ayuda.jsx:223–305`. **Observación focal:** Comparación y ayuda útiles para tareas del odontólogo. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-03, V09. Objetivo:** Ejecución de funciones sin errores. **Acciones:** 1) Mostrar except de run_inference; 2) seguir consumidor en Flask; 3) explicar persistencia de éxito; 4) reservar simulación para PM-13, sin tocar modelo real. **Código:** `api_ia_sonrie/app/services/detector.py:245–251; backend/app/services/ia_service.py:151–179`. **Observación focal:** Error técnico diferenciado de radiografía sin lesiones. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-04, V11. Objetivo:** Nivel de precisión requerido. **Acciones:** 1) Identificar checkpoint configurado sin cargarlo; 2) abrir métricas y su versión; 3) mostrar split del evaluador; 4) declarar evaluación v2.3 pendiente. **Código:** `api_ia_sonrie/app/services/detector.py:12–25,242; api_ia_sonrie/models/eval_v2_0.json`. **Observación focal:** Métricas atribuibles al mismo modelo de la demostración. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-05, V03. Objetivo:** Resultados fiables y exactos. **Acciones:** 1) Abrir resultado ficticio; 2) seleccionar hallazgo; 3) comparar confidence y barras; 4) enseñar reparto; 5) explicar que confianza no es precisión clínica. **Código:** `api_ia_sonrie/app/services/detector.py:148–178; frontend/src/pages/EvaluacionClinica.jsx:2553–2586; EvaluacionDetalle.jsx:152–171`. **Observación focal:** Scores auténticos identificados y taxonomía clínicamente justificada. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-06, V04. Objetivo:** Necesidades reales de la organización. **Acciones:** 1) Mostrar flujo y plantilla; 2) explicar tarea clínica objetivo; 3) solicitar después al odontólogo validar tareas y precisión requerida; 4) registrar aceptación y límites. **Código:** `material_tesis/documentacion/manual_usuario_sistema_sonrie.md:7,408,632; backend/app/services/diagnostico_pdf.py:190`. **Observación focal:** Aceptación de tareas y alcance por responsable clínico. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**AF-07, V04. Objetivo:** Funciones apropiadas que facilitan tareas. **Acciones:** 1) Mostrar zoom/cajas; 2) redactar diagnóstico ficticio no vacío; 3) finalizar; 4) recargar historial; 5) descargar expediente correcto. **Código:** `frontend/src/components/BoundingBoxViewer.jsx:45–180; backend/app/routes/evaluaciones.py:188–214,225–278`. **Observación focal:** Expediente fiel a una revisión humana explícita. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

### 3.1.6 Funcionalidades faltantes o deficientes

- **AF-01: Cumple parcialmente.** Crear, cargar, analizar, finalizar y descargar tienen conexiones reales; pacientes, historial y reportes también. Falta validación integral del circuito y de sus invariantes.

- **AF-02: Cumple parcialmente.** Comparativa longitudinal, reportes, pendientes y soporte son capacidades adicionales conectadas; utilidad clínica no acreditada con usuarios.

- **AF-03: No cumple.** Excepción de model(...) retorna valid=True, error y detections=[]. Backend solo rechaza valid=False y puede guardar caries_detectada=False con error_descripcion=None.

- **AF-04: No verificable.** Activo configurado v2.3; métricas disponibles de v2.0 no acreditan el activo. No hay umbral clínico acordado ni evaluación independiente específica adolescente verificada.

- **AF-05: No cumple.** extraer_probabilidades reparte 1−score con 0.65/0.35; cliente también simula remanente. No son probabilidades multiclase auténticas. Periapical Lesion se renombra caries avanzada sin validación de equivalencia clínica.

- **AF-06: Cumple parcialmente.** Flujo incluye diagnóstico humano y expediente con plantilla clínica; sugiere pertinencia, pero no hay aceptación de requisitos acreditada en esta revisión.

- **AF-07: Cumple parcialmente.** Visor/zoom/historial/PDF facilitan consulta. Finalizar acepta texto vacío y pone Sin diagnostico redactado, por lo que completada no demuestra revisión válida. numero_diente se guarda None en ia_service.

### 3.1.7 Mejoras recomendadas

| ID | Módulo involucrado | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| AF-01 | `backend/app/routes/evaluaciones.py:128–278; frontend/src/pages/EvaluacionClinica.jsx:1094–1262` | Validar circuito completo y actor real en servidor. | Alta | Flujo completo con datos coherentes y estados persistidos. |
| AF-02 | `backend/app/routes/reportes.py:250; frontend/src/components/ReporteIndividual.jsx:296; frontend/src/pages/Ayuda.jsx:223–305` | Validar pertinencia con usuarios y corregir significado de métricas. | Media | Comparación y ayuda útiles para tareas del odontólogo. |
| AF-03 | `api_ia_sonrie/app/services/detector.py:245–251; backend/app/services/ia_service.py:151–179` | Contrato de estados explícito; impedir éxito si error no nulo. | Crítica | Error técnico diferenciado de radiografía sin lesiones. |
| AF-04 | `api_ia_sonrie/app/services/detector.py:12–25,242; api_ia_sonrie/models/eval_v2_0.json` | Manifiesto de hash/versión/split; evaluación independiente revisada por odontólogo. | Alta | Métricas atribuibles al mismo modelo de la demostración. |
| AF-05 | `api_ia_sonrie/app/services/detector.py:148–178; frontend/src/pages/EvaluacionClinica.jsx:2553–2586; EvaluacionDetalle.jsx:152–171` | Retirar distribuciones sintéticas y validar etiquetas/severidad con especialista. | Alta | Scores auténticos identificados y taxonomía clínicamente justificada. |
| AF-06 | `material_tesis/documentacion/manual_usuario_sistema_sonrie.md:7,408,632; backend/app/services/diagnostico_pdf.py:190` | Documentar requisitos/criterios de aceptación y población adolescente. | Media | Aceptación de tareas y alcance por responsable clínico. |
| AF-07 | `frontend/src/components/BoundingBoxViewer.jsx:45–180; backend/app/routes/evaluaciones.py:188–214,225–278` | Requerir confirmación/diagnóstico significativo; no anunciar numeración dental automática. | Alta | Expediente fiel a una revisión humana explícita. |

### 3.1.8 Puntaje estimado y justificación

**0.80/1.50 — DEBE MEJORAR, provisional.** Está en (0.5,0.9]. Reconoce cobertura del flujo; errores de inferencia, semántica de probabilidades y falta de evaluación del modelo activo impiden BUENO. No certifica mayoría de funciones probadas.


## 3.2 EFICIENCIA DE DESEMPEÑO

### 3.2.1 Requisitos de la rúbrica

BUENO: Tiempos de respuesta y tasas de rendimiento sin demora crítica, menores de 5 segundos; recursos eficientes y equilibrados; alta estabilidad soportando carga real exigente.

### 3.2.2 Estado de cumplimiento

#### ED-01: Tiempos de respuesta menores de 5 segundos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Espera aleatoria 4000–6000 ms y cola visual además de HTTP. timeout=60 y aborto cliente 120000 son límites, no latencias medidas. |
| C. Ubicación | `frontend/src/pages/EvaluacionClinica.jsx:636–641,716,776; backend/app/services/ia_service.py:138` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar duraciones reales por operación comparadas con <5s. |
| F. Video | V08: 1) Abrir Network; 2) medir clic→resultado usable; 3) anotar duración /procesar; 4) repetir diez rondas; 5) separar arranque frío y caliente. |
| G. Resultado esperado | Duraciones reales por operación comparadas con <5s. |
| H. Mejora pendiente | Retirar espera artificial; medir UI/API/IA por separado. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Tiempos de respuesta menores de 5 segundos». |

#### ED-02: Tasas de rendimiento sin demoras críticas

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Flask procesa radiografías secuencialmente. Endpoint async llama inferencia síncrona; puede bloquear el event loop mientras ejecuta trabajo. Throughput no medido. |
| C. Ubicación | `backend/app/routes/evaluaciones.py:444–451; api_ia_sonrie/app/routes/predict.py:30–34` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar tasa de trabajo con concurrencia, tamaño de lote y errores declarados. |
| F. Video | V08: 1) Medir un lote ficticio; 2) contar finalizadas/intervalo; 3) repetir con dos usuarios y luego tres solo si estable; 4) registrar cola y errores. |
| G. Resultado esperado | Tasa de trabajo con concurrencia, tamaño de lote y errores declarados. |
| H. Mejora pendiente | Medir demanda y evaluar trabajadores/cola acotados si hace falta. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Tasas de rendimiento sin demoras críticas». |

#### ED-03: Uso eficiente y equilibrado de recursos

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Modelos cacheados reducen recarga; CLIP puede descargar en primer uso. Archivos se leen completos y listado pacientes materializa todas sus evaluaciones, con posible N+1. Sin perfil CPU/GPU/RAM. |
| C. Ubicación | `api_ia_sonrie/app/utils/clip_validator.py:23–42; cls_validator.py:34–51; backend/app/routes/pacientes.py:12–29` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar recursos registrados, acotados y sin crecimiento acumulativo. |
| F. Video | V08: 1) Registrar recursos en reposo; 2) observar al validar y procesar; 3) repetir varias rondas; 4) comparar memoria final; 5) declarar hardware. |
| G. Resultado esperado | Recursos registrados, acotados y sin crecimiento acumulativo. |
| H. Mejora pendiente | Preaprovisionar modelos; límites de carga, paginación servidor y perfil de consultas. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta directamente «Uso eficiente y equilibrado de recursos». |

#### ED-04: Alta estabilidad con carga real en escenarios exigentes

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Arranque de desarrollo y almacenamiento local; no hay ensayo sostenido o de capacidad. Separación de procesos no acredita estabilidad bajo exigencia. |
| C. Ubicación | `backend/run.py:5–11; api_ia_sonrie/run.py:7–11; backend/app/routes/auth.py:13` |
| D. Evidencia técnica | Lectura del recorrido y condiciones citados; no ejecución. |
| E. Evidencia funcional | Mostrar carga pactada atendida con métricas observadas y límites explícitos. |
| F. Video | V08: 1) Definir usuarios/lotes de consulta real; 2) ensayar carga acotada en copia; 3) registrar errores/latencias/recursos; 4) detener ante presión; 5) comparar con objetivos. |
| G. Resultado esperado | Carga pactada atendida con métricas observadas y límites explícitos. |
| H. Mejora pendiente | Despliegue adecuado y ensayo representativo con umbral de parada. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta directamente «Alta estabilidad con carga real en escenarios exigentes». |

### 3.2.3 Análisis del código

**ED-01.** `frontend/src/pages/EvaluacionClinica.jsx:636–641,716,776; backend/app/services/ia_service.py:138`: Espera aleatoria 4000–6000 ms y cola visual además de HTTP. timeout=60 y aborto cliente 120000 son límites, no latencias medidas.

**ED-02.** `backend/app/routes/evaluaciones.py:444–451; api_ia_sonrie/app/routes/predict.py:30–34`: Flask procesa radiografías secuencialmente. Endpoint async llama inferencia síncrona; puede bloquear el event loop mientras ejecuta trabajo. Throughput no medido.

**ED-03.** `api_ia_sonrie/app/utils/clip_validator.py:23–42; cls_validator.py:34–51; backend/app/routes/pacientes.py:12–29`: Modelos cacheados reducen recarga; CLIP puede descargar en primer uso. Archivos se leen completos y listado pacientes materializa todas sus evaluaciones, con posible N+1. Sin perfil CPU/GPU/RAM.

**ED-04.** `backend/run.py:5–11; api_ia_sonrie/run.py:7–11; backend/app/routes/auth.py:13`: Arranque de desarrollo y almacenamiento local; no hay ensayo sostenido o de capacidad. Separación de procesos no acredita estabilidad bajo exigencia.

### 3.2.4 Evidencias existentes

Código de las fichas y evidencia histórica de sección 1. Los estados parciales no acreditan ejecución. Las ubicaciones identifican funciones, componentes y endpoints por el inventario. No hay resultados funcionales nuevos.

### 3.2.5 Guía para grabar el video

Para cada ficha: usar la pantalla, datos ficticios y precondiciones de su escena en sección 5; ejecutar F en orden y contrastar G. Enseñar C sin secretos. Narrar: «Esta escena verifica eficiencia de desempeño en la propiedad indicada; el código no basta para afirmar aprobación». Si A es No cumple, mostrar la brecha y reservar demostración positiva para después de corregir. Si A es No verificable, no anticipar resultado.

**ED-01, V08. Objetivo:** Tiempos de respuesta menores de 5 segundos. **Acciones:** 1) Abrir Network; 2) medir clic→resultado usable; 3) anotar duración /procesar; 4) repetir diez rondas; 5) separar arranque frío y caliente. **Código:** `frontend/src/pages/EvaluacionClinica.jsx:636–641,716,776; backend/app/services/ia_service.py:138`. **Observación focal:** Duraciones reales por operación comparadas con <5s. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**ED-02, V08. Objetivo:** Tasas de rendimiento sin demoras críticas. **Acciones:** 1) Medir un lote ficticio; 2) contar finalizadas/intervalo; 3) repetir con dos usuarios y luego tres solo si estable; 4) registrar cola y errores. **Código:** `backend/app/routes/evaluaciones.py:444–451; api_ia_sonrie/app/routes/predict.py:30–34`. **Observación focal:** Tasa de trabajo con concurrencia, tamaño de lote y errores declarados. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**ED-03, V08. Objetivo:** Uso eficiente y equilibrado de recursos. **Acciones:** 1) Registrar recursos en reposo; 2) observar al validar y procesar; 3) repetir varias rondas; 4) comparar memoria final; 5) declarar hardware. **Código:** `api_ia_sonrie/app/utils/clip_validator.py:23–42; cls_validator.py:34–51; backend/app/routes/pacientes.py:12–29`. **Observación focal:** Recursos registrados, acotados y sin crecimiento acumulativo. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

**ED-04, V08. Objetivo:** Alta estabilidad con carga real en escenarios exigentes. **Acciones:** 1) Definir usuarios/lotes de consulta real; 2) ensayar carga acotada en copia; 3) registrar errores/latencias/recursos; 4) detener ante presión; 5) comparar con objetivos. **Código:** `backend/run.py:5–11; api_ia_sonrie/run.py:7–11; backend/app/routes/auth.py:13`. **Observación focal:** Carga pactada atendida con métricas observadas y límites explícitos. **Preparación:** copia ficticia aislada y condiciones de la escena; funcional pendiente.

### 3.2.6 Funcionalidades faltantes o deficientes

- **ED-01: No verificable.** Espera aleatoria 4000–6000 ms y cola visual además de HTTP. timeout=60 y aborto cliente 120000 son límites, no latencias medidas.

- **ED-02: No verificable.** Flask procesa radiografías secuencialmente. Endpoint async llama inferencia síncrona; puede bloquear el event loop mientras ejecuta trabajo. Throughput no medido.

- **ED-03: Cumple parcialmente.** Modelos cacheados reducen recarga; CLIP puede descargar en primer uso. Archivos se leen completos y listado pacientes materializa todas sus evaluaciones, con posible N+1. Sin perfil CPU/GPU/RAM.

- **ED-04: No verificable.** Arranque de desarrollo y almacenamiento local; no hay ensayo sostenido o de capacidad. Separación de procesos no acredita estabilidad bajo exigencia.

### 3.2.7 Mejoras recomendadas

| ID | Módulo involucrado | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| ED-01 | `frontend/src/pages/EvaluacionClinica.jsx:636–641,716,776; backend/app/services/ia_service.py:138` | Retirar espera artificial; medir UI/API/IA por separado. | Alta | Duraciones reales por operación comparadas con <5s. |
| ED-02 | `backend/app/routes/evaluaciones.py:444–451; api_ia_sonrie/app/routes/predict.py:30–34` | Medir demanda y evaluar trabajadores/cola acotados si hace falta. | Alta | Tasa de trabajo con concurrencia, tamaño de lote y errores declarados. |
| ED-03 | `api_ia_sonrie/app/utils/clip_validator.py:23–42; cls_validator.py:34–51; backend/app/routes/pacientes.py:12–29` | Preaprovisionar modelos; límites de carga, paginación servidor y perfil de consultas. | Media | Recursos registrados, acotados y sin crecimiento acumulativo. |
| ED-04 | `backend/run.py:5–11; api_ia_sonrie/run.py:7–11; backend/app/routes/auth.py:13` | Despliegue adecuado y ensayo representativo con umbral de parada. | Alta | Carga pactada atendida con métricas observadas y límites explícitos. |

### 3.2.8 Puntaje estimado y justificación

**0.60/2.00 — MALO, provisional.** Está en (0.2,0.7]. Hipótesis conservadora de preparación, no medición de hasta 7s ni prueba de inestabilidad. La puntuación temporal definitiva es NV; espera artificial y falta de carga medida impiden justificar BUENO.


## 3.3 CAPACIDAD DE INTERACCIÓN

### 3.3.1 Requisitos de la rúbrica

BUENO: Interacción estéticamente agradable, satisfactoria, intuitiva, accesible y motivadora; tareas complejas fáciles; comprensión autónoma sin capacitación extensa; prevención de errores; retroalimentación oportuna y clara; ayuda detallada y entendible.

### 3.3.2 Estado de cumplimiento

#### CI-01: Estética agradable

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Paleta, tipografía y tarjetas consistentes en código. No se renderizó la aplicación para juzgar estética o cortes. |
| C. Ubicación | `frontend/tailwind.config.js:8; frontend/src/index.css:5; frontend/src/components/Layout.jsx:211` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar pantallas legibles, coherentes y sin superposición. |
| F. Video | V10: 1) Abrir dashboard y pacientes; 2) comparar formularios/tarjetas; 3) revisar 1366×768 y 390×844; 4) registrar cortes/contraste. |
| G. Resultado esperado | Pantallas legibles, coherentes y sin superposición. |
| H. Mejora pendiente | Revisión visual representativa y contraste. |
| I. Prioridad | Baja |
| J. Impacto en BUENO | Afecta «Estética agradable». |

#### CI-02: Interacción satisfactoria

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Flujo guiado existente, sin estudio de satisfacción. La demora artificial y validación defectuosa pueden causar fricción. |
| C. Ubicación | `frontend/src/pages/EvaluacionClinica.jsx:636–641; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar opinión y resultados de tarea de usuarios reales con datos ficticios. |
| F. Video | V10: 1) Definir tarea de ensayo; 2) observar odontólogo; 3) registrar éxito/errores; 4) recoger satisfacción sin sugerir respuesta. |
| G. Resultado esperado | Opinión y resultados de tarea de usuarios reales con datos ficticios. |
| H. Mejora pendiente | Evaluar con usuarios tras resolver brechas. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Interacción satisfactoria». |

#### CI-03: Interacción intuitiva

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Rutas por entidades clínicas y pasos visibles orientan, pero claridad para usuario nuevo no observada. |
| C. Ubicación | `frontend/src/App.jsx:27–42; frontend/src/pages/EvaluacionClinica.jsx:1596–1615` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar usuario identifica tarea y siguiente acción sin guía constante. |
| F. Video | V10: 1) Abrir nueva evaluación; 2) pedir identificar siguiente paso; 3) avanzar y retroceder sin explicación; 4) comprobar conservación de contexto. |
| G. Resultado esperado | Usuario identifica tarea y siguiente acción sin guía constante. |
| H. Mejora pendiente | Validar etiquetas/navegación con usuarios nuevos. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Interacción intuitiva». |

#### CI-04: Accesibilidad

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Hay aria-label/aria-invalid/alert. ModalConfirmacion no tiene role=dialog, aria-modal ni manejo explícito de foco/Escape. Pan/cajas requieren evaluación por teclado. |
| C. Ubicación | `frontend/src/components/Layout.jsx:409–411; frontend/src/pages/Perfil.jsx:344–370; frontend/src/components/ModalConfirmacion.jsx:45` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar foco visible y contenido, semántica correcta y tarea sin ratón. |
| F. Video | V10: 1) Abrir modal con teclado; 2) recorrer Tab/Shift+Tab; 3) probar Escape; 4) verificar retorno de foco; 5) repetir zoom 200% y lector. |
| G. Resultado esperado | Foco visible y contenido, semántica correcta y tarea sin ratón. |
| H. Mejora pendiente | Semántica y gestión de foco, controles alternativos y verificación lector/contraste. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Accesibilidad». |

#### CI-05: Interacción motivadora

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Confirmación y animaciones existen. No acreditan motivación y el avance decorativo puede inducir interpretación errónea. |
| C. Ubicación | `frontend/src/components/ModalFinalizacion.jsx:6; frontend/src/pages/EvaluacionClinica.jsx:1472` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar usuario comprende avance real y considera útil continuar. |
| F. Video | V10: 1) Mostrar confirmación real tras guardar; 2) observar comprensión del avance; 3) preguntar utilidad; 4) registrar respuesta sin equiparar animación con motivación. |
| G. Resultado esperado | Usuario comprende avance real y considera útil continuar. |
| H. Mejora pendiente | Evaluar utilidad percibida y eliminar esperas/progreso artificiales. |
| I. Prioridad | Baja |
| J. Impacto en BUENO | Afecta «Interacción motivadora». |

#### CI-06: Completar tareas complejas con facilidad

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Cinco pasos, reanudación y resultado están implementados. Componente clínico de más de 2700 líneas mezcla red/estados/vista; facilidad no observada. |
| C. Ubicación | `frontend/src/pages/EvaluacionClinica.jsx:335,1094–1262; frontend/src/pages/Pendientes.jsx:41` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar tarea completada sin bloqueos ni duplicación innecesaria. |
| F. Video | V03: 1) Seleccionar fixture; 2) completar cinco pasos; 3) consultar pendientes; 4) reanudar caso de ensayo; 5) contar pasos repetidos/errores. |
| G. Resultado esperado | Tarea completada sin bloqueos ni duplicación innecesaria. |
| H. Mejora pendiente | Validar tarea y separar hooks/servicios/vistas posteriormente. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Completar tareas complejas con facilidad». |

#### CI-07: Comprensión autónoma sin capacitación extensa

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | FAQ/manual/soporte existen, sin prueba de comprensión autónoma; documentación histórica promete más seguridad de la implementada. |
| C. Ubicación | `frontend/src/pages/Ayuda.jsx:223–305; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408,587,632` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar usuario completa tarea y resuelve dudas con ayuda del sistema. |
| F. Video | V10: 1) Dar tarea sin explicar; 2) permitir FAQ/manual; 3) registrar ayuda solicitada y tiempo; 4) contrastar lectura correcta de resultados. |
| G. Resultado esperado | Usuario completa tarea y resuelve dudas con ayuda del sistema. |
| H. Mejora pendiente | Alinear ayuda con límites reales y evaluar autonomía. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Comprensión autónoma sin capacitación extensa». |

#### CI-08: Prevención de errores del usuario

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | DNI/fechas/teléfonos/apoderado se validan en ambos lados; validateImage permite HTTP fallido o desconexión y el backend guarda bytes sin validación equivalente. |
| C. Ubicación | `backend/app/utils/validation.py:29–60; frontend/src/pages/EvaluacionClinica.jsx:877–901` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar datos o archivos inválidos no permiten continuar, con explicación clara. |
| F. Video | V09: 1) Mostrar DNI inválido; 2) omitir apoderado en menor; 3) seleccionar TXT pequeño; 4) observar HTTP y si habilita Continuar; 5) no avanzar inválido. |
| G. Resultado esperado | Datos o archivos inválidos no permiten continuar, con explicación clara. |
| H. Mejora pendiente | Rechazar error HTTP/red y validar cargas en servidor. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Prevención de errores del usuario». |

#### CI-09: Retroalimentación oportuna y clara

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Hay carga, error PDF y comprobación de estados anidados. Avance temporizado no representa inferencia y un fallo del modelo puede ocultarse antes de UI. |
| C. Ubicación | `frontend/src/pages/EvaluacionClinica.jsx:700–783; frontend/src/pages/EvaluacionDetalle.jsx:449–463` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar mensajes y progreso corresponden al estado real y permiten reintento seguro. |
| F. Video | V03: 1) Procesar fixture; 2) comparar avance con Network; 3) observar resultado/error; 4) mostrar mensajes PDF y evitar llamar éxito al fallo. |
| G. Resultado esperado | Mensajes y progreso corresponden al estado real y permiten reintento seguro. |
| H. Mejora pendiente | Estados reales, mensaje específico y eliminación de progreso ficticio. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Retroalimentación oportuna y clara». |

#### CI-10: Ayuda detallada y entendible

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Manual cubre cuenta/pacientes/visor/reportes/soporte; explicacion_sistema usa otra rúbrica y afirma autorización universal no respaldada. |
| C. Ubicación | `frontend/src/pages/Ayuda.jsx; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:111–1133` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar ayuda localizable y explicación fiel sin promesas infundadas. |
| F. Video | V10: 1) Abrir /ayuda; 2) buscar carga de radiografías; 3) mostrar apartado de interpretación; 4) comparar manual y comportamiento; 5) señalar pendientes. |
| G. Resultado esperado | Ayuda localizable y explicación fiel sin promesas infundadas. |
| H. Mejora pendiente | Actualizar manual/guion y validar comprensión. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Ayuda detallada y entendible». |

### 3.3.3 Análisis del código

**CI-01** — `frontend/tailwind.config.js:8; frontend/src/index.css:5; frontend/src/components/Layout.jsx:211`: Paleta, tipografía y tarjetas consistentes en código. No se renderizó la aplicación para juzgar estética o cortes.

**CI-02** — `frontend/src/pages/EvaluacionClinica.jsx:636–641; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408`: Flujo guiado existente, sin estudio de satisfacción. La demora artificial y validación defectuosa pueden causar fricción.

**CI-03** — `frontend/src/App.jsx:27–42; frontend/src/pages/EvaluacionClinica.jsx:1596–1615`: Rutas por entidades clínicas y pasos visibles orientan, pero claridad para usuario nuevo no observada.

**CI-04** — `frontend/src/components/Layout.jsx:409–411; frontend/src/pages/Perfil.jsx:344–370; frontend/src/components/ModalConfirmacion.jsx:45`: Hay aria-label/aria-invalid/alert. ModalConfirmacion no tiene role=dialog, aria-modal ni manejo explícito de foco/Escape. Pan/cajas requieren evaluación por teclado.

**CI-05** — `frontend/src/components/ModalFinalizacion.jsx:6; frontend/src/pages/EvaluacionClinica.jsx:1472`: Confirmación y animaciones existen. No acreditan motivación y el avance decorativo puede inducir interpretación errónea.

**CI-06** — `frontend/src/pages/EvaluacionClinica.jsx:335,1094–1262; frontend/src/pages/Pendientes.jsx:41`: Cinco pasos, reanudación y resultado están implementados. Componente clínico de más de 2700 líneas mezcla red/estados/vista; facilidad no observada.

**CI-07** — `frontend/src/pages/Ayuda.jsx:223–305; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408,587,632`: FAQ/manual/soporte existen, sin prueba de comprensión autónoma; documentación histórica promete más seguridad de la implementada.

**CI-08** — `backend/app/utils/validation.py:29–60; frontend/src/pages/EvaluacionClinica.jsx:877–901`: DNI/fechas/teléfonos/apoderado se validan en ambos lados; validateImage permite HTTP fallido o desconexión y el backend guarda bytes sin validación equivalente.

**CI-09** — `frontend/src/pages/EvaluacionClinica.jsx:700–783; frontend/src/pages/EvaluacionDetalle.jsx:449–463`: Hay carga, error PDF y comprobación de estados anidados. Avance temporizado no representa inferencia y un fallo del modelo puede ocultarse antes de UI.

**CI-10** — `frontend/src/pages/Ayuda.jsx; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:111–1133`: Manual cubre cuenta/pacientes/visor/reportes/soporte; explicacion_sistema usa otra rúbrica y afirma autorización universal no respaldada.

### 3.3.4 Evidencias existentes

Código citado y documentación/pruebas históricas de sección 1. No hay ejecución nueva. La implementación parcial no certifica propiedades de experiencia ni disponibilidad.

### 3.3.5 Guía para grabar el video

Usar datos, pantallas y precondiciones de las escenas en sección 5. Las acciones por ficha son secuenciales. Narrar el resultado observado, no un éxito anticipado.

**CI-01, escena V10. Objetivo:** Estética agradable. **Acciones:** 1) Abrir dashboard y pacientes; 2) comparar formularios/tarjetas; 3) revisar 1366×768 y 390×844; 4) registrar cortes/contraste. **Mostrar código:** `frontend/tailwind.config.js:8; frontend/src/index.css:5; frontend/src/components/Layout.jsx:211`. **Esperado:** Pantallas legibles, coherentes y sin superposición. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-02, escena V10. Objetivo:** Interacción satisfactoria. **Acciones:** 1) Definir tarea de ensayo; 2) observar odontólogo; 3) registrar éxito/errores; 4) recoger satisfacción sin sugerir respuesta. **Mostrar código:** `frontend/src/pages/EvaluacionClinica.jsx:636–641; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408`. **Esperado:** Opinión y resultados de tarea de usuarios reales con datos ficticios. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-03, escena V10. Objetivo:** Interacción intuitiva. **Acciones:** 1) Abrir nueva evaluación; 2) pedir identificar siguiente paso; 3) avanzar y retroceder sin explicación; 4) comprobar conservación de contexto. **Mostrar código:** `frontend/src/App.jsx:27–42; frontend/src/pages/EvaluacionClinica.jsx:1596–1615`. **Esperado:** Usuario identifica tarea y siguiente acción sin guía constante. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-04, escena V10. Objetivo:** Accesibilidad. **Acciones:** 1) Abrir modal con teclado; 2) recorrer Tab/Shift+Tab; 3) probar Escape; 4) verificar retorno de foco; 5) repetir zoom 200% y lector. **Mostrar código:** `frontend/src/components/Layout.jsx:409–411; frontend/src/pages/Perfil.jsx:344–370; frontend/src/components/ModalConfirmacion.jsx:45`. **Esperado:** Foco visible y contenido, semántica correcta y tarea sin ratón. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-05, escena V10. Objetivo:** Interacción motivadora. **Acciones:** 1) Mostrar confirmación real tras guardar; 2) observar comprensión del avance; 3) preguntar utilidad; 4) registrar respuesta sin equiparar animación con motivación. **Mostrar código:** `frontend/src/components/ModalFinalizacion.jsx:6; frontend/src/pages/EvaluacionClinica.jsx:1472`. **Esperado:** Usuario comprende avance real y considera útil continuar. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-06, escena V03. Objetivo:** Completar tareas complejas con facilidad. **Acciones:** 1) Seleccionar fixture; 2) completar cinco pasos; 3) consultar pendientes; 4) reanudar caso de ensayo; 5) contar pasos repetidos/errores. **Mostrar código:** `frontend/src/pages/EvaluacionClinica.jsx:335,1094–1262; frontend/src/pages/Pendientes.jsx:41`. **Esperado:** Tarea completada sin bloqueos ni duplicación innecesaria. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-07, escena V10. Objetivo:** Comprensión autónoma sin capacitación extensa. **Acciones:** 1) Dar tarea sin explicar; 2) permitir FAQ/manual; 3) registrar ayuda solicitada y tiempo; 4) contrastar lectura correcta de resultados. **Mostrar código:** `frontend/src/pages/Ayuda.jsx:223–305; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408,587,632`. **Esperado:** Usuario completa tarea y resuelve dudas con ayuda del sistema. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-08, escena V09. Objetivo:** Prevención de errores del usuario. **Acciones:** 1) Mostrar DNI inválido; 2) omitir apoderado en menor; 3) seleccionar TXT pequeño; 4) observar HTTP y si habilita Continuar; 5) no avanzar inválido. **Mostrar código:** `backend/app/utils/validation.py:29–60; frontend/src/pages/EvaluacionClinica.jsx:877–901`. **Esperado:** Datos o archivos inválidos no permiten continuar, con explicación clara. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-09, escena V03. Objetivo:** Retroalimentación oportuna y clara. **Acciones:** 1) Procesar fixture; 2) comparar avance con Network; 3) observar resultado/error; 4) mostrar mensajes PDF y evitar llamar éxito al fallo. **Mostrar código:** `frontend/src/pages/EvaluacionClinica.jsx:700–783; frontend/src/pages/EvaluacionDetalle.jsx:449–463`. **Esperado:** Mensajes y progreso corresponden al estado real y permiten reintento seguro. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**CI-10, escena V10. Objetivo:** Ayuda detallada y entendible. **Acciones:** 1) Abrir /ayuda; 2) buscar carga de radiografías; 3) mostrar apartado de interpretación; 4) comparar manual y comportamiento; 5) señalar pendientes. **Mostrar código:** `frontend/src/pages/Ayuda.jsx; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:111–1133`. **Esperado:** Ayuda localizable y explicación fiel sin promesas infundadas. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

### 3.3.6 Funcionalidades faltantes o deficientes

- **CI-01, Cumple parcialmente:** Paleta, tipografía y tarjetas consistentes en código. No se renderizó la aplicación para juzgar estética o cortes.

- **CI-02, No verificable:** Flujo guiado existente, sin estudio de satisfacción. La demora artificial y validación defectuosa pueden causar fricción.

- **CI-03, Cumple parcialmente:** Rutas por entidades clínicas y pasos visibles orientan, pero claridad para usuario nuevo no observada.

- **CI-04, Cumple parcialmente:** Hay aria-label/aria-invalid/alert. ModalConfirmacion no tiene role=dialog, aria-modal ni manejo explícito de foco/Escape. Pan/cajas requieren evaluación por teclado.

- **CI-05, No verificable:** Confirmación y animaciones existen. No acreditan motivación y el avance decorativo puede inducir interpretación errónea.

- **CI-06, Cumple parcialmente:** Cinco pasos, reanudación y resultado están implementados. Componente clínico de más de 2700 líneas mezcla red/estados/vista; facilidad no observada.

- **CI-07, Cumple parcialmente:** FAQ/manual/soporte existen, sin prueba de comprensión autónoma; documentación histórica promete más seguridad de la implementada.

- **CI-08, Cumple parcialmente:** DNI/fechas/teléfonos/apoderado se validan en ambos lados; validateImage permite HTTP fallido o desconexión y el backend guarda bytes sin validación equivalente.

- **CI-09, Cumple parcialmente:** Hay carga, error PDF y comprobación de estados anidados. Avance temporizado no representa inferencia y un fallo del modelo puede ocultarse antes de UI.

- **CI-10, Cumple parcialmente:** Manual cubre cuenta/pacientes/visor/reportes/soporte; explicacion_sistema usa otra rúbrica y afirma autorización universal no respaldada.

### 3.3.7 Mejoras recomendadas

| ID | Archivos/módulos | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| CI-01 | `frontend/tailwind.config.js:8; frontend/src/index.css:5; frontend/src/components/Layout.jsx:211` | Revisión visual representativa y contraste. | Baja | Pantallas legibles, coherentes y sin superposición. |
| CI-02 | `frontend/src/pages/EvaluacionClinica.jsx:636–641; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408` | Evaluar con usuarios tras resolver brechas. | Media | Opinión y resultados de tarea de usuarios reales con datos ficticios. |
| CI-03 | `frontend/src/App.jsx:27–42; frontend/src/pages/EvaluacionClinica.jsx:1596–1615` | Validar etiquetas/navegación con usuarios nuevos. | Media | Usuario identifica tarea y siguiente acción sin guía constante. |
| CI-04 | `frontend/src/components/Layout.jsx:409–411; frontend/src/pages/Perfil.jsx:344–370; frontend/src/components/ModalConfirmacion.jsx:45` | Semántica y gestión de foco, controles alternativos y verificación lector/contraste. | Alta | Foco visible y contenido, semántica correcta y tarea sin ratón. |
| CI-05 | `frontend/src/components/ModalFinalizacion.jsx:6; frontend/src/pages/EvaluacionClinica.jsx:1472` | Evaluar utilidad percibida y eliminar esperas/progreso artificiales. | Baja | Usuario comprende avance real y considera útil continuar. |
| CI-06 | `frontend/src/pages/EvaluacionClinica.jsx:335,1094–1262; frontend/src/pages/Pendientes.jsx:41` | Validar tarea y separar hooks/servicios/vistas posteriormente. | Media | Tarea completada sin bloqueos ni duplicación innecesaria. |
| CI-07 | `frontend/src/pages/Ayuda.jsx:223–305; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408,587,632` | Alinear ayuda con límites reales y evaluar autonomía. | Media | Usuario completa tarea y resuelve dudas con ayuda del sistema. |
| CI-08 | `backend/app/utils/validation.py:29–60; frontend/src/pages/EvaluacionClinica.jsx:877–901` | Rechazar error HTTP/red y validar cargas en servidor. | Alta | Datos o archivos inválidos no permiten continuar, con explicación clara. |
| CI-09 | `frontend/src/pages/EvaluacionClinica.jsx:700–783; frontend/src/pages/EvaluacionDetalle.jsx:449–463` | Estados reales, mensaje específico y eliminación de progreso ficticio. | Alta | Mensajes y progreso corresponden al estado real y permiten reintento seguro. |
| CI-10 | `frontend/src/pages/Ayuda.jsx; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:111–1133` | Actualizar manual/guion y validar comprensión. | Media | Ayuda localizable y explicación fiel sin promesas infundadas. |

### 3.3.8 Puntaje estimado y justificación

**1.50/2.50 — DEBE MEJORAR, provisional.** Pertenece a (0.8,1.5]. Formularios/visor/ayuda sustentan una interfaz cuidada, pero satisfacción, autonomía y accesibilidad integral no están probadas; validación/progreso tienen defectos.


## 3.4 FIABILIDAD

### 3.4.1 Requisitos de la rúbrica

BUENO: Operación muy estable sin fallos; tolerancia y gestión adecuada sin impacto visible; recuperación rápida sin pérdida de datos ni interrupciones.

### 3.4.2 Estado de cumplimiento

#### FI-01: Operación muy estable sin fallos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Tests históricos no equivalen a funcionamiento actual. CN-04/CB-04 fallidos y defectos estáticos impiden afirmar ausencia de fallos. |
| C. Ubicación | `backend/tests/test_pdf_endpoint.py; Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar repetición de flujos sin errores con evidencia actual y límites. |
| F. Video | V09: 1) Abrir balance histórico; 2) mostrar fallos; 3) repetir después flujos con fixtures; 4) registrar incidencias, sin ocultar resultados negativos. |
| G. Resultado esperado | Repetición de flujos sin errores con evidencia actual y límites. |
| H. Mejora pendiente | Corregir defectos y ejecutar regresión de integración en copia. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Operación muy estable sin fallos». |

#### FI-02: Tolerancia y gestión adecuada de fallos

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Rollback, estado error y revisión anidada existen; fallo de inferencia puede disfrazarse de éxito. Manejo de error también hace commit y escribe log, operaciones que pueden fallar. |
| C. Ubicación | `backend/app/services/ia_service.py:268–295; backend/app/routes/evaluaciones.py:428–460; frontend/src/pages/EvaluacionClinica.jsx:747–759` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar error explícito y ui disponible para reintentar sin conclusión falsa. |
| F. Video | V09: 1) Seleccionar corrupto pequeño; 2) mostrar rechazo; 3) bloquear validate solo en pestaña; 4) registrar aceptación indebida; 5) enseñar catch de IA y ruta de error. |
| G. Resultado esperado | Error explícito y UI disponible para reintentar sin conclusión falsa. |
| H. Mejora pendiente | Contrato de error uniforme y ruta de fallo independiente de DB/log disponible. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Tolerancia y gestión adecuada de fallos». |

#### FI-03: Gestión sin impacto visible para el usuario

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Timeouts y mensajes implican impacto visible; no hay redundancia/failover acreditados. Ocultar fallo como valid=True no satisface el requisito. |
| C. Ubicación | `frontend/src/pages/EvaluacionClinica.jsx:707–723,778–785; backend/app/services/ia_service.py:138` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar fallo no destruye contexto ni paraliza aplicación; sin prometer invisibilidad no probada. |
| F. Video | V09: 1) Mostrar contexto antes del fallo de red local; 2) observar si permanece; 3) desbloquear; 4) reintentar solo sobre fixture; 5) explicar límites de continuidad. |
| G. Resultado esperado | Fallo no destruye contexto ni paraliza aplicación; sin prometer invisibilidad no probada. |
| H. Mejora pendiente | Degradación segura y recuperación de tarea; evaluar continuidad. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Gestión sin impacto visible para el usuario». |

#### FI-04: Recuperación rápida sin pérdida de datos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Se borran archivos antes de commit; rollback SQL no los restaura. Reproceso elimina resultados y puede hacer commit tras valid=False. Log tras commit puede causar ruta de error con datos ya guardados. |
| C. Ubicación | `backend/app/routes/evaluaciones.py:347–408,421–430; backend/app/services/ia_service.py:130–154,251–263` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar original/resultados previos conservados ante fallo y reintento consistente. |
| F. Video | V12: 1) Mostrar orden save/remove/commit; 2) contrastar rollback; 3) explicar archivo no recuperable por SQL; 4) reservar fallo simulado con hashes ficticios para PM-15. |
| G. Resultado esperado | Original/resultados previos conservados ante fallo y reintento consistente. |
| H. Mejora pendiente | Staging, conservación previa, compensación y log desacoplado. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Recuperación rápida sin pérdida de datos». |

#### FI-05: Recuperación sin interrupciones

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Health dice ok sin verificar modelos o validadores. No hay restauración, redundancia ni tiempos de recuperación probados. |
| C. Ubicación | `backend/run.py:7–11; api_ia_sonrie/app/routes/health.py:5–10; README.md sección 9` |
| D. Evidencia técnica | Condiciones y recorrido citados, verificados por lectura, no por ejecución. |
| E. Evidencia funcional | Mostrar recuperación observada con datos íntegros y tiempos medidos. |
| F. Video | V11: 1) Abrir health_check; 2) mostrar que no consulta modelo; 3) revisar recomendaciones de backup; 4) declarar restauración/RTO/RPO pendientes sin detener servicios. |
| G. Resultado esperado | Recuperación observada con datos íntegros y tiempos medidos. |
| H. Mejora pendiente | Readiness, copias/restauración ensayada y objetivos de recuperación. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Recuperación sin interrupciones». |

### 3.4.3 Análisis del código

**FI-01** — `backend/tests/test_pdf_endpoint.py; Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json`: Tests históricos no equivalen a funcionamiento actual. CN-04/CB-04 fallidos y defectos estáticos impiden afirmar ausencia de fallos.

**FI-02** — `backend/app/services/ia_service.py:268–295; backend/app/routes/evaluaciones.py:428–460; frontend/src/pages/EvaluacionClinica.jsx:747–759`: Rollback, estado error y revisión anidada existen; fallo de inferencia puede disfrazarse de éxito. Manejo de error también hace commit y escribe log, operaciones que pueden fallar.

**FI-03** — `frontend/src/pages/EvaluacionClinica.jsx:707–723,778–785; backend/app/services/ia_service.py:138`: Timeouts y mensajes implican impacto visible; no hay redundancia/failover acreditados. Ocultar fallo como valid=True no satisface el requisito.

**FI-04** — `backend/app/routes/evaluaciones.py:347–408,421–430; backend/app/services/ia_service.py:130–154,251–263`: Se borran archivos antes de commit; rollback SQL no los restaura. Reproceso elimina resultados y puede hacer commit tras valid=False. Log tras commit puede causar ruta de error con datos ya guardados.

**FI-05** — `backend/run.py:7–11; api_ia_sonrie/app/routes/health.py:5–10; README.md sección 9`: Health dice ok sin verificar modelos o validadores. No hay restauración, redundancia ni tiempos de recuperación probados.

### 3.4.4 Evidencias existentes

Código citado y documentación/pruebas históricas de sección 1. No hay ejecución nueva. La implementación parcial no certifica propiedades de experiencia ni disponibilidad.

### 3.4.5 Guía para grabar el video

Usar datos, pantallas y precondiciones de las escenas en sección 5. Las acciones por ficha son secuenciales. Narrar el resultado observado, no un éxito anticipado.

**FI-01, escena V09. Objetivo:** Operación muy estable sin fallos. **Acciones:** 1) Abrir balance histórico; 2) mostrar fallos; 3) repetir después flujos con fixtures; 4) registrar incidencias, sin ocultar resultados negativos. **Mostrar código:** `backend/tests/test_pdf_endpoint.py; Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json`. **Esperado:** Repetición de flujos sin errores con evidencia actual y límites. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**FI-02, escena V09. Objetivo:** Tolerancia y gestión adecuada de fallos. **Acciones:** 1) Seleccionar corrupto pequeño; 2) mostrar rechazo; 3) bloquear validate solo en pestaña; 4) registrar aceptación indebida; 5) enseñar catch de IA y ruta de error. **Mostrar código:** `backend/app/services/ia_service.py:268–295; backend/app/routes/evaluaciones.py:428–460; frontend/src/pages/EvaluacionClinica.jsx:747–759`. **Esperado:** Error explícito y UI disponible para reintentar sin conclusión falsa. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**FI-03, escena V09. Objetivo:** Gestión sin impacto visible para el usuario. **Acciones:** 1) Mostrar contexto antes del fallo de red local; 2) observar si permanece; 3) desbloquear; 4) reintentar solo sobre fixture; 5) explicar límites de continuidad. **Mostrar código:** `frontend/src/pages/EvaluacionClinica.jsx:707–723,778–785; backend/app/services/ia_service.py:138`. **Esperado:** Fallo no destruye contexto ni paraliza aplicación; sin prometer invisibilidad no probada. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**FI-04, escena V12. Objetivo:** Recuperación rápida sin pérdida de datos. **Acciones:** 1) Mostrar orden save/remove/commit; 2) contrastar rollback; 3) explicar archivo no recuperable por SQL; 4) reservar fallo simulado con hashes ficticios para PM-15. **Mostrar código:** `backend/app/routes/evaluaciones.py:347–408,421–430; backend/app/services/ia_service.py:130–154,251–263`. **Esperado:** Original/resultados previos conservados ante fallo y reintento consistente. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

**FI-05, escena V11. Objetivo:** Recuperación sin interrupciones. **Acciones:** 1) Abrir health_check; 2) mostrar que no consulta modelo; 3) revisar recomendaciones de backup; 4) declarar restauración/RTO/RPO pendientes sin detener servicios. **Mostrar código:** `backend/run.py:7–11; api_ia_sonrie/app/routes/health.py:5–10; README.md sección 9`. **Esperado:** Recuperación observada con datos íntegros y tiempos medidos. **Antes de grabar:** copia ficticia, condiciones de escena y ninguna credencial visible. **Estado:** funcional pendiente; las brechas requieren mejora antes de demostrar cumplimiento.

### 3.4.6 Funcionalidades faltantes o deficientes

- **FI-01, No verificable:** Tests históricos no equivalen a funcionamiento actual. CN-04/CB-04 fallidos y defectos estáticos impiden afirmar ausencia de fallos.

- **FI-02, Cumple parcialmente:** Rollback, estado error y revisión anidada existen; fallo de inferencia puede disfrazarse de éxito. Manejo de error también hace commit y escribe log, operaciones que pueden fallar.

- **FI-03, No cumple:** Timeouts y mensajes implican impacto visible; no hay redundancia/failover acreditados. Ocultar fallo como valid=True no satisface el requisito.

- **FI-04, No cumple:** Se borran archivos antes de commit; rollback SQL no los restaura. Reproceso elimina resultados y puede hacer commit tras valid=False. Log tras commit puede causar ruta de error con datos ya guardados.

- **FI-05, No verificable:** Health dice ok sin verificar modelos o validadores. No hay restauración, redundancia ni tiempos de recuperación probados.

### 3.4.7 Mejoras recomendadas

| ID | Archivos/módulos | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| FI-01 | `backend/tests/test_pdf_endpoint.py; Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json` | Corregir defectos y ejecutar regresión de integración en copia. | Alta | Repetición de flujos sin errores con evidencia actual y límites. |
| FI-02 | `backend/app/services/ia_service.py:268–295; backend/app/routes/evaluaciones.py:428–460; frontend/src/pages/EvaluacionClinica.jsx:747–759` | Contrato de error uniforme y ruta de fallo independiente de DB/log disponible. | Crítica | Error explícito y UI disponible para reintentar sin conclusión falsa. |
| FI-03 | `frontend/src/pages/EvaluacionClinica.jsx:707–723,778–785; backend/app/services/ia_service.py:138` | Degradación segura y recuperación de tarea; evaluar continuidad. | Alta | Fallo no destruye contexto ni paraliza aplicación; sin prometer invisibilidad no probada. |
| FI-04 | `backend/app/routes/evaluaciones.py:347–408,421–430; backend/app/services/ia_service.py:130–154,251–263` | Staging, conservación previa, compensación y log desacoplado. | Alta | Original/resultados previos conservados ante fallo y reintento consistente. |
| FI-05 | `backend/run.py:7–11; api_ia_sonrie/app/routes/health.py:5–10; README.md sección 9` | Readiness, copias/restauración ensayada y objetivos de recuperación. | Alta | Recuperación observada con datos íntegros y tiempos medidos. |

### 3.4.8 Puntaje estimado y justificación

**0.45/1.50 — MALO, provisional.** Pertenece a (0.2,0.5]. Rollback y mensajes son controles parciales; falso éxito, operaciones de disco no transaccionales y recuperación sin probar impiden alta estabilidad.


## 3.5 SEGURIDAD

### 3.5.1 Requisitos de la rúbrica

BUENO: Legitimidad de accesos, protección de datos, autenticación segura, alta resistencia a amenazas avanzadas; roles y responsabilidades; registro de acciones y responsables identificables.

### 3.5.2 Estado de cumplimiento

#### SE-01: Legitimidad de accesos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Sesion Bearer se verifica en soporte/solicitudes, no en APIs clínicas ni uploads. No hay middleware global. Redirección frontend no impide API directa. |
| C. Ubicación | `backend/app/utils/auth.py:8–29; backend/app/routes/pacientes.py:9–140; backend/app/__init__.py:42–44` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar 401 sin sesión y 403/404 cuando falta autorización por objeto. |
| F. Video | V06: 1) Cliente sin token; 2) GET /api/pacientes; 3) GET detalle/PDF ficticio; 4) GET upload ficticio; 5) comparar contra soporte protegido. |
| G. Resultado esperado | 401 sin sesión y 403/404 cuando falta autorización por objeto. |
| H. Mejora pendiente | Autenticación obligatoria y política por acción/objeto, incluidas descargas. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Legitimidad de accesos». |

#### SE-02: Protección de datos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Contraseña recordada y borradores clínicos persisten en navegador. Uploads es público. HTTPS, protección de disco/backup y retención real no verificadas. |
| C. Ubicación | `frontend/src/pages/Login.jsx:81; frontend/src/pages/EvaluacionClinica.jsx:199–208; backend/app/__init__.py:42` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar sin contraseña legible persistida y datos solo accesibles con permiso. |
| F. Video | V01: 1) Mostrar savedLogin en código; 2) enseñar nombres de claves sin valores; 3) consultar imagen ficticia sin sesión; 4) declarar límites de transporte/retención. |
| G. Resultado esperado | Sin contraseña legible persistida y datos solo accesibles con permiso. |
| H. Mejora pendiente | Minimizar almacenamiento, eliminar contraseña recordada y proteger archivos/transporte. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Protección de datos». |

#### SE-03: Autenticación segura

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | bcrypt con gensalt y token_urlsafe(48) son controles reales. Hay comparación plana legada y truncado a 72 bytes. Login devuelve 200 aun tras rollback de sesión. Reset carece de prueba de posesión. |
| C. Ubicación | `backend/app/utils/security.py:4–30; backend/app/routes/auth.py:84–118,186–212` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar hash auténtico, sesión persistida y recuperación ligada al titular. |
| F. Video | V01: 1) Mostrar hash/verify; 2) explicar hashing no reversible; 3) enseñar clasificación anonimizada bcrypt sin hash completo; 4) seguir fallo de commit y reset; 5) no cambiar contraseñas reales. |
| G. Resultado esperado | Hash auténtico, sesión persistida y recuperación ligada al titular. |
| H. Mejora pendiente | Retirar compatibilidad plana tras plan posterior; política por bytes; fallar si sesión no persiste; token de recuperación y revocación. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Autenticación segura». |

#### SE-04: Alta resistencia a amenazas avanzadas

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Cinco intentos por IP en diccionario local limita fuerza bruta parcialmente, pero reinicio/réplicas pierden estado. CORS amplio, debug/reload y IA sin autenticación; no auditoría dinámica avanzada. |
| C. Ubicación | `backend/app/routes/auth.py:12–15,49–59; backend/app/__init__.py:15; api_ia_sonrie/app/main.py:8–15` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar controles evaluados con pruebas autorizadas; no confundir bloqueo básico con resistencia avanzada. |
| F. Video | V12: 1) Mostrar MAX_INTENTOS/TIEMPO_BLOQUEO; 2) explicar memoria por proceso; 3) revisar CORS y arranque; 4) ligar amenazas a matriz; 5) no realizar ataques. |
| G. Resultado esperado | Controles evaluados con pruebas autorizadas; no confundir bloqueo básico con resistencia avanzada. |
| H. Mejora pendiente | Cerrar brechas básicas, límites compartidos/por cuenta y despliegue endurecido; evaluar después. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Alta resistencia a amenazas avanzadas». |

#### SE-05: Roles definidos

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Existen odontologo/admin/superadmin. Soporte verifica rol; usuario 1 tiene privilegio especial. Cambio de rol puede confiar en actor del cliente. |
| C. Ubicación | `backend/app/models.py:16–17; backend/app/routes/odontologos.py:155–196; backend/app/routes/soporte.py:21–26` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar matriz de rol/acción aplicada realmente por servidor. |
| F. Video | V07: 1) GET soporte como odontólogo; 2) esperar 403; 3) GET como superadmin; 4) esperar 200; 5) mostrar comprobación servidor y excepción id=1. |
| G. Resultado esperado | Matriz de rol/acción aplicada realmente por servidor. |
| H. Mejora pendiente | Actor de sesión y política central de rol, sin privilegio implícito por ID. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Roles definidos». |

#### SE-06: Responsabilidades definidas

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | permisos controla módulos visibles; no todas las acciones servidor. No matriz completa lectura/edición/finalizar/administrar por objeto. |
| C. Ubicación | `frontend/src/components/Layout.jsx:131–196; backend/app/routes/odontologos.py:198–202; manual_usuario_sistema_sonrie.md:52` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar acciones y alcance autorizados independientemente del menú. |
| F. Video | V07: 1) Mostrar módulos de cuenta de ensayo; 2) consultar API restringida con esa cuenta; 3) comparar permiso visual y status; 4) mostrar puntos sin validación. |
| G. Resultado esperado | Acciones y alcance autorizados independientemente del menú. |
| H. Mejora pendiente | Política rol/acción/objeto y pruebas negativas por endpoint. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Responsabilidades definidas». |

#### SE-07: Registro de acciones de usuarios

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Auditoría de login/logout/fallo/recuperación existe, no de todas las acciones clínicas. Log Markdown no tiene actor completo. Logout acepta id del cuerpo si no resuelve token, por lo que puede registrar actor no probado. |
| C. Ubicación | `backend/app/routes/auth.py:26–42,98–107,129–146; backend/app/models.py clase HistorialAcceso` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar acciones relevantes correlacionadas a actor/objeto/fecha/resultado. |
| F. Video | V12: 1) Mostrar esquema de eventos; 2) seguir login y registro; 3) contrastar alta/finalización clínica; 4) mostrar log sin datos; 5) listar eventos faltantes. |
| G. Resultado esperado | Acciones relevantes correlacionadas a actor/objeto/fecha/resultado. |
| H. Mejora pendiente | Auditoría estructurada y protegida con retención, sin datos excesivos. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Registro de acciones de usuarios». |

#### SE-08: Identificación fiable de responsables

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | Actor fijo 1 y solicitante recibido del cuerpo impiden atribución fiable. MensajeSoporte guarda respuesta/fecha, pero no identificador específico del respondedor. |
| C. Ubicación | `backend/app/routes/pacientes.py:70–74; backend/app/routes/evaluaciones.py:197–203; backend/app/routes/odontologos.py:160–165` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar autor real coincide con sesión y queda conservado en historial. |
| F. Video | V12: 1) Mostrar sesión ficticia sin token; 2) seguir id guardado en creación/finalización; 3) contrastar usuario real; 4) no crear acciones para explotar defecto. |
| G. Resultado esperado | Autor real coincide con sesión y queda conservado en historial. |
| H. Mejora pendiente | Actor de sesión para todas las escrituras; conservar autor de respuestas/cambios. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Identificación fiable de responsables». |

### 3.5.3 Análisis del código

**SE-01** — `backend/app/utils/auth.py:8–29; backend/app/routes/pacientes.py:9–140; backend/app/__init__.py:42–44`: Sesion Bearer se verifica en soporte/solicitudes, no en APIs clínicas ni uploads. No hay middleware global. Redirección frontend no impide API directa.

**SE-02** — `frontend/src/pages/Login.jsx:81; frontend/src/pages/EvaluacionClinica.jsx:199–208; backend/app/__init__.py:42`: Contraseña recordada y borradores clínicos persisten en navegador. Uploads es público. HTTPS, protección de disco/backup y retención real no verificadas.

**SE-03** — `backend/app/utils/security.py:4–30; backend/app/routes/auth.py:84–118,186–212`: bcrypt con gensalt y token_urlsafe(48) son controles reales. Hay comparación plana legada y truncado a 72 bytes. Login devuelve 200 aun tras rollback de sesión. Reset carece de prueba de posesión.

**SE-04** — `backend/app/routes/auth.py:12–15,49–59; backend/app/__init__.py:15; api_ia_sonrie/app/main.py:8–15`: Cinco intentos por IP en diccionario local limita fuerza bruta parcialmente, pero reinicio/réplicas pierden estado. CORS amplio, debug/reload y IA sin autenticación; no auditoría dinámica avanzada.

**SE-05** — `backend/app/models.py:16–17; backend/app/routes/odontologos.py:155–196; backend/app/routes/soporte.py:21–26`: Existen odontologo/admin/superadmin. Soporte verifica rol; usuario 1 tiene privilegio especial. Cambio de rol puede confiar en actor del cliente.

**SE-06** — `frontend/src/components/Layout.jsx:131–196; backend/app/routes/odontologos.py:198–202; manual_usuario_sistema_sonrie.md:52`: permisos controla módulos visibles; no todas las acciones servidor. No matriz completa lectura/edición/finalizar/administrar por objeto.

**SE-07** — `backend/app/routes/auth.py:26–42,98–107,129–146; backend/app/models.py clase HistorialAcceso`: Auditoría de login/logout/fallo/recuperación existe, no de todas las acciones clínicas. Log Markdown no tiene actor completo. Logout acepta id del cuerpo si no resuelve token, por lo que puede registrar actor no probado.

**SE-08** — `backend/app/routes/pacientes.py:70–74; backend/app/routes/evaluaciones.py:197–203; backend/app/routes/odontologos.py:160–165`: Actor fijo 1 y solicitante recibido del cuerpo impiden atribución fiable. MensajeSoporte guarda respuesta/fecha, pero no identificador específico del respondedor.

### 3.5.4 Evidencias existentes

Código citado y evidencia documental de sección 1. No hay ejecución nueva, prueba avanzada ni carga medida. Las garantías se evalúan endpoint por endpoint, sin extrapolar los controles de soporte a otras rutas.

### 3.5.5 Guía para grabar el video

Usar pantallas/datos/precondiciones de sección 5. Narrar el estado real de cada ficha. No ejecutar escrituras para demostrar vulnerabilidades; usar código y GET a fixtures conocidos.

**SE-01, V06. Objetivo:** Legitimidad de accesos. **Acciones:** 1) Cliente sin token; 2) GET /api/pacientes; 3) GET detalle/PDF ficticio; 4) GET upload ficticio; 5) comparar contra soporte protegido. **Código:** `backend/app/utils/auth.py:8–29; backend/app/routes/pacientes.py:9–140; backend/app/__init__.py:42–44`. **Esperado:** 401 sin sesión y 403/404 cuando falta autorización por objeto. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-02, V01. Objetivo:** Protección de datos. **Acciones:** 1) Mostrar savedLogin en código; 2) enseñar nombres de claves sin valores; 3) consultar imagen ficticia sin sesión; 4) declarar límites de transporte/retención. **Código:** `frontend/src/pages/Login.jsx:81; frontend/src/pages/EvaluacionClinica.jsx:199–208; backend/app/__init__.py:42`. **Esperado:** Sin contraseña legible persistida y datos solo accesibles con permiso. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-03, V01. Objetivo:** Autenticación segura. **Acciones:** 1) Mostrar hash/verify; 2) explicar hashing no reversible; 3) enseñar clasificación anonimizada bcrypt sin hash completo; 4) seguir fallo de commit y reset; 5) no cambiar contraseñas reales. **Código:** `backend/app/utils/security.py:4–30; backend/app/routes/auth.py:84–118,186–212`. **Esperado:** Hash auténtico, sesión persistida y recuperación ligada al titular. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-04, V12. Objetivo:** Alta resistencia a amenazas avanzadas. **Acciones:** 1) Mostrar MAX_INTENTOS/TIEMPO_BLOQUEO; 2) explicar memoria por proceso; 3) revisar CORS y arranque; 4) ligar amenazas a matriz; 5) no realizar ataques. **Código:** `backend/app/routes/auth.py:12–15,49–59; backend/app/__init__.py:15; api_ia_sonrie/app/main.py:8–15`. **Esperado:** Controles evaluados con pruebas autorizadas; no confundir bloqueo básico con resistencia avanzada. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-05, V07. Objetivo:** Roles definidos. **Acciones:** 1) GET soporte como odontólogo; 2) esperar 403; 3) GET como superadmin; 4) esperar 200; 5) mostrar comprobación servidor y excepción id=1. **Código:** `backend/app/models.py:16–17; backend/app/routes/odontologos.py:155–196; backend/app/routes/soporte.py:21–26`. **Esperado:** Matriz de rol/acción aplicada realmente por servidor. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-06, V07. Objetivo:** Responsabilidades definidas. **Acciones:** 1) Mostrar módulos de cuenta de ensayo; 2) consultar API restringida con esa cuenta; 3) comparar permiso visual y status; 4) mostrar puntos sin validación. **Código:** `frontend/src/components/Layout.jsx:131–196; backend/app/routes/odontologos.py:198–202; manual_usuario_sistema_sonrie.md:52`. **Esperado:** Acciones y alcance autorizados independientemente del menú. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-07, V12. Objetivo:** Registro de acciones de usuarios. **Acciones:** 1) Mostrar esquema de eventos; 2) seguir login y registro; 3) contrastar alta/finalización clínica; 4) mostrar log sin datos; 5) listar eventos faltantes. **Código:** `backend/app/routes/auth.py:26–42,98–107,129–146; backend/app/models.py clase HistorialAcceso`. **Esperado:** Acciones relevantes correlacionadas a actor/objeto/fecha/resultado. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**SE-08, V12. Objetivo:** Identificación fiable de responsables. **Acciones:** 1) Mostrar sesión ficticia sin token; 2) seguir id guardado en creación/finalización; 3) contrastar usuario real; 4) no crear acciones para explotar defecto. **Código:** `backend/app/routes/pacientes.py:70–74; backend/app/routes/evaluaciones.py:197–203; backend/app/routes/odontologos.py:160–165`. **Esperado:** Autor real coincide con sesión y queda conservado en historial. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

### 3.5.6 Funcionalidades faltantes o deficientes

- **SE-01, No cumple:** Sesion Bearer se verifica en soporte/solicitudes, no en APIs clínicas ni uploads. No hay middleware global. Redirección frontend no impide API directa.

- **SE-02, No cumple:** Contraseña recordada y borradores clínicos persisten en navegador. Uploads es público. HTTPS, protección de disco/backup y retención real no verificadas.

- **SE-03, Cumple parcialmente:** bcrypt con gensalt y token_urlsafe(48) son controles reales. Hay comparación plana legada y truncado a 72 bytes. Login devuelve 200 aun tras rollback de sesión. Reset carece de prueba de posesión.

- **SE-04, No verificable:** Cinco intentos por IP en diccionario local limita fuerza bruta parcialmente, pero reinicio/réplicas pierden estado. CORS amplio, debug/reload y IA sin autenticación; no auditoría dinámica avanzada.

- **SE-05, Cumple parcialmente:** Existen odontologo/admin/superadmin. Soporte verifica rol; usuario 1 tiene privilegio especial. Cambio de rol puede confiar en actor del cliente.

- **SE-06, Cumple parcialmente:** permisos controla módulos visibles; no todas las acciones servidor. No matriz completa lectura/edición/finalizar/administrar por objeto.

- **SE-07, Cumple parcialmente:** Auditoría de login/logout/fallo/recuperación existe, no de todas las acciones clínicas. Log Markdown no tiene actor completo. Logout acepta id del cuerpo si no resuelve token, por lo que puede registrar actor no probado.

- **SE-08, No cumple:** Actor fijo 1 y solicitante recibido del cuerpo impiden atribución fiable. MensajeSoporte guarda respuesta/fecha, pero no identificador específico del respondedor.

### 3.5.7 Mejoras recomendadas

| ID | Archivos/módulos | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| SE-01 | `backend/app/utils/auth.py:8–29; backend/app/routes/pacientes.py:9–140; backend/app/__init__.py:42–44` | Autenticación obligatoria y política por acción/objeto, incluidas descargas. | Crítica | 401 sin sesión y 403/404 cuando falta autorización por objeto. |
| SE-02 | `frontend/src/pages/Login.jsx:81; frontend/src/pages/EvaluacionClinica.jsx:199–208; backend/app/__init__.py:42` | Minimizar almacenamiento, eliminar contraseña recordada y proteger archivos/transporte. | Crítica | Sin contraseña legible persistida y datos solo accesibles con permiso. |
| SE-03 | `backend/app/utils/security.py:4–30; backend/app/routes/auth.py:84–118,186–212` | Retirar compatibilidad plana tras plan posterior; política por bytes; fallar si sesión no persiste; token de recuperación y revocación. | Crítica | Hash auténtico, sesión persistida y recuperación ligada al titular. |
| SE-04 | `backend/app/routes/auth.py:12–15,49–59; backend/app/__init__.py:15; api_ia_sonrie/app/main.py:8–15` | Cerrar brechas básicas, límites compartidos/por cuenta y despliegue endurecido; evaluar después. | Alta | Controles evaluados con pruebas autorizadas; no confundir bloqueo básico con resistencia avanzada. |
| SE-05 | `backend/app/models.py:16–17; backend/app/routes/odontologos.py:155–196; backend/app/routes/soporte.py:21–26` | Actor de sesión y política central de rol, sin privilegio implícito por ID. | Crítica | Matriz de rol/acción aplicada realmente por servidor. |
| SE-06 | `frontend/src/components/Layout.jsx:131–196; backend/app/routes/odontologos.py:198–202; manual_usuario_sistema_sonrie.md:52` | Política rol/acción/objeto y pruebas negativas por endpoint. | Alta | Acciones y alcance autorizados independientemente del menú. |
| SE-07 | `backend/app/routes/auth.py:26–42,98–107,129–146; backend/app/models.py clase HistorialAcceso` | Auditoría estructurada y protegida con retención, sin datos excesivos. | Alta | Acciones relevantes correlacionadas a actor/objeto/fecha/resultado. |
| SE-08 | `backend/app/routes/pacientes.py:70–74; backend/app/routes/evaluaciones.py:197–203; backend/app/routes/odontologos.py:160–165` | Actor de sesión para todas las escrituras; conservar autor de respuestas/cambios. | Alta | Autor real coincide con sesión y queda conservado en historial. |

### 3.5.8 Puntaje estimado y justificación

**0.40/2.50 — DEFICIENTE, provisional.** Pertenece a [0,0.4]. bcrypt/sesiones y controles de módulos concretos no compensan ausencia de autorización general y fallos de recuperación/datos.


## 3.6 FLEXIBILIDAD

### 3.6.1 Requisitos de la rúbrica

BUENO: Alta flexibilidad y escalabilidad; soporte de cambios y crecimiento sin degradación de calidad; introducción de herramientas y funcionalidades más accesibles, simples o eficientes.

### 3.6.2 Estado de cumplimiento

#### FL-01: Flexibilidad para soportar cambios

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Blueprints y IA separada; IA_API_URL/MODEL_PATH externos. URLs fijas en frontend, mapeos duplicados y componente clínico grande generan acoplamiento. |
| C. Ubicación | `backend/app/__init__.py:25–40; backend/app/services/ia_service.py:11; api_ia_sonrie/app/services/detector.py:12` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar cambios de componente/configuración sin editar múltiples pantallas. |
| F. Video | V11: 1) Mostrar árbol; 2) seguir React→Flask→IA; 3) mostrar configuración no secreta; 4) identificar cambios locales y acoplamientos. |
| G. Resultado esperado | Cambios de componente/configuración sin editar múltiples pantallas. |
| H. Mejora pendiente | Centralizar configuración/contrato/clases y extraer hooks/servicios. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Flexibilidad para soportar cambios». |

#### FL-02: Escalabilidad

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Inferencia síncrona en async, límites en memoria y disco local complican réplicas. Microservicio no prueba capacidad. |
| C. Ubicación | `api_ia_sonrie/app/routes/predict.py:30–34; backend/app/routes/evaluaciones.py:444–451; backend/app/routes/auth.py:13` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar mayor carga atendida sin pérdida de archivos/control ni degradación inaceptable. |
| F. Video | V08: 1) Declarar carga; 2) medir un usuario; 3) probar dos/tres acotados; 4) registrar latencia/error/recursos; 5) señalar estado compartido pendiente. |
| G. Resultado esperado | Mayor carga atendida sin pérdida de archivos/control ni degradación inaceptable. |
| H. Mejora pendiente | Medir demanda; coordinación de límites, almacenamiento privado común y trabajadores acotados. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Escalabilidad». |

#### FL-03: Crecimiento sin degradación de calidad

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | Evaluaciones pagina en servidor; pacientes/soporte cargan todos los registros. Paginación visual no evita transferencia completa. per_page sin tope explícito en ruta. |
| C. Ubicación | `backend/app/routes/pacientes.py:12–29; evaluaciones.py:24–25,103; soporte.py:104` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar transferencia/consultas acotadas y calidad mantenida con más datos. |
| F. Video | V08: 1) Mostrar Network al listar; 2) comparar registros descargados y visibles; 3) medir cardinalidades representativas en copia; 4) conservar resultados/error. |
| G. Resultado esperado | Transferencia/consultas acotadas y calidad mantenida con más datos. |
| H. Mejora pendiente | Paginación servidor, topes, consultas agregadas e índices según perfil. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Crecimiento sin degradación de calidad». |

#### FL-04: Herramientas y funciones más accesibles o simples

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Visor/PDF/ayuda separados son extensibles, pero no hay contrato versionado ni pruebas de compatibilidad para sustituciones. |
| C. Ubicación | `frontend/src/components/BoundingBoxViewer.jsx:45; backend/app/services/diagnostico_pdf.py:190; frontend/src/pages/Ayuda.jsx` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar extensión que reutiliza resultados y permisos sin duplicar semántica clínica. |
| F. Video | V11: 1) Mostrar visor y consumidor de resultados; 2) localizar servicio PDF; 3) explicar reutilización; 4) señalar pruebas/contratos pendientes. |
| G. Resultado esperado | Extensión que reutiliza resultados y permisos sin duplicar semántica clínica. |
| H. Mejora pendiente | Contrato estable y pruebas de compatibilidad; validar simplicidad con usuario. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Herramientas y funciones más accesibles o simples». |

#### FL-05: Introducción de herramientas más eficientes

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Cambiar ruta de pesos es posible; versión guardada fija y clases por índice hacen sustitución insegura. Dependencias IA incompletas y README muestra otro modelo. |
| C. Ubicación | `api_ia_sonrie/app/services/detector.py:12,242; backend/app/services/ia_service.py:175; api_ia_sonrie/requirements.txt` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar sustitución trazable que conserva semántica y acredita mejora medida. |
| F. Video | V11: 1) Mostrar MODEL_PATH; 2) comparar modelo_version persistido; 3) revisar dependencias; 4) explicar cómo evaluar compatibilidad antes de cambiar, sin reemplazar pesos. |
| G. Resultado esperado | Sustitución trazable que conserva semántica y acredita mejora medida. |
| H. Mejora pendiente | Manifiesto versión/hash/clases/preprocesamiento y dependencias reproducibles. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Introducción de herramientas más eficientes». |

### 3.6.3 Análisis del código

**FL-01** — `backend/app/__init__.py:25–40; backend/app/services/ia_service.py:11; api_ia_sonrie/app/services/detector.py:12`: Blueprints y IA separada; IA_API_URL/MODEL_PATH externos. URLs fijas en frontend, mapeos duplicados y componente clínico grande generan acoplamiento.

**FL-02** — `api_ia_sonrie/app/routes/predict.py:30–34; backend/app/routes/evaluaciones.py:444–451; backend/app/routes/auth.py:13`: Inferencia síncrona en async, límites en memoria y disco local complican réplicas. Microservicio no prueba capacidad.

**FL-03** — `backend/app/routes/pacientes.py:12–29; evaluaciones.py:24–25,103; soporte.py:104`: Evaluaciones pagina en servidor; pacientes/soporte cargan todos los registros. Paginación visual no evita transferencia completa. per_page sin tope explícito en ruta.

**FL-04** — `frontend/src/components/BoundingBoxViewer.jsx:45; backend/app/services/diagnostico_pdf.py:190; frontend/src/pages/Ayuda.jsx`: Visor/PDF/ayuda separados son extensibles, pero no hay contrato versionado ni pruebas de compatibilidad para sustituciones.

**FL-05** — `api_ia_sonrie/app/services/detector.py:12,242; backend/app/services/ia_service.py:175; api_ia_sonrie/requirements.txt`: Cambiar ruta de pesos es posible; versión guardada fija y clases por índice hacen sustitución insegura. Dependencias IA incompletas y README muestra otro modelo.

### 3.6.4 Evidencias existentes

Código citado y evidencia documental de sección 1. No hay ejecución nueva, prueba avanzada ni carga medida. Las garantías se evalúan endpoint por endpoint, sin extrapolar los controles de soporte a otras rutas.

### 3.6.5 Guía para grabar el video

Usar pantallas/datos/precondiciones de sección 5. Narrar el estado real de cada ficha. No ejecutar escrituras para demostrar vulnerabilidades; usar código y GET a fixtures conocidos.

**FL-01, V11. Objetivo:** Flexibilidad para soportar cambios. **Acciones:** 1) Mostrar árbol; 2) seguir React→Flask→IA; 3) mostrar configuración no secreta; 4) identificar cambios locales y acoplamientos. **Código:** `backend/app/__init__.py:25–40; backend/app/services/ia_service.py:11; api_ia_sonrie/app/services/detector.py:12`. **Esperado:** Cambios de componente/configuración sin editar múltiples pantallas. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**FL-02, V08. Objetivo:** Escalabilidad. **Acciones:** 1) Declarar carga; 2) medir un usuario; 3) probar dos/tres acotados; 4) registrar latencia/error/recursos; 5) señalar estado compartido pendiente. **Código:** `api_ia_sonrie/app/routes/predict.py:30–34; backend/app/routes/evaluaciones.py:444–451; backend/app/routes/auth.py:13`. **Esperado:** Mayor carga atendida sin pérdida de archivos/control ni degradación inaceptable. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**FL-03, V08. Objetivo:** Crecimiento sin degradación de calidad. **Acciones:** 1) Mostrar Network al listar; 2) comparar registros descargados y visibles; 3) medir cardinalidades representativas en copia; 4) conservar resultados/error. **Código:** `backend/app/routes/pacientes.py:12–29; evaluaciones.py:24–25,103; soporte.py:104`. **Esperado:** Transferencia/consultas acotadas y calidad mantenida con más datos. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**FL-04, V11. Objetivo:** Herramientas y funciones más accesibles o simples. **Acciones:** 1) Mostrar visor y consumidor de resultados; 2) localizar servicio PDF; 3) explicar reutilización; 4) señalar pruebas/contratos pendientes. **Código:** `frontend/src/components/BoundingBoxViewer.jsx:45; backend/app/services/diagnostico_pdf.py:190; frontend/src/pages/Ayuda.jsx`. **Esperado:** Extensión que reutiliza resultados y permisos sin duplicar semántica clínica. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**FL-05, V11. Objetivo:** Introducción de herramientas más eficientes. **Acciones:** 1) Mostrar MODEL_PATH; 2) comparar modelo_version persistido; 3) revisar dependencias; 4) explicar cómo evaluar compatibilidad antes de cambiar, sin reemplazar pesos. **Código:** `api_ia_sonrie/app/services/detector.py:12,242; backend/app/services/ia_service.py:175; api_ia_sonrie/requirements.txt`. **Esperado:** Sustitución trazable que conserva semántica y acredita mejora medida. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

### 3.6.6 Funcionalidades faltantes o deficientes

- **FL-01, Cumple parcialmente:** Blueprints y IA separada; IA_API_URL/MODEL_PATH externos. URLs fijas en frontend, mapeos duplicados y componente clínico grande generan acoplamiento.

- **FL-02, No verificable:** Inferencia síncrona en async, límites en memoria y disco local complican réplicas. Microservicio no prueba capacidad.

- **FL-03, No verificable:** Evaluaciones pagina en servidor; pacientes/soporte cargan todos los registros. Paginación visual no evita transferencia completa. per_page sin tope explícito en ruta.

- **FL-04, Cumple parcialmente:** Visor/PDF/ayuda separados son extensibles, pero no hay contrato versionado ni pruebas de compatibilidad para sustituciones.

- **FL-05, Cumple parcialmente:** Cambiar ruta de pesos es posible; versión guardada fija y clases por índice hacen sustitución insegura. Dependencias IA incompletas y README muestra otro modelo.

### 3.6.7 Mejoras recomendadas

| ID | Archivos/módulos | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| FL-01 | `backend/app/__init__.py:25–40; backend/app/services/ia_service.py:11; api_ia_sonrie/app/services/detector.py:12` | Centralizar configuración/contrato/clases y extraer hooks/servicios. | Media | Cambios de componente/configuración sin editar múltiples pantallas. |
| FL-02 | `api_ia_sonrie/app/routes/predict.py:30–34; backend/app/routes/evaluaciones.py:444–451; backend/app/routes/auth.py:13` | Medir demanda; coordinación de límites, almacenamiento privado común y trabajadores acotados. | Alta | Mayor carga atendida sin pérdida de archivos/control ni degradación inaceptable. |
| FL-03 | `backend/app/routes/pacientes.py:12–29; evaluaciones.py:24–25,103; soporte.py:104` | Paginación servidor, topes, consultas agregadas e índices según perfil. | Media | Transferencia/consultas acotadas y calidad mantenida con más datos. |
| FL-04 | `frontend/src/components/BoundingBoxViewer.jsx:45; backend/app/services/diagnostico_pdf.py:190; frontend/src/pages/Ayuda.jsx` | Contrato estable y pruebas de compatibilidad; validar simplicidad con usuario. | Media | Extensión que reutiliza resultados y permisos sin duplicar semántica clínica. |
| FL-05 | `api_ia_sonrie/app/services/detector.py:12,242; backend/app/services/ia_service.py:175; api_ia_sonrie/requirements.txt` | Manifiesto versión/hash/clases/preprocesamiento y dependencias reproducibles. | Alta | Sustitución trazable que conserva semántica y acredita mejora medida. |

### 3.6.8 Puntaje estimado y justificación

**0.80/1.50 — DEBE MEJORAR, provisional.** Pertenece a (0.5,0.9]. Reconoce modularidad y cambios localizados, no escalabilidad ni ausencia de degradación demostradas.


## 3.7 PROTECCIÓN

### 3.7.1 Requisitos de la rúbrica

BUENO: Limitar operaciones no autorizadas; controlar usos indebidos; aplicar restricciones adecuadas; documentar detalladamente riesgos de todos los escenarios adversos y evaluar amenazas potenciales.

### 3.7.2 Estado de cumplimiento

#### PR-01: Limitar operaciones no autorizadas

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Soporte/solicitudes tienen control servidor; administración/clínica/descargas carecen de cobertura equivalente. |
| C. Ubicación | `backend/app/routes/soporte.py:14–26,75–79; solicitudes.py:8–16; odontologos.py:115–208` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar rechazo backend para todas las operaciones sin permiso. |
| F. Video | V07: 1) GET soporte sin token; 2) esperar 401; 3) GET con odontólogo; 4) esperar 403; 5) superadmin 200; 6) comparar clínica sin token en copia. |
| G. Resultado esperado | Rechazo backend para todas las operaciones sin permiso. |
| H. Mejora pendiente | Autorización exhaustiva y pruebas negativas rol/acción/objeto. |
| I. Prioridad | Crítica |
| J. Impacto en BUENO | Afecta «Limitar operaciones no autorizadas». |

#### PR-02: Controlar usos indebidos

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | Límite de login local, pero inferencia/validación sin autenticación/cuotas observadas. Riesgo de consumo de CPU/GPU y almacenamiento. |
| C. Ubicación | `backend/app/routes/auth.py:12–15; api_ia_sonrie/app/routes/predict.py:30,53; backend/app/routes/evaluaciones.py:433` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar exceso controlado con rechazo claro sin degradar otros usuarios. |
| F. Video | V12: 1) Mostrar límite login; 2) revisar predict/validate sin dependencia auth; 3) explicar escenario de consumo; 4) reservar ensayo acotado futuro, sin carga abusiva. |
| G. Resultado esperado | Exceso controlado con rechazo claro sin degradar otros usuarios. |
| H. Mejora pendiente | Autenticación de servicio, cuotas y concurrencia acotada por identidad. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Controlar usos indebidos». |

#### PR-03: Restricciones adecuadas de archivos y acceso a datos

| Campo | Evaluación individual |
|---|---|
| A. Estado | No cumple |
| B. Explicación técnica | secure_filename normaliza nombre, no tamaño/contenido. IA lee todo y acepta MIME image; no límite backend de bytes/píxeles identificado. Objetos clínicos sin pertenencia. |
| C. Ubicación | `backend/app/routes/evaluaciones.py:342–350; api_ia_sonrie/app/utils/image_utils.py:3–14; EvaluacionClinica.jsx:877–901` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar inválidos rechazados en servidor y objetos accesibles solo por política. |
| F. Video | V09: 1) Mostrar TXT pequeño en copia; 2) observar HTTP/aceptación visual; 3) revisar save backend; 4) mostrar ausencia de límite; 5) comprobar GET de objeto ajeno ficticio. |
| G. Resultado esperado | Inválidos rechazados en servidor y objetos accesibles solo por política. |
| H. Mejora pendiente | Límites bytes/píxeles/lote, inspección por contenido, decodificación y acceso privado. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Restricciones adecuadas de archivos y acceso a datos». |

#### PR-04: Documentación detallada de riesgos adversos

| Campo | Evaluación individual |
|---|---|
| A. Estado | Cumple parcialmente |
| B. Explicación técnica | README contiene recomendaciones, no catálogo detallado con activos/actores/responsables/riesgo residual. Esta auditoría agrega matriz inicial; no convierte controles en implementados ni garantiza todos los escenarios. |
| C. Ubicación | `README.md sección 9; material_tesis/documentacion/explicacion_sistema.md; sección 4 de este informe` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar riesgos conocidos documentados, con dueño y seguimiento. |
| F. Video | V12: 1) Abrir recomendaciones README; 2) contrastar matriz de amenazas; 3) identificar propietario/mitigación pendientes; 4) explicar necesidad de mantenimiento. |
| G. Resultado esperado | Riesgos conocidos documentados, con dueño y seguimiento. |
| H. Mejora pendiente | Registro mantenido de riesgos con probabilidad/impacto/tratamiento y residual. |
| I. Prioridad | Media |
| J. Impacto en BUENO | Afecta «Documentación detallada de riesgos adversos». |

#### PR-05: Evaluación de amenazas potenciales

| Campo | Evaluación individual |
|---|---|
| A. Estado | No verificable |
| B. Explicación técnica | No se identificó análisis previo integral y validación del despliegue. Suplantación, exposición y abuso tienen causas visibles, no explotación ejecutada. |
| C. Ubicación | `backend/app/routes/odontologos.py:160–202; auth.py:186–212; backend/app/__init__.py:42–44` |
| D. Evidencia técnica | Condiciones/recorrido citados, lectura estática sin explotación. |
| E. Evidencia funcional | Mostrar amenazas ligadas a controles comprobados y riesgo residual decidido por responsable. |
| F. Video | V12: 1) Mostrar fronteras navegador/API/IA/DB; 2) ubicar amenazas H01–H14; 3) ligar cada mitigación a prueba segura; 4) declarar residual pendiente. |
| G. Resultado esperado | Amenazas ligadas a controles comprobados y riesgo residual decidido por responsable. |
| H. Mejora pendiente | Modelar actores/activos/fronteras y evaluar mitigaciones con fixtures. |
| I. Prioridad | Alta |
| J. Impacto en BUENO | Afecta «Evaluación de amenazas potenciales». |

### 3.7.3 Análisis del código

**PR-01** — `backend/app/routes/soporte.py:14–26,75–79; solicitudes.py:8–16; odontologos.py:115–208`: Soporte/solicitudes tienen control servidor; administración/clínica/descargas carecen de cobertura equivalente.

**PR-02** — `backend/app/routes/auth.py:12–15; api_ia_sonrie/app/routes/predict.py:30,53; backend/app/routes/evaluaciones.py:433`: Límite de login local, pero inferencia/validación sin autenticación/cuotas observadas. Riesgo de consumo de CPU/GPU y almacenamiento.

**PR-03** — `backend/app/routes/evaluaciones.py:342–350; api_ia_sonrie/app/utils/image_utils.py:3–14; EvaluacionClinica.jsx:877–901`: secure_filename normaliza nombre, no tamaño/contenido. IA lee todo y acepta MIME image; no límite backend de bytes/píxeles identificado. Objetos clínicos sin pertenencia.

**PR-04** — `README.md sección 9; material_tesis/documentacion/explicacion_sistema.md; sección 4 de este informe`: README contiene recomendaciones, no catálogo detallado con activos/actores/responsables/riesgo residual. Esta auditoría agrega matriz inicial; no convierte controles en implementados ni garantiza todos los escenarios.

**PR-05** — `backend/app/routes/odontologos.py:160–202; auth.py:186–212; backend/app/__init__.py:42–44`: No se identificó análisis previo integral y validación del despliegue. Suplantación, exposición y abuso tienen causas visibles, no explotación ejecutada.

### 3.7.4 Evidencias existentes

Código citado y evidencia documental de sección 1. No hay ejecución nueva, prueba avanzada ni carga medida. Las garantías se evalúan endpoint por endpoint, sin extrapolar los controles de soporte a otras rutas.

### 3.7.5 Guía para grabar el video

Usar pantallas/datos/precondiciones de sección 5. Narrar el estado real de cada ficha. No ejecutar escrituras para demostrar vulnerabilidades; usar código y GET a fixtures conocidos.

**PR-01, V07. Objetivo:** Limitar operaciones no autorizadas. **Acciones:** 1) GET soporte sin token; 2) esperar 401; 3) GET con odontólogo; 4) esperar 403; 5) superadmin 200; 6) comparar clínica sin token en copia. **Código:** `backend/app/routes/soporte.py:14–26,75–79; solicitudes.py:8–16; odontologos.py:115–208`. **Esperado:** Rechazo backend para todas las operaciones sin permiso. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**PR-02, V12. Objetivo:** Controlar usos indebidos. **Acciones:** 1) Mostrar límite login; 2) revisar predict/validate sin dependencia auth; 3) explicar escenario de consumo; 4) reservar ensayo acotado futuro, sin carga abusiva. **Código:** `backend/app/routes/auth.py:12–15; api_ia_sonrie/app/routes/predict.py:30,53; backend/app/routes/evaluaciones.py:433`. **Esperado:** Exceso controlado con rechazo claro sin degradar otros usuarios. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**PR-03, V09. Objetivo:** Restricciones adecuadas de archivos y acceso a datos. **Acciones:** 1) Mostrar TXT pequeño en copia; 2) observar HTTP/aceptación visual; 3) revisar save backend; 4) mostrar ausencia de límite; 5) comprobar GET de objeto ajeno ficticio. **Código:** `backend/app/routes/evaluaciones.py:342–350; api_ia_sonrie/app/utils/image_utils.py:3–14; EvaluacionClinica.jsx:877–901`. **Esperado:** Inválidos rechazados en servidor y objetos accesibles solo por política. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**PR-04, V12. Objetivo:** Documentación detallada de riesgos adversos. **Acciones:** 1) Abrir recomendaciones README; 2) contrastar matriz de amenazas; 3) identificar propietario/mitigación pendientes; 4) explicar necesidad de mantenimiento. **Código:** `README.md sección 9; material_tesis/documentacion/explicacion_sistema.md; sección 4 de este informe`. **Esperado:** Riesgos conocidos documentados, con dueño y seguimiento. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

**PR-05, V12. Objetivo:** Evaluación de amenazas potenciales. **Acciones:** 1) Mostrar fronteras navegador/API/IA/DB; 2) ubicar amenazas H01–H14; 3) ligar cada mitigación a prueba segura; 4) declarar residual pendiente. **Código:** `backend/app/routes/odontologos.py:160–202; auth.py:186–212; backend/app/__init__.py:42–44`. **Esperado:** Amenazas ligadas a controles comprobados y riesgo residual decidido por responsable. **Preparación:** copia ficticia y secretos fuera de captura. **Disponibilidad:** lectura lista; funcional pendiente y brechas por corregir.

### 3.7.6 Funcionalidades faltantes o deficientes

- **PR-01, Cumple parcialmente:** Soporte/solicitudes tienen control servidor; administración/clínica/descargas carecen de cobertura equivalente.

- **PR-02, Cumple parcialmente:** Límite de login local, pero inferencia/validación sin autenticación/cuotas observadas. Riesgo de consumo de CPU/GPU y almacenamiento.

- **PR-03, No cumple:** secure_filename normaliza nombre, no tamaño/contenido. IA lee todo y acepta MIME image; no límite backend de bytes/píxeles identificado. Objetos clínicos sin pertenencia.

- **PR-04, Cumple parcialmente:** README contiene recomendaciones, no catálogo detallado con activos/actores/responsables/riesgo residual. Esta auditoría agrega matriz inicial; no convierte controles en implementados ni garantiza todos los escenarios.

- **PR-05, No verificable:** No se identificó análisis previo integral y validación del despliegue. Suplantación, exposición y abuso tienen causas visibles, no explotación ejecutada.

### 3.7.7 Mejoras recomendadas

| ID | Archivos/módulos | Cambio posterior | Prioridad | Beneficio |
|---|---|---|---|---|
| PR-01 | `backend/app/routes/soporte.py:14–26,75–79; solicitudes.py:8–16; odontologos.py:115–208` | Autorización exhaustiva y pruebas negativas rol/acción/objeto. | Crítica | Rechazo backend para todas las operaciones sin permiso. |
| PR-02 | `backend/app/routes/auth.py:12–15; api_ia_sonrie/app/routes/predict.py:30,53; backend/app/routes/evaluaciones.py:433` | Autenticación de servicio, cuotas y concurrencia acotada por identidad. | Alta | Exceso controlado con rechazo claro sin degradar otros usuarios. |
| PR-03 | `backend/app/routes/evaluaciones.py:342–350; api_ia_sonrie/app/utils/image_utils.py:3–14; EvaluacionClinica.jsx:877–901` | Límites bytes/píxeles/lote, inspección por contenido, decodificación y acceso privado. | Alta | Inválidos rechazados en servidor y objetos accesibles solo por política. |
| PR-04 | `README.md sección 9; material_tesis/documentacion/explicacion_sistema.md; sección 4 de este informe` | Registro mantenido de riesgos con probabilidad/impacto/tratamiento y residual. | Media | Riesgos conocidos documentados, con dueño y seguimiento. |
| PR-05 | `backend/app/routes/odontologos.py:160–202; auth.py:186–212; backend/app/__init__.py:42–44` | Modelar actores/activos/fronteras y evaluar mitigaciones con fixtures. | Alta | Amenazas ligadas a controles comprobados y riesgo residual decidido por responsable. |

### 3.7.8 Puntaje estimado y justificación

**0.60/2.50 — MALO, provisional.** Pertenece a (0.4,0.8]. Controles parciales no resuelven acceso clínico y cargas/abuso. Descriptor repetido en MALO/DEBE MEJORAR no autoriza inventar diferencias; BUENO no acreditado.


## SECCIÓN 4: PLAN DE MEJORAS PARA CONSEGUIR LOS 14 PUNTOS

Primero contener riesgos críticos aunque impliquen esfuerzo; dentro de impacto comparable, priorizar soluciones más pequeñas. Esfuerzo relativo, sin presupuesto ni plazo inventado. Ninguna propuesta fue implementada.

| Prioridad | Criterio | Problema | Solución recomendada | Archivos involucrados | Impacto esperado |
|---|---|---|---|---|---|
| Crítica; medio | SE/PR/AF | H01/H02/H09: acceso y actor falsos | Sesión obligatoria; permiso por acción/objeto; actor de sesión; archivos privados; adaptar fetch | utils/auth.py; pacientes.py; evaluaciones.py; odontologos.py; reportes.py; dashboard.py; __init__.py; api.js y páginas | Protección real y responsabilidad |
| Crítica; bajo/medio | AF/FI | H04: error convertido en sano | Contrato explícito y no persistir éxito si error | detector.py; predict.py; ia_service.py; EvaluacionClinica.jsx | Evita falso resultado negativo técnico |
| Crítica; medio | SE/PR | H03: recuperación sin titular | Token de un uso, caducidad y canal verificado; revocar sesiones | auth.py; models.py; Login.jsx | Restablecimiento seguro |
| Alto impacto; bajo | SE | H06: contraseña guardada | Recordar solo identificador; tratamiento posterior de savedLogin previo | Login.jsx | Reduce exposición de credenciales |
| Alto impacto; bajo | AF/CI | H05: probabilidades artificiales | Mostrar score auténtico y procedencia; retirar remanentes sintéticos | detector.py; EvaluacionClinica.jsx; EvaluacionDetalle.jsx | Interpretación fiable |
| Alto impacto; bajo | ED/CI | H08: demora 4–6s | Quitar espera aleatoria/cola visual bloqueante; estados reales | EvaluacionClinica.jsx:636–776 | Reduce latencia; no garantiza por sí sola <5s |
| Alto impacto; bajo | AF/FL | H11: versión incorrecta | Manifiesto/version/hash/clases/configuración en respuesta y persistencia | detector.py; predict.py; ia_service.py; models.py | Trazabilidad de modelo y métricas |
| Alto impacto; bajo/medio | CI/PR/FI | H10: validación falla abierta | Tratar HTTP/red como no validado; readiness de CLIP/CLS y política segura explícita | EvaluacionClinica.jsx:877; clip_validator.py; cls_validator.py | No aceptar archivo silenciosamente |
| Alto impacto; medio | PR/ED/SE | H07: cargas ilimitadas | Límite bytes/píxeles/lote, firma/decodificación antes de guardar, nombres únicos | evaluaciones.py; odontologos.py; image_utils.py | Acota abuso y almacenamiento inseguro |
| Alto impacto; medio | FI | Disco/DB/log inconsistentes | Staging, publicar tras éxito y borrar previo después; conservar resultados; log desacoplado | evaluaciones.py:347–430; ia_service.py:130–295 | Reduce pérdida y falso estado |
| Alto impacto; medio | SE | Login/legados/sesiones | Fallar si commit falla; retirar comparación plana con plan posterior; política de longitud, expiración y revocación | security.py; auth.py; api.js | Autenticación consistente |
| Alto impacto; medio | SE/PR | Auditoría insuficiente | Actor/acción/objeto/fecha/resultado y correlación, retención y responsable de respuesta | models.py; rutas de escritura; soporte.py | Responsabilidad verificable |
| Alto impacto; variable | AF | Modelo activo sin validación | Evaluación independiente, split por paciente, revisión odontológica, taxonomía y alcance adolescente | modelos/metadatos; scripts/evaluar*; documentación | Evidencia de precisión requerida |
| Recomendable; bajo | AF | H12: reportes mezclan estados | Separar error/inválida/sin hallazgos/confirmada; aceptación humana real y denominador epidemiológico correcto | reportes.py; Reportes.jsx; ReporteIndividual.jsx | Indicadores coherentes |
| Recomendable; bajo/medio | AF/SE | H13: rol destino ausente | Guardar transición/actor y validar al aprobar | SolicitudRol; odontologos.py; solicitudes.py | Aplica decisión realmente solicitada |
| Recomendable; medio | FI/FL | H14: esquema divergente | Inventario ORM/DDL y migraciones posteriores revisadas; quitar create_all de arranque productivo | models.py; SQL; backend/run.py | Instalación reproducible |
| Recomendable; bajo/medio | CI | Accesibilidad parcial | Semántica dialog, foco, Escape y restauración; teclado y contraste | ModalConfirmacion.jsx; ModalFinalizacion.jsx; modales/visor | Accesibilidad y facilidad |
| Recomendable; medio | ED/FL | Listados completos/N+1 | Paginación servidor/topes, consultas agregadas/eager loading según medición | pacientes.py; soporte.py; evaluaciones.py; listas | Crecimiento acotado |
| Recomendable; medio | FI/ED/FL | Despliegue/recuperación NV | Producción sin debug/reload, proxy/HTTPS, readiness y métricas; backup/restauración ensayada | run.py de servicios; health.py; despliegue/manual | Estabilidad y recuperación acreditables |
| Recomendable; medio | PR | Amenazas sin seguimiento | Adoptar matriz con dueños reales y residual revisado | Documentación de arquitectura/seguridad | Exigencia documental de Protección |
| Opcional; condicionada a demanda | ED/FL | Inferencia secuencial | Cola/trabajadores acotados, almacenamiento común y límites compartidos si mediciones lo justifican | predict.py; ia_service.py; infraestructura | Escalado con coste justificado |
| Opcional | AF/CI | Extensiones de producto | Nuevas exportaciones solo tras priorización con odontólogo | reportes/visor | Valor adicional sin desplazar críticos |

### Matriz inicial de amenazas y escenarios adversos

Evaluación cualitativa por código: no probabilidad estadística ni explotación realizada. Asignar responsable nominal y aceptación de riesgo después. Este inventario no certifica todos los escenarios posibles o del despliegue desconocido.

| Escenario / activo | Actor o causa | Control/frontera actual | Plausibilidad / impacto | Mitigación y prueba segura futura | Responsable propuesto |
|---|---|---|---|---|---|
| Historia ajena | Visitante/usuario sin permiso | API clínica sin sesión/objeto | Alta / crítico | Política de objeto; GET de fixtures A/B | Backend/seguridad |
| Cambio de permisos/cuentas | Actor que aporta solicitante | Cuerpo cliente confiado | Alta / crítico | Actor de sesión; inspección sin cambiar roles | Backend/administración |
| Recuperar cuenta ajena | Conoce correo y aprovecha aprobación | Reset sin posesión | Alta / crítico | Token de un uso; cuenta desechable | Backend/administración |
| Robo local de credenciales | Acceso al perfil navegador/script del origen | savedLogin/user | Media / alto | No contraseña persistida y minimizar sesión | Frontend/seguridad |
| Revelar radiografía | URL conocida/compartida | uploads público | Alta / crítico | Descarga privada; GET ficticio sin sesión | Backend/infraestructura |
| Archivo grande/no imagen | Error o abuso | MIME/cliente, sin tope servidor | Alta / alto | Límites/lectura acotada; fixture pequeño del límite configurado | Backend/IA |
| Agotar CPU/GPU | Solicitudes concurrentes | IA pública/síncrona | Media / alto | Cuotas/concurrencia; dos/tres usuarios y umbral de parada | IA/infraestructura |
| Modelo ausente/error | Dependencia/recursos/entorno | valid=True tras excepción | Media / crítico | Estado error; simulación con dobles | IA/backend |
| Filtros no disponibles | Modelo/Transformers/descarga | CLIP/CLS dejan pasar | Media / alto | Readiness y estado degradado explícito | IA |
| Distribución/etiqueta engañosa | Transformación de salida | Remanentes/renombrado | Alta / alto | Scores reales y revisión clínica | IA/odontólogo |
| Pérdida al reemplazar | Commit SQL fallido | Borrado disco previo | Media / alto | Staging/compensación; fallo simulado | Backend |
| Log falla tras guardar | Disco/permisos/log | Log dentro de try tras commit | Media / alto | Logging desacoplado; doble de log | Backend |
| Doble finalizar/reprocesar | Concurrencia/reintento | Control secuencial, sin unicidad de diagnóstico demostrada | Media / alto | Idempotencia transaccional y concurrencia en fixtures | Backend |
| DB desconectada | Red/infraestructura | Catch genérico y commit en ruta de error | Media / alto | Respuesta consistente y restauración ensayada | Infraestructura/backend |
| Réplicas/reinicio | Crecimiento | Límite en memoria, disco local | Media / alto | Estado común y almacenamiento privado compartido | Infraestructura |
| Uso fuera de población | Imagen/caso no representativo | Evidencia adolescente insuficiente | Media / crítico | Alcance visible y validación independiente | Clínico/IA |
| Imagen sana contada rechazada | Fórmula | Confianza cero = rechazo | Alta / medio | Estados/denominadores correctos con fixture negativo conocido | Backend/clínico |
| Artefacto no reproducible | Instalación/sustitución | requirements incompleto y pesos ignorados | Media / alto | Manifiesto/integridad/procedencia sin cargar pesos no confiables | IA/infraestructura |

### Precisiones que deben resolverse antes de defender exactitud

- `reportes.py:185–196` ordena días ascendente y limita a 30, obteniendo primeros 30 días con actividad aunque el comentario anuncia últimos 30.
- `Paciente.edad` almacenada puede desactualizarse al cumplir años; PDF calcula edad a fecha de evaluación (`diagnostico_pdf.py:71`), epidemiología usa edad almacenada. Unificar referencia temporal.
- `ia_service.py:14–24,103–111` deriva localización de severidad/clase, no de detección anatómica independiente; `numero_diente=None`. No anunciar identificación automática de pieza.
- Detalle (`evaluaciones.py:477–479`) consulta resultado sin orden explícito; PDF toma último por ID. Reproceso suele borrar previos, pero concurrencia/datos heredados pueden producir divergencias.
- DDL contiene enums/columnas que difieren del ORM; dashboard usa creado_en/actualizado_en por SQL. create_all no reconcilia esquemas existentes ni sustituye migración.
- `eval_v2_0.json` declara históricamente precision=0.4984, recall=0.7303, mAP50=0.5005 y mAP50_95=0.3822 para v2.0. No son nuevas mediciones, ni precisión clínica, ni métricas del activo v2.3. Evaluadores revisados usan split=val; independencia por paciente/fugas no acreditadas.
- `clasificador_metadata.json` declara accuracy_top1=1.0 de panorámica/no panorámica. No es precisión de detección de caries ni garantiza rechazo universal. Comentarios de ~2ms/~100ms/~19ms o 100% no son resultados de esta auditoría.
- `Sesion.to_dict` incluye token_sesion, pero no se observó endpoint dedicado que lo publique: no se afirma esa exposición. Login sí devuelve token y lo guarda en user.
- Varias rutas y `/api/test` devuelven str(e), potencialmente revelador. No se forzaron errores. SECRET_KEY en README no convierte estas sesiones opacas de DB en JWT/cookies firmadas.
- CORS no es autenticación. Flask permite orígenes amplios y FastAPI declara wildcard con allow_credentials=True; revisar despliegue real sin asumir restricciones de origen.

## SECCIÓN 5: GUION COMPLETO PARA EL VIDEO

Secuencia propuesta: V01 → V02 → V03 → V04 → V05 → V10 → V06/V07 → V08/V09 → V11/V12. Preparar ventanas y código por bloques; cada ID de sección 3 tiene objetivo, pasos y resultado focal. Video de medición sin cortes ni aceleración. Funciones con defectos se muestran como brechas: no narrarlas como cumplimiento.

**Precondición común:** solo ejecutar posteriormente en copia aislada totalmente ficticia, cuentas/fixtures ya preparados y servicios disponibles. Preparar la copia no forma parte de esta auditoría. No mostrar credenciales, tokens, datos clínicos reales ni archivo .env completo. Login, altas, inferencia y finalización escriben datos/logs: no son pruebas de solo lectura, por eso aquí no se ejecutaron.

### V01 — Acceso, contraseñas y sesión (SE/CI/PR)

**Decir:** «Hay autenticación y bcrypt; la protección de API debe comprobarse aparte». **Pantalla:** /login, /dashboard y editor. **Datos:** cuenta ficticia ya habilitada.

1. Abrir ventana privada en `http://localhost:3000/dashboard`; registrar redirección a /login.
2. Iniciar sesión ficticia ocultando contraseña y respuesta sensible; confirmar dashboard.
3. En Network mostrar solo URL y status de `/api/auth/login`, sin cuerpo/cabeceras sensibles.
4. Abrir `security.py:4–30`: explicar salt/hash/checkpw y comparación legada. Hashing no es cifrado reversible.
5. Mostrar `Login.jsx:81`, sin valores de almacenamiento: recordar contraseña es debilidad.
6. Cerrar sesión y observar llamada logout; usar V07 para autorización real.

**Esperado:** flujo visual puede funcionar, pero no acredita todas las rutas. **Código:** auth.py:44–148, security.py, Login.jsx:63–83. **Demuestra:** SE-02/03 parcialmente y experiencia de acceso. **Estado:** ejecución pendiente; seguridad global requiere mejora.

### V02 — Pacientes y errores de datos (AF/CI)

**Decir:** «Se validan datos y apoderado para menores». **Pantalla:** /pacientes → Nuevo paciente. **Datos:** Paciente Demo, nacimiento 2011-01-15, Tutor Demo, DNI ficticio único de ocho dígitos, teléfono ficticio 900000001 y demo@example.invalid; no dirigir contactos reales.

1. Dejar DNI/teléfono incompleto y mostrar mensaje sin guardar.
2. Introducir fecha futura y comprobar rechazo.
3. Completar menor sin apoderado; mostrar requisito de nombre/teléfono del tutor.
4. Completar fixture válido y guardar una vez en copia aislada; anotar ID.
5. Buscar por DNI ficticio, abrir ficha, probar edición inválida y cancelarla.
6. Recargar y comparar datos/actor; señalar que actualmente guarda odontólogo 1.

**Esperado:** mensajes y persistencia; autoría es brecha. **Código:** validation.py:29–60, pacientes.py:56–93, ModalNuevoPaciente.jsx. **Demuestra:** AF-01/07 y CI-08; no aceptación clínica. **Estado:** pendiente; alta escribe datos.

### V03 — Flujo clínico y detecciones (AF/CI; medición ED)

**Decir:** «El modelo propone hallazgos para revisión humana; score no significa exactitud clínica». **Pantalla:** /nueva-evaluacion. **Datos:** paciente ficticio y panorámica autorizada desidentificada con referencia profesional.

1. Seleccionar paciente; completar Contexto Clínico con Primera vez y motivo ficticio.
2. Cargar panorámica; revisar `/api/validate`, valid y vista previa.
3. Continuar al resumen, analizar y registrar `/api/evaluaciones/<id>/procesar`.
4. Mantener cronómetro hasta resultado usable; no confundir animación con inferencia.
5. En Resultados alternar cajas/etiquetas, seleccionar hallazgo y usar zoom; contrastar referencia.
6. Comparar confidence con barras; enseñar `extraer_probabilidades` y reparto frontend.
7. Explicar cadena React→Flask→FastAPI y estados anidados; no llamar sana a inferencia fallida.

**Esperado:** hallazgos/cajas/scores auténticos o ausencia legítima de hallazgos, diferenciada de error. **Código:** detector.py:148–178,242–251; EvaluacionClinica.jsx:710–778,2553–2586. **Demuestra:** AF-01/05, CI-06/09; precisión global no se prueba con una imagen. **Estado:** pendiente; escribe DB/logs y requiere correcciones.

### V04 — Guardar, recargar y descargar (AF/FI)

**Decir:** «El expediente pertenece a esta evaluación y conserva revisión humana». **Pantalla:** Resultados → /historial → /evaluacion/<id>. **Datos:** evaluación ficticia procesada y texto diagnóstico/plan de ensayo; plantilla presente.

1. Redactar diagnóstico ficticio significativo y plan, revisar y finalizar una vez.
2. Esperar confirmación HTTP, anotar ID ficticio y abrir historial.
3. Confirmar completada, abrir detalle y recargar.
4. Comparar texto, hallazgos e imagen con lo visto antes de cerrar.
5. Descargar Expediente a destino fuera del proyecto, sin sobrescribir; abrir PDF.
6. Verificar evaluación/paciente ficticio/fecha/diagnóstico/imagen/cajas y continuidad si varias páginas.
7. Mostrar condición de completada y diagnóstico; explicar 409 para pendiente y control secuencial de reintentos.

**Esperado:** PDF y detalle fieles; no prueba backup/recuperación ni autoría fiable. **Código:** evaluaciones.py:173–278 y diagnostico_pdf.py:190. **Demuestra:** AF-06/07 y persistencia parcial FI. **Estado:** pendiente; pruebas históricas no sustituyen esta validación.

### V05 — Reportes con significado correcto (AF/CI)

**Decir:** «Son agregaciones de DB; aceptación calculada no es revisión clínica». **Pantalla:** /reportes. **Datos:** casos ficticios conocidos con/sin hallazgos/error cuando existan en copia.

1. Abrir pestaña IA; comparar total/confianza/rechazo con fixtures.
2. Mostrar fórmula aceptación=100−rechazo y clasificación de confianza cero.
3. Abrir epidemiología: explicar denominador con join a detecciones y edad almacenada.
4. Abrir productividad: revisar autor y fechas; contrastar primeros/últimos 30 días.
5. Abrir reporte individual, buscar fixture y mostrar línea temporal/comparativa.
6. Registrar diferencias; no presentar confianza media como precisión ni categorías sintéticas como evidencia clínica.

**Esperado:** valores coherentes con fixtures y límites explicados. **Código:** reportes.py:36–82,84–178,180–246,250; ReporteIndividual.jsx:296. **Demuestra:** capacidades adicionales AF-02, claridad; métricas requieren mejora. **Estado:** pendiente.

### V06 — API clínica y objetos sin sesión (SE/PR)

**Decir:** «Una redirección visual no protege la API; esta escena comprueba la brecha». **Pantalla:** cliente HTTP local y editor. **Datos:** copia sin pacientes reales, IDs/imagen ficticios conocidos.

1. Confirmar URL local y ausencia de Authorization/cookies.
2. Enviar GET `/api/pacientes`; registrar status y estructura anonimizada.
3. Enviar GET `/api/evaluaciones/<ID_FICTICIO>/detalle` y `/pdf` de un fixture completado.
4. Consultar únicamente URL de upload ficticio conocido, sin enumeración.
5. Contrastar con V07 y mostrar ausencia de validación en rutas clínicas/uploaded_file.
6. Registrar 200 como defecto; respuesta segura requerida 401 sin sesión y 403/404 sin permiso por objeto.

**Esperado por lectura:** rutas clínicas pueden responder sin sesión si DB/archivo están disponibles; no se ejecutó. **Código:** pacientes.py, evaluaciones.py, __init__.py:42–44. **Demuestra:** SE-01 y restricciones PR deficientes. **Estado:** solo fixtures; no prueba positiva hasta corregir.

### V07 — Autorización real de soporte/solicitudes (SE/PR)

**Decir:** «Estos módulos sí verifican sesión y rol en servidor». **Pantalla:** cliente HTTP y módulos. **Datos:** odontólogo, admin normal distinto de ID 1 y superadmin ficticios; tokens ocultos.

1. Sin sesión GET `/api/soporte/mensajes`: esperar 401; GET `/api/solicitudes`: esperar 403.
2. Como odontólogo GET soporte/mensajes: esperar 403; soporte/mis-mensajes: 200 con mensajes propios.
3. Como admin normal distinto de 1 GET solicitudes: esperar 403.
4. Como superadmin GET ambos listados restringidos: esperar 200.
5. Seguir _sesion_requerida/_superadmin_requerido y _puede_gestionar_solicitudes hasta Sesion/expiración/activo.
6. Contrastar odontologos.py, cuyo solicitante procede del cuerpo; no cambiar roles ni aprobar solicitudes.

**Esperado:** 401/403/200 según política puntual. **Código:** auth.py util:8–29; soporte.py:14–26; solicitudes.py:8–16. **Demuestra:** SE-05/06 y PR-01 parcialmente. **Estado:** código listo; ejecución pendiente; no extrapolar a toda API.

### V08 — Tiempos, recursos y carga acotada (ED/FL)

**Decir:** «Se mide UI, HTTP y servicio IA por separado, sin cifras inventadas». **Pantalla:** Network/Performance y monitor de recursos. **Datos:** hardware/modelo/configuración no secreta, imágenes ficticias y evaluaciones desechables separadas.

1. Anotar CPU/GPU/RAM/navegador, versiones, resolución/tamaño y arranque frío/caliente.
2. Medir GET pacientes, historial paginado y reportes uno a uno.
3. Para inferencia medir clic→usable, duración HTTP /procesar y validación previa por separado.
4. Anotar tiempo_proceso_ms por radiografía como tiempo del servicio backend, no YOLO puro.
5. Repetir al menos diez rondas por operación; separar primer uso y reportar mínimo/mediana/p95/máximo y errores.
6. Observar recursos; probar un usuario, después dos y tres solo si estable; parar ante presión.
7. Comparar cada tarea contra <5s y enseñar demora 4000–6000/cola visual.

**Esperado:** tabla real por capa, throughput y recursos; no hay cifras hoy. **Código:** EvaluacionClinica.jsx:636–776; ia_service.py:138; evaluaciones.py:444–451. **Demuestra:** ED-01–04 y FL-02/03 si resultados lo sostienen. **Estado:** pendiente total; repeticiones IA escriben/reemplazan datos, no usar casos clínicos.

### V09 — Errores y recuperación (FI/CI/PR)

**Decir:** «Error de red/modelo no equivale a ausencia de lesión». **Pantalla:** carga, Network, bloqueo de peticiones local y editor. **Datos:** archivos pequeños ficticios existentes: corrupto, vertical, TXT; fixture previo preservado.

1. Seleccionar corrupto y mostrar valid=false/mensaje sin avanzar.
2. Repetir vertical; luego TXT y registrar HTTP 400 frente a aceptación visual indebida; no pulsar Continuar.
3. Bloquear solo petición *:8000/api/validate en esa pestaña y seleccionar fixture; observar si continúa ante error.
4. Desbloquear inmediatamente y verificar conexión normal; no detener servicios compartidos.
5. Mostrar run_inference/ia_service; reservar simulación de fallo IA/DB para dobles en entorno independiente.
6. Para recuperación/pérdida usar PM-15 posteriormente, sin borrar archivos/modelos ni cortar DB real.

**Esperado:** algunos rechazos funcionan, otros tienen brechas; registrar fallos. **Código:** validateImage:877–901; detector.py:245–251; evaluaciones.py:347–430. **Demuestra:** FI-01–03, CI-08 y PR-03 parcialmente. **Estado:** pendiente; no afirmar recuperación sin ensayo.

### V10 — Interacción, autonomía, accesibilidad y ayuda (CI)

**Decir:** «La interfaz orienta; accesibilidad y satisfacción requieren observación». **Pantalla:** pacientes/nueva evaluación/ayuda, 1366×768, 390×844 y zoom 200%. **Datos:** cuenta/fixtures, sin guardar para revisar foco.

1. Alternar tarjetas/lista y buscar fixture; navegar historial.
2. Leer pasos y botones inactivos cuando faltan datos.
3. Abrir modal con teclado; Tab/Shift+Tab, Escape, foco inicial y retorno; anotar fallos.
4. Emular móvil, abrir/cerrar menú y revisar visor/botones; repetir zoom 200% y lector.
5. Abrir FAQ sobre carga e interpretación y sección del manual correspondiente.
6. Observar después a odontólogo nuevo completar tarea sin ayuda; recoger errores/tiempo/satisfacción con autorización para grabar voz/imagen.

**Esperado:** tarea comprensible y accesible; no inferir satisfacción de CSS/aria. **Código:** Layout.jsx:409–411; ModalConfirmacion.jsx; Ayuda.jsx; Perfil.jsx:344–370. **Demuestra:** CI-01–10 individualmente, según observación. **Estado:** pendiente visual, teclado y usuarios.

### V11 — Arquitectura y modelo trazable (FL/AF/FI)

**Decir:** «La separación facilita cambios, pero no demuestra escalado o precisión». **Pantalla:** árbol/editor/metadatos. **Datos:** solo rutas/umbrales permitidos; no entorno completo.

1. Mostrar frontend/src, backend/app y api_ia_sonrie/app; señalar blueprints registrados.
2. Seguir api.js y fetch directos; explicar localhost fijo y navegador→IA además de backend→IA.
3. Mostrar lectura IA_API_URL/MODEL_PATH y solo valores no secretos.
4. Comparar v2.3 configurado con modelo_version fijo v1.3; no cargar checkpoint.
5. Abrir eval_v2_0.json y evaluador split=val; explicar que no acredita v2.3 ni población adolescente independiente.
6. Revisar requirements, run.py y health.py; señalar dependencias faltantes, desarrollo y falta de readiness.

**Esperado:** modularidad y límites concretos; escalabilidad/modelo interno/precisión NV. **Código:** api.js; ia_service.py:11,175; detector.py:12; health.py. **Demuestra:** FL-01/04/05, AF-04 y límites FI-05. **Estado:** evidencia estática lista; no ejecutar evaluadores/migraciones.

### V12 — Responsables, riesgos y amenazas (SE/PR/FI)

**Decir:** «Hay eventos de acceso, pero falta auditoría clínica y tratamiento completo de riesgos». **Pantalla:** esquema/código y matriz de sección 4. **Datos:** solo nombres de columnas y evidencia anonimizada.

1. Mostrar HistorialAcceso y eventos login/logout/login_fallido/recuperacion_pass.
2. Seguir login: rollback de sesión y posterior HTTP 200; explicar inconsistencia.
3. Mostrar actor fijo en alta/finalización y solicitante del cuerpo; no enviar escrituras.
4. Mostrar estructura de log Markdown sin contenido clínico: hash no equivale a actor/acción autorizados ni inmutabilidad.
5. Recorrer amenazas de datos ajenos, archivos, IA, credenciales y pérdida; asociar mitigación y prueba.
6. Declarar dueño/riesgo residual pendientes; este informe documenta problemas, no implementa controles.

**Esperado:** distinción entre logs técnicos, accesos y responsabilidad real. **Código:** models.py; auth.py:26–42; pacientes.py:70; evaluaciones.py:197; ia_service.py:52. **Demuestra:** SE-04/07/08, PR-02/04/05, FI-04 como brechas. **Estado:** código/matriz listos; controles pendientes.

### Plantilla para registrar desempeño sin inventar resultados

| Operación | Frío/caliente | Ronda | Usuarios | Tamaño/resolución/registros | UI clic→usable ms | HTTP ms | tiempo_proceso_ms backend | YOLO puro ms | CPU/RAM/GPU | Estado/error |
|---|---|---|---|---|---|---|---|---|---|---|
| Pacientes | Pendiente | 1–10 | 1 | — | — | — | No aplica | No aplica | — | — |
| Historial paginado | Pendiente | 1–10 | 1 | — | — | — | No aplica | No aplica | — | — |
| Reportes | Pendiente | 1–10 | 1 | — | — | — | No aplica | No aplica | — | — |
| Validar imagen | Separar | 1–10 | 1 | — | — | — | No expuesto aquí | No aplica | — | — |
| Procesar radiografía | Separar | 1–10 | 1 | — | — | — | — | No instrumentado | — | — |
| Lote/concurrencia | Separar | 1–10 | 2–3 inicial | — | — | — | Por imagen | No instrumentado | — | — |
| PDF | Pendiente | 1–10 | 1 | — | — | — | No aplica | No aplica | — | — |

Network no incluye toda espera hasta pantalla usable. tiempo_proceso_ms se calcula desde antes de lectura/hash/petición, antes de completar persistencia/log; no es YOLO puro ni tiempo total. Throughput=solicitudes finalizadas/intervalo con errores y cola. p95 con diez rondas es exploratorio, no certificación estadística de carga exigente.

## SECCIÓN 6: MATRIZ DE EVIDENCIAS

Cada requisito BUENO tiene fila. Estado por lectura, no prueba funcional nueva.

| ID | Criterio | Requisito | Evidencia | Archivo/ruta | Estado | Escena del video |
|---|---|---|---|---|---|---|
| AF-01 | Adecuación funcional | Cobertura correcta de todas las funciones necesarias | Código y futura demostración: Mostrar flujo completo con datos coherentes y estados persistidos. | `backend/app/routes/evaluaciones.py:128–278; frontend/src/pages/EvaluacionClinica.jsx:1094–1262` | Cumple parcialmente; ejecución pendiente | V03 |
| AF-02 | Adecuación funcional | Capacidades adicionales de valor y alta pertinencia | Código y futura demostración: Mostrar comparación y ayuda útiles para tareas del odontólogo. | `backend/app/routes/reportes.py:250; frontend/src/components/ReporteIndividual.jsx:296; frontend/src/pages/Ayuda.jsx:223–305` | Cumple parcialmente; ejecución pendiente | V05 |
| AF-03 | Adecuación funcional | Ejecución de funciones sin errores | Código y futura demostración: Mostrar error técnico diferenciado de radiografía sin lesiones. | `api_ia_sonrie/app/services/detector.py:245–251; backend/app/services/ia_service.py:151–179` | No cumple; ejecución pendiente | V09 |
| AF-04 | Adecuación funcional | Nivel de precisión requerido | Código y futura demostración: Mostrar métricas atribuibles al mismo modelo de la demostración. | `api_ia_sonrie/app/services/detector.py:12–25,242; api_ia_sonrie/models/eval_v2_0.json` | No verificable; ejecución pendiente | V11 |
| AF-05 | Adecuación funcional | Resultados fiables y exactos | Código y futura demostración: Mostrar scores auténticos identificados y taxonomía clínicamente justificada. | `api_ia_sonrie/app/services/detector.py:148–178; frontend/src/pages/EvaluacionClinica.jsx:2553–2586; EvaluacionDetalle.jsx:152–171` | No cumple; ejecución pendiente | V03 |
| AF-06 | Adecuación funcional | Necesidades reales de la organización | Código y futura demostración: Mostrar aceptación de tareas y alcance por responsable clínico. | `material_tesis/documentacion/manual_usuario_sistema_sonrie.md:7,408,632; backend/app/services/diagnostico_pdf.py:190` | Cumple parcialmente; ejecución pendiente | V04 |
| AF-07 | Adecuación funcional | Funciones apropiadas que facilitan tareas | Código y futura demostración: Mostrar expediente fiel a una revisión humana explícita. | `frontend/src/components/BoundingBoxViewer.jsx:45–180; backend/app/routes/evaluaciones.py:188–214,225–278` | Cumple parcialmente; ejecución pendiente | V04 |
| ED-01 | Eficiencia | Tiempos de respuesta menores de 5 segundos | Código y futura demostración: Mostrar duraciones reales por operación comparadas con <5s. | `frontend/src/pages/EvaluacionClinica.jsx:636–641,716,776; backend/app/services/ia_service.py:138` | No verificable; ejecución pendiente | V08 |
| ED-02 | Eficiencia | Tasas de rendimiento sin demoras críticas | Código y futura demostración: Mostrar tasa de trabajo con concurrencia, tamaño de lote y errores declarados. | `backend/app/routes/evaluaciones.py:444–451; api_ia_sonrie/app/routes/predict.py:30–34` | No verificable; ejecución pendiente | V08 |
| ED-03 | Eficiencia | Uso eficiente y equilibrado de recursos | Código y futura demostración: Mostrar recursos registrados, acotados y sin crecimiento acumulativo. | `api_ia_sonrie/app/utils/clip_validator.py:23–42; cls_validator.py:34–51; backend/app/routes/pacientes.py:12–29` | Cumple parcialmente; ejecución pendiente | V08 |
| ED-04 | Eficiencia | Alta estabilidad con carga real en escenarios exigentes | Código y futura demostración: Mostrar carga pactada atendida con métricas observadas y límites explícitos. | `backend/run.py:5–11; api_ia_sonrie/run.py:7–11; backend/app/routes/auth.py:13` | No verificable; ejecución pendiente | V08 |
| CI-01 | Capacidad de interacción | Estética agradable | Código y futura demostración: Mostrar pantallas legibles, coherentes y sin superposición. | `frontend/tailwind.config.js:8; frontend/src/index.css:5; frontend/src/components/Layout.jsx:211` | Cumple parcialmente; ejecución pendiente | V10 |
| CI-02 | Capacidad de interacción | Interacción satisfactoria | Código y futura demostración: Mostrar opinión y resultados de tarea de usuarios reales con datos ficticios. | `frontend/src/pages/EvaluacionClinica.jsx:636–641; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408` | No verificable; ejecución pendiente | V10 |
| CI-03 | Capacidad de interacción | Interacción intuitiva | Código y futura demostración: Mostrar usuario identifica tarea y siguiente acción sin guía constante. | `frontend/src/App.jsx:27–42; frontend/src/pages/EvaluacionClinica.jsx:1596–1615` | Cumple parcialmente; ejecución pendiente | V10 |
| CI-04 | Capacidad de interacción | Accesibilidad | Código y futura demostración: Mostrar foco visible y contenido, semántica correcta y tarea sin ratón. | `frontend/src/components/Layout.jsx:409–411; frontend/src/pages/Perfil.jsx:344–370; frontend/src/components/ModalConfirmacion.jsx:45` | Cumple parcialmente; ejecución pendiente | V10 |
| CI-05 | Capacidad de interacción | Interacción motivadora | Código y futura demostración: Mostrar usuario comprende avance real y considera útil continuar. | `frontend/src/components/ModalFinalizacion.jsx:6; frontend/src/pages/EvaluacionClinica.jsx:1472` | No verificable; ejecución pendiente | V10 |
| CI-06 | Capacidad de interacción | Completar tareas complejas con facilidad | Código y futura demostración: Mostrar tarea completada sin bloqueos ni duplicación innecesaria. | `frontend/src/pages/EvaluacionClinica.jsx:335,1094–1262; frontend/src/pages/Pendientes.jsx:41` | Cumple parcialmente; ejecución pendiente | V03 |
| CI-07 | Capacidad de interacción | Comprensión autónoma sin capacitación extensa | Código y futura demostración: Mostrar usuario completa tarea y resuelve dudas con ayuda del sistema. | `frontend/src/pages/Ayuda.jsx:223–305; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:408,587,632` | Cumple parcialmente; ejecución pendiente | V10 |
| CI-08 | Capacidad de interacción | Prevención de errores del usuario | Código y futura demostración: Mostrar datos o archivos inválidos no permiten continuar, con explicación clara. | `backend/app/utils/validation.py:29–60; frontend/src/pages/EvaluacionClinica.jsx:877–901` | Cumple parcialmente; ejecución pendiente | V09 |
| CI-09 | Capacidad de interacción | Retroalimentación oportuna y clara | Código y futura demostración: Mostrar mensajes y progreso corresponden al estado real y permiten reintento seguro. | `frontend/src/pages/EvaluacionClinica.jsx:700–783; frontend/src/pages/EvaluacionDetalle.jsx:449–463` | Cumple parcialmente; ejecución pendiente | V03 |
| CI-10 | Capacidad de interacción | Ayuda detallada y entendible | Código y futura demostración: Mostrar ayuda localizable y explicación fiel sin promesas infundadas. | `frontend/src/pages/Ayuda.jsx; material_tesis/documentacion/manual_usuario_sistema_sonrie.md:111–1133` | Cumple parcialmente; ejecución pendiente | V10 |
| FI-01 | Fiabilidad | Operación muy estable sin fallos | Código y futura demostración: Mostrar repetición de flujos sin errores con evidencia actual y límites. | `backend/tests/test_pdf_endpoint.py; Pruebas_Tesis_Sonrie/Evidencias_Caja_Blanca/Resumen_Caja_Blanca.json` | No verificable; ejecución pendiente | V09 |
| FI-02 | Fiabilidad | Tolerancia y gestión adecuada de fallos | Código y futura demostración: Mostrar error explícito y ui disponible para reintentar sin conclusión falsa. | `backend/app/services/ia_service.py:268–295; backend/app/routes/evaluaciones.py:428–460; frontend/src/pages/EvaluacionClinica.jsx:747–759` | Cumple parcialmente; ejecución pendiente | V09 |
| FI-03 | Fiabilidad | Gestión sin impacto visible para el usuario | Código y futura demostración: Mostrar fallo no destruye contexto ni paraliza aplicación; sin prometer invisibilidad no probada. | `frontend/src/pages/EvaluacionClinica.jsx:707–723,778–785; backend/app/services/ia_service.py:138` | No cumple; ejecución pendiente | V09 |
| FI-04 | Fiabilidad | Recuperación rápida sin pérdida de datos | Código y futura demostración: Mostrar original/resultados previos conservados ante fallo y reintento consistente. | `backend/app/routes/evaluaciones.py:347–408,421–430; backend/app/services/ia_service.py:130–154,251–263` | No cumple; ejecución pendiente | V12 |
| FI-05 | Fiabilidad | Recuperación sin interrupciones | Código y futura demostración: Mostrar recuperación observada con datos íntegros y tiempos medidos. | `backend/run.py:7–11; api_ia_sonrie/app/routes/health.py:5–10; README.md sección 9` | No verificable; ejecución pendiente | V11 |
| SE-01 | Seguridad | Legitimidad de accesos | Código y futura demostración: Mostrar 401 sin sesión y 403/404 cuando falta autorización por objeto. | `backend/app/utils/auth.py:8–29; backend/app/routes/pacientes.py:9–140; backend/app/__init__.py:42–44` | No cumple; ejecución pendiente | V06 |
| SE-02 | Seguridad | Protección de datos | Código y futura demostración: Mostrar sin contraseña legible persistida y datos solo accesibles con permiso. | `frontend/src/pages/Login.jsx:81; frontend/src/pages/EvaluacionClinica.jsx:199–208; backend/app/__init__.py:42` | No cumple; ejecución pendiente | V01 |
| SE-03 | Seguridad | Autenticación segura | Código y futura demostración: Mostrar hash auténtico, sesión persistida y recuperación ligada al titular. | `backend/app/utils/security.py:4–30; backend/app/routes/auth.py:84–118,186–212` | Cumple parcialmente; ejecución pendiente | V01 |
| SE-04 | Seguridad | Alta resistencia a amenazas avanzadas | Código y futura demostración: Mostrar controles evaluados con pruebas autorizadas; no confundir bloqueo básico con resistencia avanzada. | `backend/app/routes/auth.py:12–15,49–59; backend/app/__init__.py:15; api_ia_sonrie/app/main.py:8–15` | No verificable; ejecución pendiente | V12 |
| SE-05 | Seguridad | Roles definidos | Código y futura demostración: Mostrar matriz de rol/acción aplicada realmente por servidor. | `backend/app/models.py:16–17; backend/app/routes/odontologos.py:155–196; backend/app/routes/soporte.py:21–26` | Cumple parcialmente; ejecución pendiente | V07 |
| SE-06 | Seguridad | Responsabilidades definidas | Código y futura demostración: Mostrar acciones y alcance autorizados independientemente del menú. | `frontend/src/components/Layout.jsx:131–196; backend/app/routes/odontologos.py:198–202; manual_usuario_sistema_sonrie.md:52` | Cumple parcialmente; ejecución pendiente | V07 |
| SE-07 | Seguridad | Registro de acciones de usuarios | Código y futura demostración: Mostrar acciones relevantes correlacionadas a actor/objeto/fecha/resultado. | `backend/app/routes/auth.py:26–42,98–107,129–146; backend/app/models.py clase HistorialAcceso` | Cumple parcialmente; ejecución pendiente | V12 |
| SE-08 | Seguridad | Identificación fiable de responsables | Código y futura demostración: Mostrar autor real coincide con sesión y queda conservado en historial. | `backend/app/routes/pacientes.py:70–74; backend/app/routes/evaluaciones.py:197–203; backend/app/routes/odontologos.py:160–165` | No cumple; ejecución pendiente | V12 |
| FL-01 | Flexibilidad | Flexibilidad para soportar cambios | Código y futura demostración: Mostrar cambios de componente/configuración sin editar múltiples pantallas. | `backend/app/__init__.py:25–40; backend/app/services/ia_service.py:11; api_ia_sonrie/app/services/detector.py:12` | Cumple parcialmente; ejecución pendiente | V11 |
| FL-02 | Flexibilidad | Escalabilidad | Código y futura demostración: Mostrar mayor carga atendida sin pérdida de archivos/control ni degradación inaceptable. | `api_ia_sonrie/app/routes/predict.py:30–34; backend/app/routes/evaluaciones.py:444–451; backend/app/routes/auth.py:13` | No verificable; ejecución pendiente | V08 |
| FL-03 | Flexibilidad | Crecimiento sin degradación de calidad | Código y futura demostración: Mostrar transferencia/consultas acotadas y calidad mantenida con más datos. | `backend/app/routes/pacientes.py:12–29; evaluaciones.py:24–25,103; soporte.py:104` | No verificable; ejecución pendiente | V08 |
| FL-04 | Flexibilidad | Herramientas y funciones más accesibles o simples | Código y futura demostración: Mostrar extensión que reutiliza resultados y permisos sin duplicar semántica clínica. | `frontend/src/components/BoundingBoxViewer.jsx:45; backend/app/services/diagnostico_pdf.py:190; frontend/src/pages/Ayuda.jsx` | Cumple parcialmente; ejecución pendiente | V11 |
| FL-05 | Flexibilidad | Introducción de herramientas más eficientes | Código y futura demostración: Mostrar sustitución trazable que conserva semántica y acredita mejora medida. | `api_ia_sonrie/app/services/detector.py:12,242; backend/app/services/ia_service.py:175; api_ia_sonrie/requirements.txt` | Cumple parcialmente; ejecución pendiente | V11 |
| PR-01 | Protección | Limitar operaciones no autorizadas | Código y futura demostración: Mostrar rechazo backend para todas las operaciones sin permiso. | `backend/app/routes/soporte.py:14–26,75–79; solicitudes.py:8–16; odontologos.py:115–208` | Cumple parcialmente; ejecución pendiente | V07 |
| PR-02 | Protección | Controlar usos indebidos | Código y futura demostración: Mostrar exceso controlado con rechazo claro sin degradar otros usuarios. | `backend/app/routes/auth.py:12–15; api_ia_sonrie/app/routes/predict.py:30,53; backend/app/routes/evaluaciones.py:433` | Cumple parcialmente; ejecución pendiente | V12 |
| PR-03 | Protección | Restricciones adecuadas de archivos y acceso a datos | Código y futura demostración: Mostrar inválidos rechazados en servidor y objetos accesibles solo por política. | `backend/app/routes/evaluaciones.py:342–350; api_ia_sonrie/app/utils/image_utils.py:3–14; EvaluacionClinica.jsx:877–901` | No cumple; ejecución pendiente | V09 |
| PR-04 | Protección | Documentación detallada de riesgos adversos | Código y futura demostración: Mostrar riesgos conocidos documentados, con dueño y seguimiento. | `README.md sección 9; material_tesis/documentacion/explicacion_sistema.md; sección 4 de este informe` | Cumple parcialmente; ejecución pendiente | V12 |
| PR-05 | Protección | Evaluación de amenazas potenciales | Código y futura demostración: Mostrar amenazas ligadas a controles comprobados y riesgo residual decidido por responsable. | `backend/app/routes/odontologos.py:160–202; auth.py:186–212; backend/app/__init__.py:42–44` | No verificable; ejecución pendiente | V12 |

## SECCIÓN 7: CASOS DE PRUEBA MANUALES SEGUROS

**Todos pendientes y no ejecutados.** Preparar posteriormente copia independiente con DB completamente ficticia, uploads/logs propios y cuentas de ensayo. No importar volcado con pacientes reales. Si no se garantiza aislamiento, dejar caso pendiente. No ejecutar scripts existentes sobre el sistema auditado: pueden escribir tablas, logs y artefactos.

Registrar esperado/observado y Aprobado/Fallido/Pendiente, sin cambiar esperado para hacer pasar el caso. No exportar HAR sin sanitizar: puede incluir contraseñas/tokens/datos. Usar IDs de fixtures conocidos, sin enumeración.

### PM-01: Acceso, contraseñas y sesión (SE/CI/PR)

- **Objetivo y criterios:** verificar SE-02, SE-03.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Hay autenticación y bcrypt; la protección de API debe comprobarse aparte». **Pantalla:** /login, /dashboard y editor. **Datos:** cuenta ficticia ya habilitada.

1. Abrir ventana privada en `http://localhost:3000/dashboard`; registrar redirección a /login.
2. Iniciar sesión ficticia ocultando contraseña y respuesta sensible; confirmar dashboard.
3. En Network mostrar solo URL y status de `/api/auth/login`, sin cuerpo/cabeceras sensibles.
4. Abrir `security.py:4–30`: explicar salt/hash/checkpw y comparación legada. Hashing no es cifrado reversible.
5. Mostrar `Login.jsx:81`, sin valores de almacenamiento: recordar contraseña es debilidad.
6. Cerrar sesión y observar llamada logout; usar V07 para autorización real.

**Esperado:** flujo visual puede funcionar, pero no acredita todas las rutas. **Código:** auth.py:44–148, security.py, Login.jsx:63–83. **Demuestra:** SE-02/03 parcialmente y experiencia de acceso. **Estado:** ejecución pendiente; seguridad global requiere mejora.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-02: Pacientes y errores de datos (AF/CI)

- **Objetivo y criterios:** verificar .
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Se validan datos y apoderado para menores». **Pantalla:** /pacientes → Nuevo paciente. **Datos:** Paciente Demo, nacimiento 2011-01-15, Tutor Demo, DNI ficticio único de ocho dígitos, teléfono ficticio 900000001 y demo@example.invalid; no dirigir contactos reales.

1. Dejar DNI/teléfono incompleto y mostrar mensaje sin guardar.
2. Introducir fecha futura y comprobar rechazo.
3. Completar menor sin apoderado; mostrar requisito de nombre/teléfono del tutor.
4. Completar fixture válido y guardar una vez en copia aislada; anotar ID.
5. Buscar por DNI ficticio, abrir ficha, probar edición inválida y cancelarla.
6. Recargar y comparar datos/actor; señalar que actualmente guarda odontólogo 1.

**Esperado:** mensajes y persistencia; autoría es brecha. **Código:** validation.py:29–60, pacientes.py:56–93, ModalNuevoPaciente.jsx. **Demuestra:** AF-01/07 y CI-08; no aceptación clínica. **Estado:** pendiente; alta escribe datos.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-03: Flujo clínico y detecciones (AF/CI; medición ED)

- **Objetivo y criterios:** verificar AF-01, AF-05, CI-06, CI-09.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «El modelo propone hallazgos para revisión humana; score no significa exactitud clínica». **Pantalla:** /nueva-evaluacion. **Datos:** paciente ficticio y panorámica autorizada desidentificada con referencia profesional.

1. Seleccionar paciente; completar Contexto Clínico con Primera vez y motivo ficticio.
2. Cargar panorámica; revisar `/api/validate`, valid y vista previa.
3. Continuar al resumen, analizar y registrar `/api/evaluaciones/<id>/procesar`.
4. Mantener cronómetro hasta resultado usable; no confundir animación con inferencia.
5. En Resultados alternar cajas/etiquetas, seleccionar hallazgo y usar zoom; contrastar referencia.
6. Comparar confidence con barras; enseñar `extraer_probabilidades` y reparto frontend.
7. Explicar cadena React→Flask→FastAPI y estados anidados; no llamar sana a inferencia fallida.

**Esperado:** hallazgos/cajas/scores auténticos o ausencia legítima de hallazgos, diferenciada de error. **Código:** detector.py:148–178,242–251; EvaluacionClinica.jsx:710–778,2553–2586. **Demuestra:** AF-01/05, CI-06/09; precisión global no se prueba con una imagen. **Estado:** pendiente; escribe DB/logs y requiere correcciones.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-04: Guardar, recargar y descargar (AF/FI)

- **Objetivo y criterios:** verificar AF-06, AF-07.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «El expediente pertenece a esta evaluación y conserva revisión humana». **Pantalla:** Resultados → /historial → /evaluacion/<id>. **Datos:** evaluación ficticia procesada y texto diagnóstico/plan de ensayo; plantilla presente.

1. Redactar diagnóstico ficticio significativo y plan, revisar y finalizar una vez.
2. Esperar confirmación HTTP, anotar ID ficticio y abrir historial.
3. Confirmar completada, abrir detalle y recargar.
4. Comparar texto, hallazgos e imagen con lo visto antes de cerrar.
5. Descargar Expediente a destino fuera del proyecto, sin sobrescribir; abrir PDF.
6. Verificar evaluación/paciente ficticio/fecha/diagnóstico/imagen/cajas y continuidad si varias páginas.
7. Mostrar condición de completada y diagnóstico; explicar 409 para pendiente y control secuencial de reintentos.

**Esperado:** PDF y detalle fieles; no prueba backup/recuperación ni autoría fiable. **Código:** evaluaciones.py:173–278 y diagnostico_pdf.py:190. **Demuestra:** AF-06/07 y persistencia parcial FI. **Estado:** pendiente; pruebas históricas no sustituyen esta validación.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-05: Reportes con significado correcto (AF/CI)

- **Objetivo y criterios:** verificar AF-02.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Son agregaciones de DB; aceptación calculada no es revisión clínica». **Pantalla:** /reportes. **Datos:** casos ficticios conocidos con/sin hallazgos/error cuando existan en copia.

1. Abrir pestaña IA; comparar total/confianza/rechazo con fixtures.
2. Mostrar fórmula aceptación=100−rechazo y clasificación de confianza cero.
3. Abrir epidemiología: explicar denominador con join a detecciones y edad almacenada.
4. Abrir productividad: revisar autor y fechas; contrastar primeros/últimos 30 días.
5. Abrir reporte individual, buscar fixture y mostrar línea temporal/comparativa.
6. Registrar diferencias; no presentar confianza media como precisión ni categorías sintéticas como evidencia clínica.

**Esperado:** valores coherentes con fixtures y límites explicados. **Código:** reportes.py:36–82,84–178,180–246,250; ReporteIndividual.jsx:296. **Demuestra:** capacidades adicionales AF-02, claridad; métricas requieren mejora. **Estado:** pendiente.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-06: API clínica y objetos sin sesión (SE/PR)

- **Objetivo y criterios:** verificar SE-01.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Una redirección visual no protege la API; esta escena comprueba la brecha». **Pantalla:** cliente HTTP local y editor. **Datos:** copia sin pacientes reales, IDs/imagen ficticios conocidos.

1. Confirmar URL local y ausencia de Authorization/cookies.
2. Enviar GET `/api/pacientes`; registrar status y estructura anonimizada.
3. Enviar GET `/api/evaluaciones/<ID_FICTICIO>/detalle` y `/pdf` de un fixture completado.
4. Consultar únicamente URL de upload ficticio conocido, sin enumeración.
5. Contrastar con V07 y mostrar ausencia de validación en rutas clínicas/uploaded_file.
6. Registrar 200 como defecto; respuesta segura requerida 401 sin sesión y 403/404 sin permiso por objeto.

**Esperado por lectura:** rutas clínicas pueden responder sin sesión si DB/archivo están disponibles; no se ejecutó. **Código:** pacientes.py, evaluaciones.py, __init__.py:42–44. **Demuestra:** SE-01 y restricciones PR deficientes. **Estado:** solo fixtures; no prueba positiva hasta corregir.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-07: Autorización real de soporte/solicitudes (SE/PR)

- **Objetivo y criterios:** verificar SE-05, SE-06, PR-01.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Estos módulos sí verifican sesión y rol en servidor». **Pantalla:** cliente HTTP y módulos. **Datos:** odontólogo, admin normal distinto de ID 1 y superadmin ficticios; tokens ocultos.

1. Sin sesión GET `/api/soporte/mensajes`: esperar 401; GET `/api/solicitudes`: esperar 403.
2. Como odontólogo GET soporte/mensajes: esperar 403; soporte/mis-mensajes: 200 con mensajes propios.
3. Como admin normal distinto de 1 GET solicitudes: esperar 403.
4. Como superadmin GET ambos listados restringidos: esperar 200.
5. Seguir _sesion_requerida/_superadmin_requerido y _puede_gestionar_solicitudes hasta Sesion/expiración/activo.
6. Contrastar odontologos.py, cuyo solicitante procede del cuerpo; no cambiar roles ni aprobar solicitudes.

**Esperado:** 401/403/200 según política puntual. **Código:** auth.py util:8–29; soporte.py:14–26; solicitudes.py:8–16. **Demuestra:** SE-05/06 y PR-01 parcialmente. **Estado:** código listo; ejecución pendiente; no extrapolar a toda API.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-08: Tiempos, recursos y carga acotada (ED/FL)

- **Objetivo y criterios:** verificar ED-01, ED-02, ED-03, ED-04, FL-02, FL-03.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Se mide UI, HTTP y servicio IA por separado, sin cifras inventadas». **Pantalla:** Network/Performance y monitor de recursos. **Datos:** hardware/modelo/configuración no secreta, imágenes ficticias y evaluaciones desechables separadas.

1. Anotar CPU/GPU/RAM/navegador, versiones, resolución/tamaño y arranque frío/caliente.
2. Medir GET pacientes, historial paginado y reportes uno a uno.
3. Para inferencia medir clic→usable, duración HTTP /procesar y validación previa por separado.
4. Anotar tiempo_proceso_ms por radiografía como tiempo del servicio backend, no YOLO puro.
5. Repetir al menos diez rondas por operación; separar primer uso y reportar mínimo/mediana/p95/máximo y errores.
6. Observar recursos; probar un usuario, después dos y tres solo si estable; parar ante presión.
7. Comparar cada tarea contra <5s y enseñar demora 4000–6000/cola visual.

**Esperado:** tabla real por capa, throughput y recursos; no hay cifras hoy. **Código:** EvaluacionClinica.jsx:636–776; ia_service.py:138; evaluaciones.py:444–451. **Demuestra:** ED-01–04 y FL-02/03 si resultados lo sostienen. **Estado:** pendiente total; repeticiones IA escriben/reemplazan datos, no usar casos clínicos.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-09: Errores y recuperación (FI/CI/PR)

- **Objetivo y criterios:** verificar AF-03, CI-08, FI-01, FI-02, FI-03, PR-03.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Error de red/modelo no equivale a ausencia de lesión». **Pantalla:** carga, Network, bloqueo de peticiones local y editor. **Datos:** archivos pequeños ficticios existentes: corrupto, vertical, TXT; fixture previo preservado.

1. Seleccionar corrupto y mostrar valid=false/mensaje sin avanzar.
2. Repetir vertical; luego TXT y registrar HTTP 400 frente a aceptación visual indebida; no pulsar Continuar.
3. Bloquear solo petición *:8000/api/validate en esa pestaña y seleccionar fixture; observar si continúa ante error.
4. Desbloquear inmediatamente y verificar conexión normal; no detener servicios compartidos.
5. Mostrar run_inference/ia_service; reservar simulación de fallo IA/DB para dobles en entorno independiente.
6. Para recuperación/pérdida usar PM-15 posteriormente, sin borrar archivos/modelos ni cortar DB real.

**Esperado:** algunos rechazos funcionan, otros tienen brechas; registrar fallos. **Código:** validateImage:877–901; detector.py:245–251; evaluaciones.py:347–430. **Demuestra:** FI-01–03, CI-08 y PR-03 parcialmente. **Estado:** pendiente; no afirmar recuperación sin ensayo.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-10: Interacción, autonomía, accesibilidad y ayuda (CI)

- **Objetivo y criterios:** verificar CI-01, CI-02, CI-03, CI-04, CI-05, CI-07, CI-10.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «La interfaz orienta; accesibilidad y satisfacción requieren observación». **Pantalla:** pacientes/nueva evaluación/ayuda, 1366×768, 390×844 y zoom 200%. **Datos:** cuenta/fixtures, sin guardar para revisar foco.

1. Alternar tarjetas/lista y buscar fixture; navegar historial.
2. Leer pasos y botones inactivos cuando faltan datos.
3. Abrir modal con teclado; Tab/Shift+Tab, Escape, foco inicial y retorno; anotar fallos.
4. Emular móvil, abrir/cerrar menú y revisar visor/botones; repetir zoom 200% y lector.
5. Abrir FAQ sobre carga e interpretación y sección del manual correspondiente.
6. Observar después a odontólogo nuevo completar tarea sin ayuda; recoger errores/tiempo/satisfacción con autorización para grabar voz/imagen.

**Esperado:** tarea comprensible y accesible; no inferir satisfacción de CSS/aria. **Código:** Layout.jsx:409–411; ModalConfirmacion.jsx; Ayuda.jsx; Perfil.jsx:344–370. **Demuestra:** CI-01–10 individualmente, según observación. **Estado:** pendiente visual, teclado y usuarios.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-11: Arquitectura y modelo trazable (FL/AF/FI)

- **Objetivo y criterios:** verificar AF-04, FI-05, FL-01, FL-04, FL-05.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «La separación facilita cambios, pero no demuestra escalado o precisión». **Pantalla:** árbol/editor/metadatos. **Datos:** solo rutas/umbrales permitidos; no entorno completo.

1. Mostrar frontend/src, backend/app y api_ia_sonrie/app; señalar blueprints registrados.
2. Seguir api.js y fetch directos; explicar localhost fijo y navegador→IA además de backend→IA.
3. Mostrar lectura IA_API_URL/MODEL_PATH y solo valores no secretos.
4. Comparar v2.3 configurado con modelo_version fijo v1.3; no cargar checkpoint.
5. Abrir eval_v2_0.json y evaluador split=val; explicar que no acredita v2.3 ni población adolescente independiente.
6. Revisar requirements, run.py y health.py; señalar dependencias faltantes, desarrollo y falta de readiness.

**Esperado:** modularidad y límites concretos; escalabilidad/modelo interno/precisión NV. **Código:** api.js; ia_service.py:11,175; detector.py:12; health.py. **Demuestra:** FL-01/04/05, AF-04 y límites FI-05. **Estado:** evidencia estática lista; no ejecutar evaluadores/migraciones.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.

### PM-12: Responsables, riesgos y amenazas (SE/PR/FI)

- **Objetivo y criterios:** verificar FI-04, SE-04, SE-07, SE-08, PR-02, PR-04, PR-05.
- **Precondiciones:** copia ficticia aislada y servicios/cuentas preparados después; no modificar el sistema auditado.
- **Datos y pasos:** reproducidos completos a continuación.

**Decir:** «Hay eventos de acceso, pero falta auditoría clínica y tratamiento completo de riesgos». **Pantalla:** esquema/código y matriz de sección 4. **Datos:** solo nombres de columnas y evidencia anonimizada.

1. Mostrar HistorialAcceso y eventos login/logout/login_fallido/recuperacion_pass.
2. Seguir login: rollback de sesión y posterior HTTP 200; explicar inconsistencia.
3. Mostrar actor fijo en alta/finalización y solicitante del cuerpo; no enviar escrituras.
4. Mostrar estructura de log Markdown sin contenido clínico: hash no equivale a actor/acción autorizados ni inmutabilidad.
5. Recorrer amenazas de datos ajenos, archivos, IA, credenciales y pérdida; asociar mitigación y prueba.
6. Declarar dueño/riesgo residual pendientes; este informe documenta problemas, no implementa controles.

**Esperado:** distinción entre logs técnicos, accesos y responsabilidad real. **Código:** models.py; auth.py:26–42; pacientes.py:70; evaluaciones.py:197; ia_service.py:52. **Demuestra:** SE-04/07/08, PR-02/04/05, FI-04 como brechas. **Estado:** código/matriz listos; controles pendientes.

- **Evidencia que registrar:** clip/captura sin secretos, ID ficticio, fecha, status/estructura anonimizada y resultado observado frente al esperado.
- **Precauciones:** solo fixtures; no producción. Las escenas de código no autorizan escrituras para explotar vulnerabilidades. Crear/procesar/finalizar solo en la copia de ensayo posterior; descargas fuera del proyecto sin sobrescribir.


### PM-13: Contrato de error de inferencia

- **Objetivo/criterios:** AF-03/FI-02, CI/PR y H04; diferenciar error, inválida y éxito sin hallazgos.
- **Precondiciones:** entorno independiente con dobles modelo/servicio/ORM preparado posteriormente.
- **Datos ficticios:** respuesta `{valid: true, error: "fallo simulado", detections: []}`, otra valid=false y otra éxito sin hallazgos.
- **Pasos:** 1) Inyectar respuestas con dobles; 2) observar estado retornado; 3) comprobar intento de persistir éxito; 4) revisar mensaje UI; 5) contrastar reportes; 6) conservar resultado anterior hasta nuevo éxito real.
- **Esperado:** fallo explícito para error, inválida para rechazo y sin hallazgos solo tras inferencia correcta. Código actual puede fallar.
- **Evidencia:** estados y llamadas simuladas sin pacientes reales.
- **Precaución:** no monkeypatch en proceso compartido, no cambiar pesos/.env/DB del sistema. No ejecutado.

### PM-14: Aislamiento entre usuarios por objeto

- **Objetivo/criterios:** SE-01/06, PR-01/03; sesión no equivale a permiso sobre objeto.
- **Precondiciones:** usuarios ficticios A/B y superadmin, objetos distintos y política de compartición definida.
- **Datos:** IDs conocidos de fixture A/B, PDF e imagen desidentificados.
- **Pasos:** 1) GET A como A; 2) GET B como A; 3) repetir sin token; 4) repetir con token inválido; 5) usar token ya vencido sin cambiar reloj; 6) repetir detalle/PDF/upload; 7) contrastar política y filtro servidor.
- **Esperado:** 401 sin sesión válida y 403/404 sin permiso; acceso solo según política. Hoy hay rutas sin control.
- **Evidencia:** endpoint/actor/objeto/status y respuesta ficticia mínima.
- **Precaución:** solo GET conocidos en copia, sin enumeración ni PUT/PATCH/POST. No ejecutado.

### PM-15: Integridad, idempotencia y recuperación

- **Objetivo/criterios:** FI-04/05, AF/SE y H07; conservar original y consistencia tras fallo.
- **Precondiciones:** entorno independiente con temporales desechables, DB/log simulados.
- **Datos:** original ficticio/hash y reemplazo pequeño; excepciones de commit/log simuladas por separado.
- **Pasos:** 1) Registrar hash/referencia inicial; 2) simular reemplazo con commit fallido; 3) comprobar original/referencia; 4) simular guardado correcto con log fallido; 5) verificar estado coherente; 6) finalizar dos veces secuencialmente; 7) ensayar concurrencia acotada en fixtures separados y contar diagnósticos.
- **Esperado:** original conservado, sin huérfanos/duplicados ni estados incompatibles; chequeo secuencial no acredita idempotencia concurrente.
- **Evidencia:** hashes ficticios y traza simulada.
- **Precaución:** no cortar DB, borrar archivos/modelos, llenar disco o cambiar permisos reales. No ejecutado.

### PM-16: Precisión del checkpoint activo

- **Objetivo/criterios:** AF-04/05, CI/FI; vincular modelo/taxonomía/precisión requerida.
- **Precondiciones:** protocolo posterior autorizado, hash/version/configuración y conjunto independiente desidentificado anotado profesionalmente, split por paciente; sin entrenamiento.
- **Datos:** panorámicas adolescentes positivas/negativas, calidad variable y otras lesiones; inclusión/exclusión registrada.
- **Pasos:** 1) Verificar checkpoint/configuración; 2) fijar umbral y coincidencia antes de medir; 3) evaluar por clase frente a referencia; 4) informar precisión/recall/mAP cuando corresponda, sin equipararlos; 5) revisar falsos positivos/negativos con odontólogo; 6) comprobar etiquetas y scores auténticos; 7) documentar variabilidad/límites.
- **Esperado:** métricas del modelo desplegado con trazabilidad y nivel clínico acordado, sin cifra inventada.
- **Evidencia:** versión/split/tamaño/configuración y resultados por clase, sin imágenes identificables.
- **Precaución:** model.val y evaluadores guardan archivos; no ejecutarlos aquí ni usar train como test independiente. No ejecutado.

### PM-17: Hashing, sesión y recuperación

- **Objetivo/criterios:** SE-02/03/07, PR/FI; almacenamiento seguro y posesión de cuenta.
- **Precondiciones:** cuenta desechable en entorno independiente y proyección anonimizada, no listado real de hashes/sesiones.
- **Datos:** credenciales solo de ensayo, solicitud ficticia y dobles para fallo de commit.
- **Pasos:** 1) Mostrar hash_password/verify_password; 2) mostrar únicamente clasificación booleana bcrypt/algoritmo sin hash completo; 3) comprobar sesión persistida tras login; 4) simular commit fallido y exigir rechazo; 5) inspeccionar reset actual sin cambiar contraseña; 6) después de corregir en otro trabajo validar un uso/caducidad/revocación con cuenta desechable.
- **Esperado:** contraseña no legible, sesión consistente y recuperación exclusiva del titular; registrar brechas actuales.
- **Evidencia:** código y estados sin contraseña/token/.env/identificador real.
- **Precaución:** no recuperar o modificar cuentas existentes, no ejecutar migrar_password_hash.py. No ejecutado.

## SECCIÓN 8: CONCLUSIONES Y CHECKLIST FINAL

Flujo amplio y componentes reales integrados, pero no se acreditan las garantías necesarias para BUENO. **Total estimado provisional: 5.15/14.00**: AF 0.80, ED 0.60, CI 1.50, FI 0.45, SE 0.40, FL 0.80 y PR 0.60. La nota efectiva puede variar tras validación y evaluación oficial.

Fortalezas verificadas por código: ocho blueprints, flujo clínico conectado a IA/DB, validación a ambos lados, bcrypt para nuevas contraseñas, sesiones con expiración en módulos concretos, autorización de soporte/solicitudes, visor con cajas/zoom, PDF/plantilla y manual extenso. Generador PDF restringe rutas a uploads; no protege el endpoint público de archivos.

Debilidades principales: autorización clínica/administrativa incompleta; salida IA engañosa por errores tratados como éxito y porcentajes artificiales; desempeño sin medir y demora añadida. También faltan atribución real, recuperación con posesión, consistencia de archivos y trazabilidad del modelo.

Para aproximarse a 14 puntos: resolver acceso/actor/recuperación y contrato de errores; retirar contraseña recordada, porcentajes sintéticos y espera decorativa; asegurar cargas/transacciones; alinear modelo y evaluación; luego medir tiempos/carga, validar accesibilidad/autonomía y ensayar restauración. Un video no sustituye controles o precisión medida.

### Checklist de evidencias antes de grabar

- [ ] Copia totalmente ficticia y cuentas/fixtures preparados fuera del sistema auditado.
- [ ] Máximos oficiales: 1.50/2.00/2.50/1.50/2.50/1.50/2.50.
- [ ] Los 44 IDs tienen evidencia y observado, no aprobación por existencia de código.
- [ ] Sin pacientes reales, contraseñas, tokens, cabeceras sensibles o cadenas de conexión.
- [ ] Panorámica autorizada desidentificada con referencia profesional.
- [ ] Modelo/métricas de misma versión; v2.0 no acredita v2.3.
- [ ] GET sin sesión y entre objetos de ensayo; brechas registradas.
- [ ] Medición sin cortes y separada UI/HTTP/servicio, incluyendo fallos.
- [ ] Pruebas históricas identificadas, con CN-04/CB-04 fallidos.
- [ ] Ninguna propiedad pendiente se narra como demostrada.

### Checklist de funcionalidades que validar

- [ ] Login/sesión persistida/caducada/inactiva, cierre y revocación.
- [ ] Recuperación con posesión, caducidad y un uso.
- [ ] Paciente menor/apoderado/duplicado/edición parcial y actor real.
- [ ] Crear, cargar/validar, procesar, interpretar, confirmar y finalizar evaluación.
- [ ] Corrupto/vertical/TXT/HTTP fallido/red no se aceptan como validación correcta.
- [ ] Error técnico distinto de ausencia real de hallazgos.
- [ ] Cajas alineadas, scores auténticos y taxonomía clínicamente justificada.
- [ ] Diagnóstico/PDF fieles tras recarga, sin cierre vacío equivalente a revisión.
- [ ] Reintentos/concurrencia/fallos sin duplicar o destruir originales/resultados.
- [ ] Permiso servidor por rol/acción/objeto, incluidos PDF/archivos.
- [ ] Reportes separan sana/error/inválida/confirmada y fechas/denominadores coherentes.
- [ ] Teclado/foco/lector/contraste/zoom/móvil y tarea autónoma con usuarios.
- [ ] <5s por operación, throughput/recursos y carga real con resultados.
- [ ] Instalación limpia con esquema/dependencias/modelos/readiness.
- [ ] Backup/restauración probados y riesgos con responsables/residual.

### Checklist de código que conviene enseñar

- [ ] App.jsx y Layout.jsx:40,131–196: rutas y límite visual.
- [ ] Login.jsx:63–83 y auth.py:44–118,186–212: acceso/recuperación.
- [ ] security.py:4–30 y utils/auth.py:8–29: hashing/sesión.
- [ ] soporte.py:14–26 y solicitudes.py:8–16: rechazo real backend.
- [ ] pacientes.py:56–93 y validation.py:29–60: reglas/actor fijo.
- [ ] odontologos.py:155–202: actor del cuerpo/permisos.
- [ ] EvaluacionClinica.jsx:636–776,877–901,2553–2586: espera/validación/porcentajes.
- [ ] detector.py:148–178,185–281: inferencia/reparto/error valid=True.
- [ ] clip_validator.py:75–153 y cls_validator.py:54–111: paso ante fallo.
- [ ] ia_service.py:130–179,251–295: consumo/versión/persistencia/log.
- [ ] evaluaciones.py:173–278,302–430: guardar/PDF y disco/DB.
- [ ] diagnostico_pdf.py:80–85,190: ruta acotada y generación.
- [ ] reportes.py:36–82,84–178,180–246: significado/límites de métricas.
- [ ] models.py y SQL estructural: relaciones/divergencias sin datos.
- [ ] run.py de servicios, requirements IA y health.py: despliegue.
- [ ] Manual/matriz de amenazas; no afirmar autorización universal desde guía histórica.

Las abreviaturas del checklist se resuelven a las rutas exactas del inventario y de las fichas, no a archivos nuevos.

**Control de alcance:** único entregable `AUDITORIA_RUBRICA_14_PUNTOS.md`. No se modificaron archivos existentes, código, dependencias, configuración, permisos, autenticación, DB, modelos o pruebas. No se ejecutaron validaciones funcionales o acciones que alteraran datos. Mejoras y pruebas son trabajo futuro.

