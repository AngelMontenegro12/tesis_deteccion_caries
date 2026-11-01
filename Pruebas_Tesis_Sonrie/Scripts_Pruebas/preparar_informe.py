"""Genera documentación de planificación. No importa ni ejecuta el sistema."""
from pathlib import Path
import csv
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
cases = []
def case(code, name, objective, component, procedure, inputs, expected, source, conditions=''):
    cases.append(dict(code=code, name=name, objective=objective, component=component, procedure=procedure, inputs=inputs, expected=expected, source=source, conditions=conditions))

case('CN-01','Inicio de sesión exitoso','Verificar el acceso de un odontólogo activo con credenciales válidas.','Inicio de sesión y panel principal',
'1. En una sesión de navegador sin usuario almacenado, abrir el inicio de sesión.\n2. Ingresar las credenciales de la cuenta de pruebas activa, con IP sin bloqueo.\n3. Pulsar Iniciar sesión.\n4. Comprobar la navegación al panel y la identidad mostrada.',
'Correo y contraseña válidos de una cuenta de pruebas autorizada; no incluir contraseñas en evidencias.',
'Acceso al panel /dashboard; respuesta de inicio de sesión 200 y usuario almacenado en localStorage. La creación de sesión y auditoría debe verificarse por separado si corresponde: el código puede devolver éxito aunque falle su persistencia.',
'frontend/src/pages/Login.jsx → handleSubmit; backend/app/routes/auth.py → login; POST /api/auth/login.')
case('CN-02','Registro de paciente','Verificar el alta y la consulta de un paciente con datos válidos.','Pacientes',
'1. Acceder con una cuenta de pruebas.\n2. Abrir Pacientes y Nuevo paciente.\n3. Completar los campos y guardar.\n4. Buscar el DNI en el listado.\n5. Recargar y comprobar que permanece disponible.',
'Datos sintéticos propuestos: Ana Prueba Sonrie, DNI 87654321, nacimiento 1990-01-15, género F, teléfono 912345678, correo ana.prueba@example.com. Confirmar en la fase de ejecución que el DNI esté libre; usar otro identificador sintético si existe.',
'Alta 201 y aparición del paciente activo en el listado tras recargar. DNI duplicado debe producir 409. Se requiere que exista el odontólogo con ID 1 por la asignación fija del backend.',
'frontend/src/components/ModalNuevoPaciente.jsx → validateForm y handleSubmit; backend/app/routes/pacientes.py → crear_paciente y listar_pacientes; POST y GET /api/pacientes.')
case('CN-03','Detección de caries','Verificar el flujo de análisis y la presentación de hallazgos.','Evaluación clínica y microservicio de IA',
'1. Seleccionar un paciente sintético autorizado.\n2. Completar tipo de visita y motivo.\n3. Cargar una panorámica humana de referencia anonimizada.\n4. Continuar y ejecutar el análisis en la futura fase autorizada.\n5. Revisar resultados, clases, confianza y superposición de recuadros; comparar su correspondencia con los hallazgos devueltos.',
'Paciente de pruebas; motivo Evaluación de prueba; archivo panorámico decodificable, con tamaño posterior al recorte ≥300×100 y relación ancho/alto ≥1,25. Elegir una imagen de referencia con hallazgos conocidos y registrar versión y umbral efectivos del modelo.',
'Para una imagen aceptada se muestran los resultados de IA y los recuadros correspondientes a las detecciones devueltas. Si no hay detecciones, la lista puede estar vacía: una imagen válida no garantiza detecciones positivas. Este caso verifica el software, no acredita exactitud clínica.',
'frontend/src/pages/EvaluacionClinica.jsx; frontend/src/components/BoundingBoxViewer.jsx; backend/app/routes/evaluaciones.py → procesar_evaluacion; backend/app/services/ia_service.py → procesar_radiografia_con_ia; api_ia_sonrie/app/services/detector.py → run_inference; POST /api/evaluaciones/{id}/procesar y POST /api/predict.')
case('CN-04','Carga de archivo inválido','Comprobar la respuesta visible a archivos incompatibles y a la ausencia de imagen.','Carga y validación de radiografías',
'1. Llegar al paso de radiografías.\n2. Intentar continuar sin archivo.\n3. En intentos independientes, seleccionar o arrastrar un archivo no imagen, una imagen dañada y una imagen no panorámica.\n4. Registrar mensajes y disponibilidad de Continuar en cada variante.\n5. Reservar el fallo de red para un entorno aislado y una ejecución posterior autorizada.',
'Sin archivo; documento TXT o PDF; archivo con MIME image/* y contenido corrupto; imagen vertical; fotografía no dental. Preparar estos archivos posteriormente, sin usar datos personales.',
'Sin radiografía completa, Continuar permanece deshabilitado. Un rechazo semántico normal con valid=false muestra un mensaje e impide incorporar el archivo. Diferencia detectada: ante HTTP no exitoso o excepción de red, validateImage devuelve true, por lo que el rechazo universal de incompatibles no está garantizado.',
'frontend/src/pages/EvaluacionClinica.jsx → validateImage, handleFileChange, handleDrop y getIsNextDisabled; api_ia_sonrie/app/utils/image_utils.py → process_image; POST /api/validate.')
case('CN-05','Guardado y consulta del diagnóstico','Verificar que el diagnóstico final y sus resultados puedan consultarse nuevamente.','Finalización e historial de evaluaciones',
'1. Usar una evaluación de pruebas con análisis terminado.\n2. Redactar un diagnóstico sintético y finalizar.\n3. Anotar el ID de evaluación.\n4. Abrir el historial, localizar el mismo ID y abrir su detalle.\n5. Recargar y contrastar paciente, texto, estado, radiografías y detecciones.\n6. Registrar por separado cualquier divergencia.',
'Evaluación de CN-03; texto Diagnóstico de prueba para verificación funcional; plan de tratamiento sintético y observaciones identificadas como prueba.',
'Finalización 200, estado completada y diagnóstico persistente en el detalle y el historial tras recargar. Repetir la finalización de una evaluación completada con diagnóstico existente devuelve el existente sin duplicarlo. Si hay múltiples resultados por imagen, revisar la selección: detalle no ordena su SELECT de resultados, mientras PDF elige el último ID.',
'frontend/src/pages/EvaluacionClinica.jsx → handleFinishDiagnosis; frontend/src/pages/HistorialEvaluaciones.jsx; frontend/src/pages/EvaluacionDetalle.jsx; backend/app/routes/evaluaciones.py → completar_evaluacion, obtener_evaluaciones y obtener_evaluacion_detalle; PUT o POST /api/evaluaciones/{id}/completar; GET /api/evaluaciones y GET /api/evaluaciones/{id}/detalle.')
case('CB-01','Rutas del inicio de sesión','Evaluar las decisiones internas de validación y autenticación.','Autenticación Flask y validación React',
'1. Preparar en una fase posterior dobles de Odontologo, sesión y verificación de contraseña; aislar IP y contador.\n2. Evaluar cada variante con el cliente Flask y revisar la rama alcanzada.\n3. Contrastar las validaciones de handleSubmit con las del servidor.\n4. Registrar respuesta y llamadas a las dependencias simuladas.',
'JSON vacío; correo o contraseña ausentes; correo usuario-sin-arroba; correo válido inexistente; usuario inactivo; usuario activo con clave errónea; usuario activo con clave correcta. Mantener contador aislado para no confundir 401 con 429.',
'Campos ausentes →400; correo inválido →400; usuario inexistente o inactivo →401; contraseña incorrecta →401 antes del umbral; credenciales correctas →200 y reinicio del contador. Los rechazos de campos vacíos y correo no incrementan intentos. La validación HTML puede impedir enviar datos inválidos desde la interfaz.',
'backend/app/routes/auth.py → login y _registrar_acceso; backend/app/utils/validation.py → valid_email; backend/app/utils/security.py → verify_password; frontend/src/pages/Login.jsx → handleSubmit; POST /api/auth/login.',
'IP bloqueada antes de validar datos; presencia de correo y contrasena; valid_email; consulta con activo=True; existencia del usuario; resultado de verify_password; commit o rollback de sesión y auditoría. La excepción de persistencia en login exitoso se captura y aun así se responde 200.')
case('CB-02','Bloqueo por intentos fallidos','Evaluar el umbral, duración, alcance y reinicio del bloqueo.','Control de acceso por IP en memoria',
'1. Preparar contador aislado y reloj simulado, sin esperar ni bloquear una IP real.\n2. Simular cinco fallos consecutivos para una misma IP, tanto por usuario inexistente como por clave errónea.\n3. Intentar credenciales correctas mientras el bloqueo siga vigente.\n4. Situar el reloj justo antes y exactamente en el vencimiento.\n5. Evaluar éxito previo al umbral y otra IP.',
'MAX_INTENTOS=5; TIEMPO_BLOQUEO=300 segundos; IP A e IP B ficticias; fallos 1 a 5; tiempo t<vencimiento, t=vencimiento y t>vencimiento; credenciales correctas.',
'Fallos 1–4 →401; quinto fallo →429 y bloqueado_hasta=tiempo+300; cualquier solicitud de esa IP antes del vencimiento →429, incluso con clave correcta. En el vencimiento se reinicia el registro y se evalúan credenciales. Éxito reinicia contador; otra IP tiene contador independiente.',
'backend/app/routes/auth.py → intentos_login, MAX_INTENTOS, TIEMPO_BLOQUEO y login; POST /api/auth/login.',
'Registro de IP nuevo o existente; bloqueo vigente o vencido; contador <5 o ≥5; ambos caminos de fallo; reinicio por éxito. No existe ventana temporal para acumular los fallos previos al bloqueo; el estado no es persistente y se comparte solo dentro del proceso, no entre trabajadores independientes.')
case('CB-03','Validación interna de datos del paciente','Evaluar formatos, límites y reglas relacionadas del paciente.','Validadores y rutas de pacientes',
'1. Preparar llamadas aisladas a los validadores y una matriz de valores.\n2. Variar un campo por vez manteniendo los demás válidos.\n3. Evaluar patient_error en creación y actualización con campos combinados.\n4. Simular consultas para DNI repetido.\n5. Comparar con validateForm y validateField de la interfaz.',
'DNI: 8 dígitos, 7, 9 y letras. Teléfono: 9 dígitos iniciados en 9; inicio distinto, longitud incorrecta y vacío. Correo: vacío, válido e inválido. Fecha: 1899-12-31, 1900-01-01, hoy, mañana y fecha imposible. Menor de 18, cumpleaños número 18 y adulto; apoderado ausente o completo.',
'DNI y teléfono válidos según sus expresiones regulares; correo opcional, pero válido si se informa; fecha real ISO entre 1900 y hoy, inclusive. Menores requieren apoderado y teléfono válido. Error de validación →400; duplicado →409; alta válida →201; actualización válida →200. El primer error oculta los posteriores, por lo que las variantes se aíslan.',
'backend/app/utils/validation.py → valid_dni, valid_phone, valid_email, valid_date y patient_error; backend/app/routes/pacientes.py → crear_paciente y actualizar_paciente; frontend/src/utils/validation.js; frontend/src/components/ModalNuevoPaciente.jsx → validateForm; frontend/src/pages/EvaluacionClinica.jsx → validateField; POST /api/pacientes y PUT /api/pacientes/{id}.',
'Tipo cadena y trim; fullmatch; rango de fechas; nombres y apellidos de mínimo 2 caracteres; género M/F/Otro; cálculo de minoría de edad; correo opcional; teléfono del apoderado si está presente; mezcla con current al actualizar; DNI repetido excluyendo el paciente actual. Usar reloj controlado para límites dependientes de hoy.')
case('CB-04','Rutas de validación de imágenes','Evaluar las capas de validación y sus caminos de aceptación y rechazo.','Validación React y FastAPI e inferencia',
'1. Preparar dobles de modelos y archivos sin cargar los pesos reales en pruebas unitarias.\n2. Evaluar MIME, decodificación, recorte, tamaño y relación de aspecto con casos límite.\n3. Simular aceptación, rechazo y fallo de CLIP y del clasificador.\n4. Evaluar /validate y /predict por separado.\n5. Examinar el manejo de HTTP fallido y error de red del cliente.',
'MIME no image/*; bytes corruptos; imagen post-recorte 299×100 y 300×100; alturas 99 y 100; proporciones 1,24 y 1,25 con tamaño suficiente; panorámica; foto no dental; respuestas de modelo simuladas; modelo detector no disponible.',
'MIME incompatible →HTTP 400; rechazo normal de capas →JSON valid=false (normalmente HTTP 200); aceptación →valid=true. Tamaño mínimo 300×100 y proporción mínima 1,25 inclusivos. /predict produce detecciones tras validar; /validate no ejecuta la detección. Modelo detector ausente provoca RuntimeError en run_inference antes de validar.',
'frontend/src/pages/EvaluacionClinica.jsx → validateImage, handleFileChange, handleDrop y getIsNextDisabled; api_ia_sonrie/app/routes/predict.py → validate_only y predict_image; api_ia_sonrie/app/utils/image_utils.py → process_image; api_ia_sonrie/app/services/detector.py → validar_capa0, _check_decodificable, _recortar_bordes_negros, _check_tamanio_minimo, _check_ratio_basico y run_inference; api_ia_sonrie/app/utils/clip_validator.py → validar_con_clip; api_ia_sonrie/app/utils/cls_validator.py → validar_con_clasificador; POST /api/validate y /api/predict.',
'Cadena MIME; decodificación; límites después del recorte; retornos anticipados de cada capa; score y clase predicha de CLIP y clasificador respecto a sus umbrales configurados; dependencias no disponibles o excepciones dejan pasar. validateImage acepta HTTP no exitoso y excepciones. La ruta Flask subir_radiografias guarda archivos sin repetir estas validaciones, por lo que la interfaz no constituye una barrera del servidor.')
case('CB-05','Generación del diagnóstico PDF','Evaluar precondiciones de descarga y tratamiento de errores del generador.','Diagnóstico y reporte PDF',
'1. Preparar entidades y consultas simuladas para cada precondición.\n2. Evaluar ID inexistente, evaluación pendiente, diagnóstico ausente y paciente ausente.\n3. Evaluar una evaluación completada válida con y sin radiografías.\n4. Simular dependencia ausente y fallo de generación.\n5. En ejecución posterior, validar tipo de contenido, nombre y legibilidad del PDF y estado del botón en el detalle.',
'ID inexistente; evaluación pendiente; completada sin diagnóstico; completada sin paciente; completada con diagnóstico y paciente; lista de radiografías vacía o poblada; excepción ModuleNotFoundError con name=pymupdf; excepción genérica.',
'Evaluación ausente →404; estado distinto de completada →409; diagnóstico o paciente ausente →404; falta de pymupdf →503; otros fallos de generación →500; caso válido →200 application/pdf con descarga diagnostico_{nombre}.pdf. El botón del detalle se deshabilita si falta diagnóstico o la evaluación no está completada. No se exige tener radiografías ni odontólogo encontrado para entrar al generador.',
'backend/app/routes/evaluaciones.py → descargar_diagnostico_pdf; backend/app/services/diagnostico_pdf.py → generar_pdf_diagnostico; frontend/src/pages/EvaluacionDetalle.jsx → handleDownloadPdf y disabled del botón; frontend/src/utils/downloadDiagnosticoPdf.js; GET /api/evaluaciones/{id}/pdf.',
'Existencia de evaluación; estado completada; último diagnóstico por fecha e ID; existencia de paciente; radiografías presentes o ausentes; último resultado por radiografía; excepciones específicas y genéricas. La plantilla de referencia y PyMuPDF son dependencias del reporte. La finalización acepta texto vacío y lo sustituye por Sin diagnostico redactado; no hay una condición que exija hallazgos positivos para descargar.')

