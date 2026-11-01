"""Incorpora observaciones y capturas reales de CN-04 sin ejecutar el sistema."""
from pathlib import Path
from datetime import datetime
import csv,json,shutil
from docx import Document
from docx.shared import Cm,Pt

root=Path(__file__).resolve().parents[1]
ev=root/'Evidencias_Caja_Negra'
names=['sin_archivo','corrupto_rechazado','no_panoramica_rechazada','incompatible_txt']
states={n:json.loads((ev/('CN-04_'+n+'_observacion.json')).read_text(encoding='utf-8')) for n in names}
def disabled(n):return next(i['disabled'] for i in states[n]['inputs'] if i.get('text')=='Continuar')
assert all(disabled(n) for n in names[:3]) and not disabled(names[3])
events=json.loads((ev/'CN-04_validaciones_observadas.json').read_text(encoding='utf-8'))
assert [e['http'] for e in events]==[200,200,400]
audit=json.loads((ev/'CN-04_auditoria_escenario.json').read_text(encoding='utf-8'))
assert not audit['solicitudes_de_almacenamiento_procesamiento_finalizacion']
assert all(not e['radiografias'] and e['diagnostico'] is None for e in audit['evaluaciones_ficticias'])
backup=root/'Scripts_Pruebas'/'Respaldos'/('CN04_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
for name in ['Informe_Pruebas_Sonrie.docx','Resultados_Pruebas.csv']:shutil.copy2(root/name,backup/name)
summary='Ejecutadas cuatro variantes en Chromium independiente con Playwright el 31/10/2026 entre 17:17 y 17:18 (America/Bogota). Sin archivo: Continuar deshabilitado, aprobado. PNG corrupto: HTTP 200, valid=false y mensaje de archivo ilegible, Continuar deshabilitado, aprobado. Imagen vertical ficticia: HTTP 200, valid=false y mensaje de orientación vertical o cuadrada, Continuar deshabilitado, aprobado. TXT incompatible seleccionado mediante setInputFiles: el microservicio respondió HTTP 400, pero la interfaz incorporó el TXT, no mostró el error y habilitó Continuar; fallido. No se pulsó Continuar con el TXT ni se intentó persistirlo.'
evidence='; '.join('Evidencias_Caja_Negra/CN-04_'+n+'.png' for n in names)
with (root/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);headers=reader.fieldnames;rows=list(reader)
for row in rows:
    if row['Codigo']=='CN-04':row.update({'Resultado obtenido':summary,'Estado':'Fallido','Evidencia':evidence})
assert next(r for r in rows if r['Codigo']=='CN-01')['Estado']=='Aprobado'
assert sum(r['Estado']=='No ejecutado' for r in rows)==8
with (root/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=headers);writer.writeheader();writer.writerows(rows)
variants=[
 {'codigo':'CN-04-V1','nombre':'Sin archivo','estado':'Aprobado','entrada':'Ningún archivo seleccionado','resultado':'El campo permanece vacío y Continuar está deshabilitado. No se muestra un mensaje de error adicional. No se intentó forzar el botón deshabilitado.','imagen':'CN-04_sin_archivo.png'},
 {'codigo':'CN-04-V2','nombre':'Imagen corrupta','estado':'Aprobado','entrada':'CN04_corrupto.png','resultado':'POST /api/validate respondió HTTP 200 con valid=false. La interfaz mostró Imagen no válida y el mensaje: El archivo no pudo ser leído como imagen. Verifique que sea un archivo JPG, PNG o similar válido y no esté dañado. El archivo no se incorporó y Continuar permaneció deshabilitado.','imagen':'CN-04_corrupto_rechazado.png'},
 {'codigo':'CN-04-V3','nombre':'Imagen no panorámica','estado':'Aprobado','entrada':'CN04_no_panoramica_vertical.png, imagen ficticia vertical de 400 × 800 píxeles','resultado':'POST /api/validate respondió HTTP 200 con valid=false. La interfaz mostró Imagen no válida y el mensaje: La imagen tiene una orientación vertical o cuadrada. Por favor, suba nuevamente la imagen y verifique que sea una radiografía panorámica completa (formato horizontal). Continuar permaneció deshabilitado. Esta variante prueba orientación, sin acreditar el rechazo semántico de todas las imágenes horizontales no dentales.','imagen':'CN-04_no_panoramica_rechazada.png'},
 {'codigo':'CN-04-V4','nombre':'Archivo incompatible','estado':'Fallido','entrada':'CN04_incompatible.txt, 69 bytes, seleccionado con Playwright setInputFiles','resultado':'POST /api/validate respondió HTTP 400 con detail: El archivo debe ser una imagen. La interfaz no mostró este mensaje; incorporó el nombre del TXT, mostró una previsualización ilegible y habilitó Continuar. No se pulsó el botón. No se verificó almacenamiento ni avance efectivo al siguiente paso.','imagen':'CN-04_incompatible_txt.png'}
]
(ev/'CN-04_resumen_variantes.json').write_text(json.dumps({'caso':'CN-04','estado':'Fallido','variantes':variants,'alcance':'Cuatro variantes seleccionadas mediante campo de archivo; no se ensayó arrastrar y soltar, fallo de red ni persistencia.'},ensure_ascii=False,indent=2),encoding='utf-8')
doc=Document(root/'Informe_Pruebas_Sonrie.docx')
active=None
for p in list(doc.paragraphs):
    if p.style.name.startswith('Heading'):active='CN-04' if p.text.startswith('CN-04 ') else None
    if active:
        if p.text.startswith('Resultado obtenido '):p.text='Resultado obtenido '+summary
        elif p.text.startswith('Estado de la prueba '):p.text='Estado de la prueba Fallido'
        elif p.text.startswith('Evidencia '):p.text='Evidencia Cuatro capturas reales en Evidencias_Caja_Negra; ver fichas de variantes y figuras al final del informe. Se adjuntan observaciones DOM, respuestas de validación y auditoría del escenario en archivos JSON.'
        elif p.text.startswith('Precondición '):p.text='Precondición Respaldo completo confirmado por el responsable y uso autorizado del sistema actual. Cuenta ficticia Plis Plis. Paciente ficticio Prueba Carga Ficticio Octubre, ID 16, DNI 99103104; evaluación nueva ID 200, creada exclusivamente como preparación de CN-04.'
    if p.text.startswith('CN-01 aprobado mediante ejecución completa'):
        p.text='CN-01 Aprobado. CN-04 Fallido por aceptación del TXT en la interfaz pese al rechazo HTTP 400; sus otras tres variantes aprobaron. Las otras ocho pruebas permanecen No ejecutado. No se declara cobertura de código ni exactitud clínica.'
    elif p.text.startswith('Registro actualizado de Fase 2.'):
        p.text='Alcance de Fase 2: CN-01 y CN-04 ejecutados. CN-01 aprobado; CN-04 fallido. El responsable confirmó respaldo completo y autorizó los servicios actuales. Se creó únicamente el escenario ficticio necesario para CN-04, sin evaluar CN-02, CN-03, CN-05 ni caja blanca.'
    elif p.text.startswith('Sin archivo — Bloqueado.'):
        p.text='Sin archivo — Aprobado. Campo vacío y Continuar deshabilitado. Evidencia CN-04_sin_archivo.png.'
    elif p.text.startswith('Archivo incompatible — Bloqueado.'):
        p.text='Archivo incompatible — Fallido. TXT incorporado y Continuar habilitado aunque /api/validate respondió HTTP 400. Evidencia CN-04_incompatible_txt.png.'
    elif p.text.startswith('Archivo corrupto — Bloqueado.'):
        p.text='Archivo corrupto — Aprobado. Mensaje de archivo ilegible y Continuar deshabilitado. Evidencia CN-04_corrupto_rechazado.png.'
    elif p.text.startswith('Imagen no panorámica — Bloqueado.'):
        p.text='Imagen no panorámica — Aprobado para la imagen vertical ficticia utilizada. Mensaje de orientación inválida y Continuar deshabilitado. Evidencia CN-04_no_panoramica_rechazada.png.'
    elif p.text.startswith('Se generó una captura real del dashboard'):
        p.text='Se conservan cinco capturas reales: una de CN-01 y cuatro de CN-04. Las figuras de CN-04 muestran únicamente la cuenta y el paciente ficticios. Los archivos JSON conservan la respuesta del servidor y el estado observable de los controles, sin contraseñas ni tokens.'
    elif p.text.startswith('Se mantienen el código, las configuraciones'):
        p.text='Se mantuvieron el código, las configuraciones y los modelos originales. El ejecutor de CN-04 bloqueaba solicitudes de cambio a registros existentes, almacenamiento de radiografías, finalización y procesamiento. No se activó esa barrera: no hubo solicitudes a esos endpoints. El rechazo de las imágenes corrupta y vertical provino del sistema, y no de la automatización.'
    elif p.text.startswith('Todos los archivos y logs de la ejecución futura'):
        p.text='Los scripts, capturas y observaciones generados por la automatización se guardaron en Pruebas_Tesis_Sonrie. Las escrituras propias del sistema se limitaron a nuevas sesiones/auditoría y al paciente y evaluación ficticios. La evaluación ID 200 quedó pendiente, sin radiografías y sin diagnóstico. No se eliminaron los datos ficticios al terminar.'
    elif p.text.startswith('Pendiente de completar después de ejecutar las pruebas.'):
        p.text='Conclusión parcial de Fase 2: el inicio de sesión exitoso cumplió el criterio de CN-01. En CN-04, la ausencia de archivo, la imagen corrupta y la imagen vertical impidieron continuar. El TXT reveló una diferencia entre el rechazo del microservicio y la aceptación de la interfaz, por lo que CN-04 se clasifica Fallido. No se corrigió el sistema. Las conclusiones globales quedan pendientes de los otros ocho casos.'
    elif p.text.startswith('El Sistema Sonríe es una aplicación web de apoyo'):
        p.text='El Sistema Sonríe es una aplicación web de apoyo a la detección y clasificación de caries mediante radiografías panorámicas. El informe contiene el plan de diez casos y los resultados observados de CN-01 y CN-04 en la Fase 2. El diseño inicial se basó en lectura estática; los resultados de estas dos pruebas se obtuvieron con Playwright sobre los servicios actuales autorizados. Los otros ocho casos no se han ejecutado.'
for t in doc.tables:
    for row in t.rows:
        if row.cells[0].text=='CN-04':row.cells[-1].text='Fallido'
doc.add_page_break()
doc.add_heading('Ejecución y evidencias de CN 04',1)
doc.add_paragraph('Fecha de ejecución: 31 de octubre de 2026, zona America/Bogota. Herramientas: Playwright 1.62.1 y Chromium 151.0.7922.34, ventana independiente con área de 1366 × 900 píxeles. Servicios: interfaz 3000, backend 5000 y validador IA 8000. La recuperación del canal de control se limitó al proceso del propio ejecutor Playwright; no se cambió el sistema Sonríe.')
doc.add_paragraph('Preparación: paciente ficticio ID 16 y evaluación nueva ID 200. Su creación fue exclusivamente un requisito de escenario; no se calificaron otros casos de prueba. La verificación posterior por lectura encontró la evaluación pendiente, radiografias=[] y diagnostico=null. No se enviaron solicitudes de guardado de radiografías, procesamiento ni finalización. uploads conservó 276 archivos y 622494583 bytes, igual al inventario previo; este cotejo por cantidad y tamaño no equivale a comprobar hashes de todos los archivos.')
doc.add_paragraph('Método y límite de la variante TXT: setInputFiles asignó el archivo al campo input[type=file], sin eliminar ni modificar su atributo accept=image/*. Este método de automatización no está limitado por el filtro visual del selector nativo. El hallazgo acredita el manejo del archivo incompatible una vez entregado al formulario; no prueba que el selector nativo permita elegirlo en su filtro predeterminado. Tampoco se probó arrastrar y soltar.')
doc.add_paragraph('Los mensajes transitorios Guardando radiografías y Guardando aparecieron durante la validación. No se interpretaron como evidencia de persistencia: se revisaron las solicitudes y el detalle del escenario, y no hubo radiografías almacenadas. No se pulsó Continuar al quedar habilitado con el TXT, de acuerdo con la restricción de no persistir incompatibles.')
for v in variants:
    doc.add_page_break()
    doc.add_heading(v['codigo']+' '+v['nombre'],2)
    for label,value in [('Estado',v['estado']),('Datos de entrada',v['entrada']),('Resultado observado',v['resultado'])]:
        p=doc.add_paragraph();p.add_run(label+' ').bold=True;p.add_run(value)
    p=doc.add_paragraph('Figura '+v['codigo']+' Resultado real de '+v['nombre'].lower());p.paragraph_format.keep_with_next=True
    doc.add_picture(str(ev/v['imagen']),width=Cm(16))
    p=doc.add_paragraph('Evidencia: Evidencias_Caja_Negra/'+v['imagen']);p.runs[0].font.size=Pt(9)
doc.save(root/'Informe_Pruebas_Sonrie.docx')
check=Document(root/'Informe_Pruebas_Sonrie.docx')
assert len(check.inline_shapes)>=5
assert sum(r['Estado']=='No ejecutado' for r in rows)==8
print('Documento actualizado: CN-01 Aprobado, CN-04 Fallido, ocho No ejecutado; cinco capturas insertadas.')
