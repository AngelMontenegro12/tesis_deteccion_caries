# Sistema Sonríe - Guía de Explicación para Evaluación de Tesis

Este documento detalla la arquitectura del sistema, sus módulos y proporciona una guía paso a paso sobre cómo evidenciar cada punto de la rúbrica de evaluación durante la demostración en video.

## 1. Arquitectura y Módulos del Sistema

El "Sistema Sonríe" está estructurado bajo una arquitectura cliente-servidor con integración de inteligencia artificial para la detección de caries y lesiones odontológicas.

*   **Frontend (Interfaz de Usuario)**: Desarrollado con tecnologías web modernas (Vite, React, Tailwind CSS). Es el módulo con el que interactúa el odontólogo o paciente. Permite la carga de radiografías, visualización de resultados y gestión de pacientes.
*   **Backend (Servidor y Lógica de Negocio)**: Construido en Python utilizando el framework Flask y SQLAlchemy. Expone una API RESTful que sirve al Frontend. Gestiona la autenticación, el procesamiento de solicitudes, el almacenamiento de datos en la base de datos y coordina con el módulo de IA.
*   **Módulo de Inteligencia Artificial (IA)**: Utiliza modelos de visión computacional basados en YOLOv8 (ej. `yolov8s.pt`), entrenados específicamente con el dataset DENTEX Challenge 2023. El modelo de producción (v1.3 Mejorado) detecta 3 clases críticas: *Caries (Incipiente)*, *Deep Caries (Avanzada)* y *Periapical Lesion (Moderada)*. Este módulo procesa las imágenes y devuelve las coordenadas (bounding boxes) y el diagnóstico sugerido.
*   **Base de Datos**: Sistema de gestión de base de datos relacional (estructurado en `bd_detec_caries_tablas.sql`) que almacena la información de pacientes, historiales clínicos, resultados de diagnósticos y credenciales de usuarios.

---

## 2. Guía para el Video: Evidenciando la Rúbrica

A continuación, se detalla qué mostrar y decir en el video para asegurar el puntaje en cada criterio de la rúbrica.

### Dimensión 1: Adecuación funcional

*   **N° 1 - Correspondencia con el objetivo (1 pto)**:
    *   **Qué mostrar**: La pantalla inicial del sistema y el flujo de carga de una radiografía para detección de caries.
    *   **Qué decir**: *"El objetivo principal del proyecto es detectar caries en radiografías dentales mediante IA. Como se observa en la pantalla principal, el núcleo del sistema está diseñado exactamente para esto: subir una imagen y obtener un diagnóstico automático, cumpliendo con el alcance de la tesis."*
*   **N° 2 - Completar flujo de inicio a fin (1 pto)**:
    *   **Qué mostrar**: Realiza un flujo completo en vivo: Iniciar sesión -> Seleccionar/Crear paciente -> Subir radiografía -> Ejecutar análisis -> Ver y guardar el resultado.
    *   **Qué decir**: *"A continuación, realizaré el flujo completo. [Ejecutar acciones]. Como pueden ver, el escenario principal se completa de inicio a fin sin depender de módulos externos o funciones no implementadas."*
*   **N° 3 - Resultados coherentes (1 pto)**:
    *   **Qué mostrar**: Muestra una radiografía de prueba donde se sepa de antemano dónde están las caries. Sube la imagen y muestra los cuadros delimitadores que dibuja la IA.
    *   **Qué decir**: *"Utilizaré esta imagen de prueba que contiene una caries profunda conocida. Al procesarla, el sistema genera resultados coherentes, identificando correctamente la región afectada con sus bounding boxes, validando así la salida esperada."*

### Dimensión 2: Interacción y usabilidad

*   **N° 4 - Claridad en la interfaz (1 pto)**:
    *   **Qué mostrar**: Resalta los botones principales en la interfaz del frontend.
    *   **Qué decir**: *"La interfaz es limpia e intuitiva. Los botones de acción son visibles y el flujo de navegación guía al usuario paso a paso sin confusión para completar el análisis."*
*   **N° 5 - Retroalimentación comprensible (1 pto)**:
    *   **Qué mostrar**: Muestra un estado de carga (spinner) mientras la IA procesa la imagen, o un mensaje de confirmación al guardar un diagnóstico.
    *   **Qué decir**: *"Durante el procesamiento, el sistema muestra un indicador de carga. Al finalizar o guardar un registro, despliega mensajes de confirmación, manteniendo al usuario informado del estado de sus acciones."*
*   **N° 6 - Uso sin dificultades (1 pto)**:
    *   **Qué mostrar**: Navega de forma fluida y natural por la aplicación.
    *   **Qué decir**: *"El diseño centrado en el usuario permite completar la tarea rápidamente, sin obstáculos, pantallas confusas o errores de diseño que impidan el uso del núcleo funcional."*

### Dimensión 3: Fiabilidad

*   **N° 7 - Estabilidad (1 pto)**:
    *   **Qué mostrar**: Procesa 2 o 3 imágenes seguidas rápidamente.
    *   **Qué decir**: *"El núcleo funcional se ejecuta de manera estable. Puedo procesar múltiples radiografías de forma continua sin que la aplicación colapse o presente fallos críticos."*
*   **N° 8 - Control de errores (1 pto)**:
    *   **Qué mostrar**: Intenta subir un archivo que no sea imagen (ej. un .pdf) o intenta analizar sin haber seleccionado una imagen.
    *   **Qué decir**: *"El sistema controla adecuadamente errores previsibles. Si intento subir un formato no válido o realizar una acción incompleta, el sistema me detiene con un mensaje de error claro en lugar de romperse."*