doc=Document()
sec=doc.sections[0]
sec.page_height=Cm(29.7); sec.page_width=Cm(21)
sec.top_margin=sec.bottom_margin=Cm(2)
sec.left_margin=sec.right_margin=Cm(2.3)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3']:
    st=doc.styles[name]; st.font.name='Calibri'; st.font.color.rgb=RGBColor(0,0,0)
doc.styles['Normal'].font.size=Pt(11)
doc.styles['Normal'].paragraph_format.space_after=Pt(6)
doc.styles['Normal'].paragraph_format.line_spacing=1.08
doc.styles['Title'].font.size=Pt(24)
doc.styles['Heading 1'].font.size=Pt(17)
doc.styles['Heading 2'].font.size=Pt(14)
doc.core_properties.title='Plan de pruebas del Sistema Sonríe'
doc.core_properties.subject='Fase 1 de preparación de pruebas de caja negra y caja blanca'
doc.add_paragraph('Plan de pruebas del Sistema Sonríe','Title')
doc.add_paragraph('Pruebas de caja negra y caja blanca','Subtitle')
doc.add_paragraph('Fase 1 de preparación documental | 31 de octubre de 2026')
doc.add_heading('1 Introducción',1)
doc.add_paragraph('El Sistema Sonríe es una aplicación web de apoyo a la detección y clasificación de caries dentales a partir de radiografías panorámicas. Este plan establece diez casos para verificar sus principales flujos y las decisiones internas que los sustentan. La preparación se basa en lectura estática del código; la ejecución y la captura de evidencias se realizarán en una fase posterior autorizada.')
doc.add_heading('2 Objetivo de las pruebas',1)
doc.add_paragraph('Verificar el funcionamiento observable de autenticación, registro de pacientes, análisis de imágenes y consulta de diagnósticos, así como las condiciones internas de validación, bloqueo y generación de PDF. Se documentarán los resultados reales frente a los criterios esperados sin alterar el sistema para ajustarlo a los casos. Estos casos no miden rendimiento diagnóstico clínico ni acreditan cobertura de código.')
doc.add_heading('3 Entorno de pruebas',1)
doc.add_paragraph('Arquitectura identificada: frontend React 18 con Vite 5; backend Flask con SQLAlchemy y MySQL; microservicio FastAPI con YOLO, OpenCV, CLIP y un clasificador de panorámicas; generación PDF mediante PyMuPDF y plantilla de referencia. Los manifiestos indican dependencias, sin acreditar versiones instaladas.')
doc.add_paragraph('Servicios locales declarados por el responsable: interfaz en localhost:3000, backend en localhost:5000 y microservicio en localhost:8000. Su disponibilidad no se ha comprobado. Antes de ejecutar se registrarán sistema operativo, navegador y versión, revisión del código, versiones instaladas, configuración efectiva del modelo, umbrales y conjunto de imágenes.')
doc.add_paragraph('Herramientas previstas: navegador y sus herramientas de desarrollo para caja negra; cliente de pruebas Flask, unittest y unittest.mock para ramas internas; cliente de pruebas FastAPI para las rutas de IA; ejecutor de pruebas de Node para los validadores JavaScript existentes. La cobertura podrá medirse después con una herramienta disponible y autorizada; no se declara ninguna cobertura en esta fase.')
doc.add_paragraph('Condiciones de ejecución futura: autorización previa, entorno aislado y datos sintéticos o imágenes anonimizadas. Iniciar sesión escribe sesiones y auditoría; registrar, analizar y finalizar modifica datos y archivos. La carga puede reemplazar o eliminar radiografías existentes y el reprocesamiento elimina resultados previos. No usar evaluaciones reales para estas pruebas. No se instalaron dependencias ni se ejecutaron pruebas durante esta preparación.')
for index,c in enumerate(cases):
    doc.add_page_break()
    if index==0: doc.add_heading('4 Pruebas de caja negra',1)
    if index==5: doc.add_heading('5 Pruebas de caja blanca',1)
    doc.add_heading(c['code']+' '+c['name'],2)
    def field(label,value):
        p=doc.add_paragraph(); p.add_run(label+' ').bold=True; p.add_run(value)
    field('Código de prueba',c['code'])
    field('Nombre de la prueba',c['name'])
    field('Objetivo',c['objective'])
    field('Componente o módulo evaluado',c['component'])
    field('Precondición','Ejecución futura autorizada y entorno de pruebas aislado; dependencias disponibles o simuladas según el alcance.')
    field('Procedimiento',c['procedure'])
    field('Datos de entrada',c['inputs'])
    field('Resultado esperado',c['expected'])
    field('Función o ruta del código evaluada' if c['conditions'] else 'Trazabilidad del caso',c['source'])
    if c['conditions']: field('Condiciones internas que deben comprobarse',c['conditions'])
    field('Resultado obtenido','Pendiente de ejecución')
    field('Estado de la prueba','No ejecutado')
    field('Evidencia','Pendiente de captura')
    field('Destino previsto de evidencia',('Evidencias_Caja_Blanca/' if c['conditions'] else 'Evidencias_Caja_Negra/')+c['code']+'_descripcion_fecha.ext; registrar variante, entrada anonimizada y respuesta observada.')
