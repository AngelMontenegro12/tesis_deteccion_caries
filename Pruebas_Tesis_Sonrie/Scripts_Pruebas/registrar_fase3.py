"""Actualiza cinco fichas de caja blanca conservando caja negra y sus imágenes."""
from pathlib import Path
from datetime import datetime
from collections import Counter
import json,csv,hashlib,shutil
from docx import Document
from docx.shared import Cm,Pt
from docx.enum.text import WD_BREAK

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'Evidencias_Caja_Blanca'
summary=json.loads((OUT/'Resumen_Caja_Blanca.json').read_text(encoding='utf-8'))
baseline=json.loads((OUT/'Integridad_Caja_Negra_antes_actualizar.json').read_text(encoding='utf-8'))
assert summary['variantes_totales']==111 and summary['fallidas']==3
backup=ROOT/'Scripts_Pruebas'/'Respaldos'/('Fase3_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
for name in ['Informe_Pruebas_Sonrie.docx','Resultados_Pruebas.csv']:shutil.copy2(ROOT/name,backup/name)
details={
'CB-01':{
'result':'11 variantes aprobadas. El cliente Flask en memoria devolvió 400 ante credenciales ausentes o correo inválido, 401 ante usuario inexistente o contraseña incorrecta y 200 ante credenciales ficticias correctas. Se comprobaron filtro activo=True, ausencia de incremento de intentos por errores de formato y rollback simulado ante fallos de persistencia y auditoría.',
'data':'JSON vacíos o incompletos, correo sin arroba, usuario ficticio cuenta@example.test, claves exclusivamente sintéticas y hash bcrypt generado en memoria. Sesion, HistorialAcceso, Odontologo y db.session sustituidos por dobles. No se utilizaron las credenciales reales compartidas por el responsable.',
'expected':'400 para datos ausentes o correo inválido; 401 para usuario ausente o clave incorrecta antes del umbral; 200 para credenciales simuladas correctas. Verificar activo=True, contador sin cambios por errores de formato y rollback cuando falla el commit simulado.',
'conditions':'Presencia de datos, formato de correo, usuario existente y activo, resultado de verify_password, éxito y fallo de commit; error de auditoría al fallar la contraseña. Se ejecutaron login, _registrar_acceso y valid_email con verify_password real y bcrypt; no se abrió una conexión ORM.',
'note':'La rama existente devuelve HTTP 200 aunque falle el commit del login exitoso. Esa variante aprobó la verificación de la rama implementada, pero no certifica que se persista la sesión. La consulta de usuario inactivo comparte la condición de consulta sin resultado; se comprobó el filtro activo=True, sin integrar una base real.',
'limits':'No se ensayó el navegador ni la base de datos real. Los decoradores Flask y los cuerpos originales se compilaron sobre un Blueprint de pruebas, sin importar create_app ni el módulo ORM.'},
'CB-02':{
'result':'9 variantes aprobadas. Ambos caminos de fallo devolvieron [401,401,401,401,429]. Credenciales correctas durante el bloqueo devolvieron 429. En el vencimiento exacto y después se reinició el registro antes de evaluar el siguiente intento. El éxito previo al umbral reinició el contador; otra IP simulada permaneció independiente. La duración calculada fue 300 segundos, sin espera real.',
'data':'Contador nuevo por escenario, time.time sustituido por reloj controlado: 1000, 1299, 1300, 1301 y 100000. REMOTE_ADDR ficticio 192.0.2.44 y 192.0.2.45 en el cliente Flask de memoria. MAX_INTENTOS=5 y TIEMPO_BLOQUEO=300 del entorno de ensayo, iguales a las constantes del código inspeccionado.',
'expected':'Primeros cuatro fallos 401 y quinto 429. Bloqueo antes de t=1300 con HTTP 429. A t=1300 y después, reiniciar contador y evaluar credenciales; tras un nuevo fallo devolver 401 con intentos=1. Éxito reinicia a cero; otra IP no hereda bloqueo.',
'conditions':'Contador por IP, usuario ausente y contraseña errónea, comparación estricta antes del vencimiento e inclusiva al vencer, duración, reinicio tras éxito y separación de IP. Se ejecutó login con contador y reloj locales a cada variante.',
'note':'Cuatro fallos acumulados y un salto amplio del reloj antes del quinto siguen causando bloqueo: el código no tiene ventana de caducidad de intentos previos al bloqueo. No se utilizó ni bloqueó la IP real ni se accedió al diccionario del servicio actual.',
'limits':'No se verificaron persistencia entre procesos, concurrencia ni coordinación entre trabajadores. Se verificó únicamente el estado en memoria de las funciones aisladas.'},
'CB-03':{
'result':'42 variantes aprobadas. Se verificaron los validadores de DNI, teléfono, correo y fecha; fechas reales y límites inclusivos 1900/hoy; correo opcional en patient_error; datos obligatorios, género, apoderado y teléfono para menores; cumpleaños de 18 años; y actualización parcial combinada con un objeto ficticio.',
'data':'DNI sintético 00123456 y variantes de longitud/letras/None. Teléfono ficticio 912345678 y variantes. Correo persona@example.test y formatos inválidos. Fechas 1899-12-31, 1900-01-01, 2000-02-29, 2001-02-29, hoy 2026-10-31 y mañana 2026-11-01. Menor ficticio de 2015 y límite de 18 años; tutor ficticio. date.today fijado en memoria a 2026-10-31.',
'expected':'DNI de ocho dígitos y teléfono de nueve comenzando en 9; correo con formato válido si se informa; fecha ISO real entre 1900 y hoy. patient_error devuelve None para datos válidos o el primer mensaje específico ante un error. Menores requieren tutor y teléfono válido; al cumplir 18 años no se exige apoderado.',
'conditions':'Tipo de dato y expresiones regulares, rango de fechas, calendario real, orden de errores, nombres/apellidos mínimos, género, correo opcional, cálculo de minoría de edad, tutor y teléfono; combinación con current en actualización parcial.',
'note':'Se ejecutaron las funciones reales del backend. No se insertaron pacientes ni se llamaron las rutas de alta o edición. La fecha del reloj se sustituyó solo en el espacio de nombres de pruebas, sin cambiar el reloj del sistema.',
'limits':'No se ejecutaron los validadores React ni las consultas de DNI duplicado de las rutas; el alcance de CB-03 fue validación interna pura. Los duplicados no forman parte de las 42 variantes contabilizadas.'},
'CB-04':{
'result':'40 variantes: 37 aprobadas y 3 fallidas. Las validaciones técnicas, límites 300×100 y ratio 1,25, MIME, archivos corruptos, recorte, capas semánticas simuladas y ruta validate_only se ejecutaron. En la función original validateImage del frontend, HTTP 400, HTTP 500 y excepción de red devolvieron true en vez de false; esos tres caminos fallaron el criterio de rechazo. Se reproduce la causa interna de CN-04 sin enviar un TXT al servidor.',
'data':'Arrays y PNG ficticios en memoria, imagen dañada no vacía, MIME image/png y text/plain, tamaños 299/300 y 99/100, ratios 1,24/1,25, orientación vertical y padding negro. Modelos, cargadores, scores y clases simulados. Umbral CLIP 0,25 y clasificador 0,60. fetch simulado con valid=true, valid=false, HTTP 400/500 y excepción.',
'expected':'Aceptar las variantes técnicas que cumplen límites y rechazar las que no. Rechazo MIME con 400; ruta /validate con valid=false ante capa rechazada y valid=true tras aceptación. validateImage debe devolver false ante un rechazo HTTP o fallo de comunicación; una respuesta válida aceptada debe devolver true y valid=false debe rechazar.',
'conditions':'process_image, validar_capa0 y auxiliares de decodificación, tamaño, orientación y recorte; run_inference con rechazos por capas, aceptación sin hallazgos, modelo ausente y excepción de inferencia; validar_con_clip y validar_con_clasificador con salidas controladas; validate_only y los cinco caminos de validateImage.',
'note':'CLIP y clasificador también dejan pasar ante indisponibilidad o excepción; el pipeline de inferencia devuelve valid=true con error ante una excepción del detector. Estas variantes aprobaron la constatación del comportamiento implementado y se registran como observaciones; las tres fallas del frontend se califican contra el criterio funcional de rechazo. No se corrigió ninguna rama.',
'limits':'No se cargaron pesos, no hubo inferencia real ni llamadas a FastAPI actual. Las corutinas se ejecutaron con UploadFile en memoria y dependencias ya resueltas. validateImage se extrajo sin modificar su cuerpo y se ejecutó en Node VM con fetch/estado simulados; no se montó React. No se certifica la clasificación semántica de imágenes reales ni cobertura completa del pipeline.'},
'CB-05':{
'result':'9 variantes aprobadas. Evaluación inexistente 404, pendiente 409, sin diagnóstico 404 y sin paciente 404, sin invocar el generador. Evaluación completada con objetos ficticios produjo HTTP 200 application/pdf mediante el generador real y plantilla original de solo lectura. Se verificaron texto y paciente ficticios en un PDF de una página. Dependencia pymupdf ausente simulada 503, otra dependencia 500, error genérico 500 y nombre de descarga normalizado.',
'data':'Evaluación ficticia 900001, paciente 900002 y odontólogo 900003, sin filas en MySQL. Persona Ficticia, DNI 00123456, fecha 31/10/2026; texto DIAGNOSTICO FICTICIO CB-05. Listado de radiografías vacío. Sesión y consultas ORM simuladas. Excepciones ModuleNotFoundError y RuntimeError controladas.',
'expected':'404 si falta evaluación, diagnóstico o paciente; 409 si no está completada; 200 application/pdf para caso completo; 503 al faltar pymupdf y 500 para otros errores. Normalizar nombre de descarga quitando espacios y tildes. El PDF válido debe contener el texto y paciente ficticios.',
'conditions':'descargar_diagnostico_pdf: retornos anticipados por precondiciones, llamada al generador, manejo de dependencias y excepciones, Content-Disposition y tipo de contenido. generar_pdf_diagnostico y sus helpers se ejecutaron realmente con la plantilla de referencia y entidades en memoria.',
'note':'La ruta admite generar PDF sin radiografías y el ensayo real lo confirmó. El PDF de ensayo y su render están en Evidencias_Caja_Blanca; no se almacenaron diagnósticos en el sistema.',
'limits':'No se probó en esta fase la rama con radiografías presentes ni la selección del último resultado por imagen; tampoco el botón React de descarga. El PDF con radiografía se verificó antes en CN-05. No se probaron todos los helpers de maquetación.'}}
with (ROOT/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);headers=reader.fieldnames;rows=list(reader)
for row in rows:
    code=row['Codigo']
    if code in details:
        m=summary['casos'][code]
        row.update({'Resultado obtenido':details[code]['result'],'Estado':m['estado'],'Evidencia':'Evidencias_Caja_Blanca/'+m['captura']+'; Evidencias_Caja_Blanca/'+m['reporte']+'; Evidencias_Caja_Blanca/Variantes_Caja_Blanca.csv'})
assert [r for r in rows if r['Codigo'].startswith('CN-')]==baseline['csv']
with (ROOT/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=headers);writer.writeheader();writer.writerows(rows)

doc=Document(ROOT/'Informe_Pruebas_Sonrie.docx')
def cn_records(d):
    active=False;records={};current=None
    for p in d.paragraphs:
        if p.style.name.startswith('Heading') and (p.text.startswith('CN-') or p.text.startswith('CB-')):
            if p.text[:5] in [f'CN-0{i}' for i in range(1,6)] and p.text[5:6]==' ':
                current=p.text[:5];active=True;records.setdefault(current,[])
            elif p.text.startswith('CB-'):active=False
        if active:records[current].append(p.text)
    return records
protected=cn_records(doc)
old_blobs=Counter(hashlib.sha256(doc.part.related_parts[s._inline.graphic.graphicData.pic.blipFill.blip.embed].blob).hexdigest() for s in doc.inline_shapes)
active=None
for p in list(doc.paragraphs):
    if p.style.name.startswith('Heading'):
        active=next((c for c in details if p.text.startswith(c+' ')),None)
    if active:
        d=details[active];m=summary['casos'][active]
        if p.text.startswith('Resultado obtenido '):p.text='Resultado obtenido '+d['result']
        elif p.text.startswith('Estado de la prueba '):p.text='Estado de la prueba '+m['estado']
        elif p.text.startswith('Datos de entrada '):p.text='Datos de entrada '+d['data']
        elif p.text.startswith('Resultado esperado '):p.text='Resultado esperado '+d['expected']
        elif p.text.startswith('Condiciones internas que deben comprobarse '):p.text='Condiciones internas comprobadas '+d['conditions']
        elif p.text.startswith('Precondición '):p.text='Precondición Ensayo local independiente en .venv, unittest y Node integrados ya disponibles. Funciones del código real con dependencias, reloj e IP controlados. Sin servicios actuales, base real, modelos ni credenciales reales. Red bloqueada en las pruebas Python.'
        elif p.text.startswith('Evidencia '):p.text='Evidencia '+m['captura']+' y '+m['reporte']+' en Evidencias_Caja_Blanca. Variantes completas en Variantes_Caja_Blanca.csv y JSON; logs reales unittest/node:test y trazas Python. La figura siguiente es una captura del reporte generado desde la ejecución, no una captura de una terminal ni del sistema en producción.'
        elif p.text.startswith('Destino previsto de evidencia '):
            p.text='Observación y límites '+d['note']+' '+d['limits']
            br=p.insert_paragraph_before();br.add_run().add_break(WD_BREAK.PAGE)
            h=p.insert_paragraph_before(active+' Reporte de ejecución');h.style=doc.styles['Heading 3']
            cap=p.insert_paragraph_before(f"{m['variantes']} variantes ejecutadas · {m['aprobadas']} aprobadas · {m['fallidas']} fallidas · {m['bloqueadas']} bloqueadas");cap.paragraph_format.keep_with_next=True
            pic=p.insert_paragraph_before();pic.add_run().add_picture(str(OUT/m['captura']),width=Cm(16))
            source=p.insert_paragraph_before('Reporte local de resultados reales y fragmento original del código. El detalle de todas las variantes se conserva en CSV y JSON.');source.runs[0].font.size=Pt(9)
    if p.text.startswith('El Sistema Sonríe es una aplicación web de apoyo'):
        p.text='El Sistema Sonríe es una aplicación web de apoyo a la detección y clasificación de caries mediante radiografías panorámicas. Este informe contiene el plan y resultados de diez casos: cinco de caja negra ejecutados sobre servicios locales autorizados y cinco de caja blanca ejecutados con código real y dependencias controladas. La evaluación funcional no acredita precisión clínica ni cobertura completa de código.'
    elif p.text.startswith('Herramientas previstas:'):
        p.text='Herramientas utilizadas: Playwright 1.62.1 y Chromium independiente para caja negra; unittest de Python 3.12 del entorno .venv existente para caja blanca; node:test y vm de Node para la función JavaScript original. Flask se ejecutó solo con cliente de pruebas en memoria y ORM simulado; OpenCV y NumPy reales procesaron imágenes ficticias; PyMuPDF generó un PDF de objetos ficticios con plantilla original de solo lectura. No se instaló ninguna dependencia en Fase 3.'
    elif p.text.startswith('El responsable confirmó respaldo completo de base de datos'):
        p.text='Para caja negra, el responsable confirmó respaldo completo y autorizó los servicios actuales en puertos 3000, 5000 y 8000, con datos ficticios y radiografía de pruebas. Para Fase 3 no se accedió a esos servicios: se aislaron las funciones y se simularon las consultas, escrituras, reloj, IP y modelos. La red quedó bloqueada en el ejecutor Python. Los scripts y evidencias se guardaron únicamente en Pruebas_Tesis_Sonrie.'
    elif p.text.startswith('CN-01, CN-02, CN-03 y CN-05: Aprobado.'):
        p.text='Caja negra conservada: CN-01, CN-02, CN-03 y CN-05 Aprobado; CN-04 Fallido. Caja blanca: CB-01, CB-02, CB-03 y CB-05 Aprobado; CB-04 Fallido. Total de diez casos: ocho aprobados y dos fallidos dentro del alcance documentado. Fase 3 ejecutó 111 variantes: 108 aprobadas y tres fallidas, sin bloqueadas. No se presenta porcentaje de cobertura.'
    elif p.text.startswith('Conclusión parcial de las fases 2 y 2B:'):
        p.text='Conclusiones basadas en las ejecuciones: las pruebas de acceso, registro ficticio, procesamiento y persistencia con PDF cumplieron sus criterios. Las ramas de autenticación, bloqueo, validación de pacientes y precondiciones del PDF respondieron como se documenta en sus variantes. La ejecución del código original de validateImage confirmó que HTTP 400, HTTP 500 y error de red se aceptan devolviendo true; CB-04 se clasifica Fallido y explica el fallo previo de CN-04. No se corrigió el sistema. La aprobación de otros casos no certifica toda su lógica ni elimina las observaciones: éxito de login ante error de commit, falta de caducidad de intentos previos al bloqueo y aceptación de ciertos fallos de IA. No se midió precisión clínica ni cobertura completa de ramas.'
    elif p.text.startswith('Se identificaron pruebas existentes en backend/tests/'):
        p.text='Se conservaron los tests existentes sin modificarlos. Para Fase 3 se crearon ejecutores propios en Scripts_Pruebas, porque importar create_app o las rutas completas puede inicializar dependencias y directorios del sistema. Se seleccionaron nodos de funciones originales con AST y se compilaron con sus nombres de archivo y líneas reales, sin reescribir los cuerpos; el generador PDF se cargó completo por ruta, sin importar la aplicación.'
    elif p.text.startswith('La lectura del código no prueba que una rama funcione'):
        p.text='La lectura estática inicial se complementó con ejecución real de los cuerpos de funciones seleccionados. Se conservaron esperado, obtenido y estado por variante, junto con trazas de líneas y transiciones Python. No se afirma cobertura de sentencias, decisiones o caminos completa, ni se equiparan esas trazas a porcentajes de cobertura.'
for table in doc.tables:
    for row in table.rows:
        if row.cells[0].text in details:row.cells[-1].text=summary['casos'][row.cells[0].text]['estado']
doc.add_page_break()
doc.add_heading('Registro de ejecución de Fase 3',1)
doc.add_paragraph('La Fase 3 se ejecutó con 106 variantes Python y cinco variantes JavaScript. Se priorizaron CB-01 y CB-02 y, tras completar sus 20 variantes, se ejecutaron los demás casos con las mismas restricciones. Las 111 variantes finales incluyen 11 de CB-01, nueve de CB-02, 42 de CB-03, 40 de CB-04 y nueve de CB-05. Los tres fallos corresponden al frontend de CB-04; no quedaron variantes bloqueadas en la ejecución final.')
doc.add_heading('Aislamiento y fidelidad del código ejecutado',2)
doc.add_paragraph('No se inició sesión en los servicios actuales ni se usaron las credenciales reales proporcionadas. No se importaron create_app, los modelos ORM ni el inicializador YOLO. La selección AST conserva los cuerpos y líneas del código original y los ejecuta con espacios de nombres controlados; no representa una importación integral del sistema. Se sustituyeron dependencias por dobles y se mantuvieron reales los algoritmos de validación, Flask, bcrypt, NumPy, OpenCV y el generador PDF. Los umbrales de modelos se fijaron a los valores de ensayo documentados; no se tocaron las configuraciones existentes.')
doc.add_paragraph('Las corutinas process_image y validate_only se ejecutaron con UploadFile sobre un archivo temporal en memoria y awaits que terminan sin I/O externo. Los imports locales de las capas apuntaron temporalmente a módulos dobles, restaurados al salir de cada variante. La función validateImage se extrajo textualmente del componente, se compiló sin cambiar su cuerpo y se ejecutó con fetch, FormData y actualizadores de estado simulados. No se montó React ni se efectuaron llamadas de red.')
doc.add_heading('Interpretación de estados y observaciones',2)
doc.add_paragraph('Un caso Aprobado significa que sus variantes finales cumplieron las comprobaciones definidas, dentro de las limitaciones de su ficha. Las observaciones de comportamiento implementado no equivalen a una validación general de seguridad o de persistencia. En CB-04, tres variantes contrastan explícitamente con el criterio de rechazar archivos ante errores HTTP y de comunicación: esperado false, obtenido true. Los logs de node:test contienen las aserciones fallidas reales. El sistema no fue modificado para hacerlas pasar.')
doc.add_heading('Cobertura y trazabilidad',2)
doc.add_paragraph('No se pudo medir cobertura de ramas con una herramienta estandarizada: coverage y pytest no están instalados en los entornos inspeccionados y no se instalaron. Se utilizó sys.settrace de la biblioteca estándar para registrar líneas y transiciones efectivamente observadas en las funciones Python seleccionadas. Esas trazas no incluyen todos los módulos ni constituyen un porcentaje de cobertura. Los archivos de traza conservan las rutas, líneas originales y hashes SHA-256 del código evaluado. El JavaScript conserva el fragmento original y las cinco variantes ejecutadas.')
doc.add_heading('Evidencias y límites pendientes',2)
doc.add_paragraph('Evidencias_Caja_Blanca contiene logs TXT de unittest y node:test, resultados JSON, trazas JSON, el CSV con 111 variantes, cinco reportes HTML con sus capturas PNG y el PDF de objetos ficticios de CB-05. Las capturas insertadas son reportes locales de resultados reales. No se ejecutaron pruebas integrales de concurrencia, bases de datos, modelos ni todos los componentes React. La ruta PDF se ensayó sin radiografías; la rama de selección de resultados con múltiples imágenes no se cubrió en Fase 3. No se declararon pruebas omitidas como aprobadas.')
doc.save(ROOT/'Informe_Pruebas_Sonrie.docx')
check=Document(ROOT/'Informe_Pruebas_Sonrie.docx')
new_blobs=Counter(hashlib.sha256(check.part.related_parts[s._inline.graphic.graphicData.pic.blipFill.blip.embed].blob).hexdigest() for s in check.inline_shapes)
assert all(new_blobs[k]>=v for k,v in old_blobs.items())
assert len(check.inline_shapes)==19
# Las fichas CN anteriores y los datos CSV permanecen sin cambios.
assert cn_records(check)==protected
intact=all((ROOT/p).is_file() and hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h for p,h in baseline['evidencias'].items())
assert intact
integrity={'filas_cn_csv_sin_cambios':True,'fichas_cn_word_sin_cambios':True,'imagenes_anteriores_word_conservadas':True,'archivos_evidencia_caja_negra_sin_cambios':intact,'archivos_evidencia_verificados':len(baseline['evidencias']),'imagenes_word_actual':len(check.inline_shapes),'variantes_totales':111,'resultados':{r['Codigo']:r['Estado'] for r in rows}}
(OUT/'Verificacion_Final_Fase3.json').write_text(json.dumps(integrity,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(integrity,ensure_ascii=False))