*   **N° 9 - Persistencia de información (1 pto)**:
    *   **Qué mostrar**: Guarda el resultado de un análisis, ve a la lista de pacientes, abre el perfil del paciente y muestra que el historial está guardado.
    *   **Qué decir**: *"Una vez generado el diagnóstico, procedemos a guardarlo. Al revisar el historial clínico del paciente, verificamos que la información procesada se conservó correctamente en la base de datos."*

### Dimensión 4: Desempeño

*   **N° 10 - Tiempo de respuesta aceptable (1 pto)**:
    *   **Qué mostrar**: El lapso real desde que se da clic a "Analizar" hasta que sale el resultado en pantalla.
    *   **Qué decir**: *"El procesamiento de la imagen a través del modelo YOLOv8 en el backend toma escasos segundos, un tiempo de respuesta altamente aceptable para una primera versión funcional y útil en consulta."*
*   **N° 11 - Ejecución continua sin bloqueos (1 pto)**:
    *   **Qué mostrar**: Navegar entre distintas secciones (Historial, Nuevo Análisis) rápidamente después de analizar.
    *   **Qué decir**: *"El producto responde adecuadamente durante la ejecución continua del escenario. La comunicación entre Frontend y Backend es ágil, sin bloqueos críticos en la interfaz."*

### Dimensión 5: Seguridad y protección

*   **N° 12 - Control de acceso (1 pto)**:
    *   **Qué mostrar**: La pantalla de Login inicial o el cierre de sesión.
    *   **Qué decir**: *"El acceso y las operaciones están controlados mediante autenticación de usuarios. Solo el personal odontológico registrado puede ingresar al sistema."*
*   **N° 13 - Protección de datos (1 pto)**:
    *   **Qué mostrar**: Muestra cómo los diagnósticos están estrictamente asociados a su paciente.
    *   **Qué decir**: *"Los datos médicos e historiales clínicos reciben protección acorde a su naturaleza. La API en el backend valida que un usuario solo acceda y modifique la información que le corresponde."*
*   **N° 14 - Evitar operaciones no autorizadas (1 pto)**:
    *   **Qué mostrar**: Explica cómo el backend protege las rutas (ej. mediante tokens JWT u otro método implementado).
    *   **Qué decir**: *"El sistema evita operaciones no autorizadas. Por ejemplo, el backend rechaza cualquier petición a sus endpoints si no contiene un token de sesión válido, evitando alteraciones directas."*

### Dimensión 6: Evidencia de desarrollo

*   **N° 15 - Versión ejecutable (1 pto)**:
    *   **Qué mostrar**: El sistema corriendo en tu navegador (`localhost` u host remoto). Menciona el código fuente.
    *   **Qué decir**: *"Existe una versión ejecutable y operativa del núcleo funcional evaluado, corriendo en este entorno. Asimismo, el código cuenta con un repositorio versionado."*
*   **N° 16 - Organización técnica coherente (1 pto)**:
    *   **Qué mostrar**: Muestra rápidamente la estructura de carpetas en tu editor (VS Code): `backend`, `frontend`, `api_ia_sonrie`.
    *   **Qué decir**: *"La implementación presenta una organización modular coherente. Contamos con carpetas separadas para el Frontend en React, el Backend en Flask, y un módulo dedicado para los modelos de IA, respetando buenas prácticas."*
*   **N° 17 - Artefactos del proceso (1 pto)**:
    *   **Qué mostrar**: Muestra el archivo `documentacion_modelos_tesis.md` u otro artefacto de diseño (diagrama de base de datos `bd_detec_caries_tablas.sql`).
    *   **Qué decir**: *"La funcionalidad desarrollada está respaldada por artefactos técnicos, como este documento que registra exhaustivamente las iteraciones, oversampling y métricas de rendimiento del modelo de IA."*

### Dimensión 7: IA o componente inteligente

*   **N° 18 - IA Integrada y Operativa (1 pto)**:
    *   **Qué mostrar**: El funcionamiento principal en la web de subida y detección (Bounding boxes visibles en la imagen subida).
    *   **Qué decir**: *"El componente de Inteligencia Artificial (modelo YOLOv8) no está aislado, sino completamente integrado a la aplicación web mediante una API propia, operativo de principio a fin en el escenario evaluado."*
*   **N° 19 - Resultados pertinentes y validados (1 pto)**:
    *   **Qué mostrar**: Una referencia visual a la precisión de las detecciones o al reporte de métricas en tu documento de modelos.
    *   **Qué decir**: *"El resultado generado es pertinente. El modelo V1.3 alcanzó una precisión del 64.17%, enfocándose en clasificar con alta fiabilidad las lesiones de Caries y Lesión Periapical, descartando falsos positivos."*
*   **N° 20 - Gestión de riesgos de la IA (1 pto)**:
    *   **Qué mostrar**: Muestra si hay un aviso de soporte clínico en la interfaz, o la opción de editar/rechazar el diagnóstico antes de guardarlo.
    *   **Qué decir**: *"Se gestionaron los riesgos inherentes de la IA (ej. diagnósticos erróneos). El sistema está concebido como una herramienta de soporte (second opinion); el flujo requiere que el odontólogo revise y valide visualmente los resultados propuestos antes de confirmar el registro."*