doc.add_page_break()
doc.add_heading('6 Resumen de resultados',1)
doc.add_paragraph('Los diez casos están preparados y no ejecutados. Este registro no representa aprobación ni rechazo. No se han calculado porcentajes ni métricas de cobertura.')
t=doc.add_table(rows=1, cols=3); t.autofit=False
for cell,title in zip(t.rows[0].cells,['Código','Prueba','Estado']):
    cell.text=title
    sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),'E7E6E6'); cell._tc.get_or_add_tcPr().append(sh)
repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
for c in cases:
    for cell,val in zip(t.add_row().cells,[c['code'],c['name'],'No ejecutado']): cell.text=val
for row in t.rows:
    for cell,width in zip(row.cells,[1.8,10,4.6]):
        cell.width=Cm(width)
        tcpr=cell._tc.get_or_add_tcPr(); borders=OxmlElement('w:tcBorders')
        for edge in ['top','left','bottom','right']:
            e=OxmlElement('w:'+edge); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'4'); e.set(qn('w:color'),'D9D9D9'); borders.append(e)
        tcpr.append(borders)
doc.add_heading('6 1 Observaciones para la ejecución',2)
for txt in [
'El bloqueo es por IP y en memoria durante 300 segundos. Los campos vacíos y correos inválidos no incrementan el contador. Debe evitarse bloquear la IP de uso cotidiano.',
'La validación de imágenes admite ciertos fallos internos y de comunicación. La carga Flask no replica el filtro semántico. Se registrará esta diferencia sin atribuirle un resultado de ejecución.',
'La generación PDF depende del estado completada y del diagnóstico guardado; no requiere detecciones positivas ni radiografías. La finalización sustituye el diagnóstico vacío por un texto predeterminado.',
'Algunas rutas asignan id_odontologo=1. El ID debe existir en el entorno aislado; la cuenta iniciada no determina esa asignación.',
'Se identificaron pruebas existentes en backend/tests/test_validation.py, test_pdf_endpoint.py, test_diagnostico_pdf.py y frontend/src/utils/validation.test.js. No se ejecutaron. Su aislamiento y efectos secundarios deben revisarse antes de reutilizarlas.',
'La lectura del código no prueba que una rama funcione en ejecución. Cada variante de caja blanca requerirá registro propio y evidencia de la rama; no se afirmará cobertura de sentencias, decisiones o caminos sin medición.'
]: doc.add_paragraph(txt)
doc.add_heading('7 Conclusiones',1)
doc.add_paragraph('Pendiente de completar después de ejecutar las pruebas. Se consignarán los casos aprobados, fallidos o bloqueados, las diferencias observadas, sus evidencias y las limitaciones de la evaluación. En esta fase no se emite una conclusión sobre la calidad o conformidad funcional del sistema.')
doc.save(ROOT/'Informe_Pruebas_Sonrie.docx')
with (ROOT/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f); w.writerow(['Codigo','Tipo','Nombre','Resultado obtenido','Estado','Evidencia'])
    for c in cases: w.writerow([c['code'],'Caja blanca' if c['conditions'] else 'Caja negra',c['name'],'Pendiente de ejecución','No ejecutado','Pendiente de captura'])
print('Documento y CSV preparados; no se ejecutaron pruebas del sistema.')
