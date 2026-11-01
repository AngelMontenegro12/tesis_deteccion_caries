"""Registra CN-02, CN-03 y CN-05 desde evidencias reales; no llama al sistema."""
from pathlib import Path
from datetime import datetime
import csv,json,hashlib,shutil
from docx import Document
from docx.shared import Cm,Pt
from pypdf import PdfReader

root=Path(__file__).resolve().parents[1]
ev=root/'Evidencias_Caja_Negra'
run=json.loads((ev/'Fase2B_registro.json').read_text(encoding='utf-8'))
integrity=json.loads((ev/'Fase2B_integridad_despues.json').read_text(encoding='utf-8'))
baseline=json.loads((ev/'Fase2B_integridad_antes.json').read_text(encoding='utf-8'))
detail=json.loads((ev/'Fase2B_detalle_persistido.json').read_text(encoding='utf-8'))['detalle']
before_analysis=json.loads((ev/'CN-03_detalle_tras_analisis.json').read_text(encoding='utf-8'))['detalle']
assert not run['bloqueos']
assert not any(integrity['cambios_filas_previas'].values())
assert not integrity['uploads_anteriores_alterados']
assert integrity['evidencias_anteriores_intactas'] and integrity['resultados_cn01_cn04_intactos']
assert detail['evaluacion']['estado']=='completada'
assert detail['evaluacion']['id_evaluacion']==201 and detail['paciente']['id_paciente']==17
assert detail['diagnostico']['diagnostico_texto'].startswith('DIAGNOSTICO FICTICIO CN-05.')
assert len(detail['radiografias'])==1 and len(detail['detecciones_caries'])==3
assert detail['radiografias']==before_analysis['radiografias']
assert detail['detecciones_caries']==before_analysis['detecciones_caries']
assert detail['evaluacion']['fecha_evaluacion']==before_analysis['evaluacion']['fecha_evaluacion']
pdf=ev/'CN-05_diagnostico_prueba.pdf'
reader=PdfReader(pdf)
text='\n'.join(p.extract_text() or '' for p in reader.pages)
assert len(reader.pages)==2 and '99103125' in text and 'Expediente #201' in text and 'DIAGNOSTICO FICTICIO CN-05.' in text
assert all(str(x) in text for x in ['54.1%','53.8%','50.3%'])
pdf_check={'paginas':len(reader.pages),'bytes':pdf.stat().st_size,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'paciente_y_dni_correctos':True,'diagnostico_ficticio_presente':True,'expediente':201,'revision_visual':'Dos páginas renderizadas y revisadas; texto legible, panorámica y tres recuadros presentes.','observacion':'El PDF identifica a Aldo Montenegro Delgado, mientras la sesión muestra Plis Plis. No se evaluó asignación de identidad del odontólogo como criterio de estos casos.'}
(ev/'CN-05_verificacion_pdf.json').write_text(json.dumps(pdf_check,ensure_ascii=False,indent=2),encoding='utf-8')
backup=root/'Scripts_Pruebas'/'Respaldos'/('Fase2B_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
for name in ['Informe_Pruebas_Sonrie.docx','Resultados_Pruebas.csv']:shutil.copy2(root/name,backup/name)

results={
'CN-02':'Aprobado. Se comprobó mediante consulta de solo lectura que el DNI ficticio 99103125 no existía en pacientes activos ni inactivos. Se registró desde el modal de la interfaz a Prueba Tesis Paciente Ficticio; POST /api/pacientes respondió 201 y creó el ID 17. Se buscó por DNI, se observó su tarjeta en el listado, se recargó la página y se buscó nuevamente; el paciente permaneció visible.',
'CN-03':'Aprobado en el escenario ejecutado. Se creó la evaluación nueva ID 201 del paciente ficticio ID 17. La panorámica de prueba autorizada fue aceptada por /api/validate con HTTP 200 y valid=true; se guardó como radiografía ID 310, sin reemplazos. La única ejecución de /api/evaluaciones/201/procesar respondió 200 y status=success, con tres hallazgos Caries Incipiente. Se observaron finalización del procesamiento, imagen, tres recuadros, clasificaciones y porcentajes. Confianzas devueltas: 0,5407, 0,5379 y 0,5026; interfaz: 54 %, 54 % y 51 %, por redondeo y ajuste de cada distribución a suma 100. No se calificó precisión clínica.',
'CN-05':'Aprobado para guardado, consulta y descarga. La evaluación ficticia ID 201 se finalizó una sola vez mediante la interfaz con texto identificado como DIAGNOSTICO FICTICIO CN-05; /completar respondió 200 y creó diagnóstico ID 179. Se localizó en el historial con estado Completada y una radiografía, se abrió /evaluacion/201 y se recargó: texto, fecha 31/10/2026 17:35:03, radiografía ID 310 y tres detecciones permanecieron disponibles. Descargar Expediente produjo un PDF válido de dos páginas y 3749711 bytes, con expediente, paciente, diagnóstico, imagen y recuadros. Observación: el PDF identifica a Aldo Montenegro Delgado, aunque la sesión muestra Plis Plis; no se alteró esa asignación.'
}
images={
'CN-02':[
('CN-02_paciente_registrado.png','Paciente ficticio registrado y localizado por DNI'),
('CN-02_paciente_tras_recarga.png','Paciente conservado después de recargar y buscar nuevamente')],
'CN-03':[
('CN-03_contexto_ficticio.png','Contexto clínico identificado como prueba ficticia'),
('CN-03_radiografia_validada.png','Panorámica de prueba aceptada por el validador'),
('CN-03_procesamiento.png','Procesamiento de la única radiografía nueva'),
('CN-03_detecciones_visibles.png','Tres hallazgos con clasificaciones porcentajes y recuadros')],
'CN-05':[
('CN-05_finalizacion.png','Confirmación de guardado del diagnóstico ficticio'),
('CN-05_historial_evaluacion_201.png','Evaluación nueva localizada en el historial como completada'),
('CN-05_detalle_tras_recarga.png','Diagnóstico imagen y hallazgos conservados tras recargar')]
}
inputs={
'CN-02':'Prueba Tesis Paciente Ficticio; DNI sintético 99103125; nacimiento 1990-01-15; género Otro; teléfono ficticio 999000125; correo prueba.tesis@example.com; dirección y observaciones marcadas como ficticias. DNI verificado libre antes del alta.',
'CN-03':'Paciente ID 17, evaluación ID 201 y una imagen de la carpeta autorizada por el responsable para validación y pruebas. Fuente img_120820261.png; copia idéntica CN03_panoramica_prueba.png en Scripts_Pruebas/Radiografia_Fase2B. SHA-256 1a27e2512fad07eed9bb1ac09b075d4ec131cdc631d1ea55962c2c8007ef5f74. Dimensiones originales 2872 × 1504; 5127345 bytes. Tipo Panorámica y contexto ficticio.',
'CN-05':'Evaluación ID 201 creada durante CN-03, con radiografía ID 310 y resultado ID 241; texto final: '+detail['diagnostico']['diagnostico_texto']
}
observations={
'CN-02':'No se observaron rechazos ni pérdida del registro. El alta y el listado se ejercitaron por la interfaz. El guardado asignó id_odontologo=1, tal como estaba implementado; no se modificó la configuración.',
'CN-03':'El tercer porcentaje destacado de la interfaz es 51 %, aunque la confianza almacenada es 0,5026, porque el componente ajusta al mayor el punto faltante para sumar 100 tras redondear. El PDF conserva la presentación a una cifra decimal: 54,1 %, 53,8 % y 50,3 %. Es una diferencia de presentación documentada, sin afirmar calibración ni precisión clínica. No se reprocesó la imagen.',
'CN-05':'La fecha mostrada es la fecha de evaluación y se mantuvo tras recargar. El PDF contiene un odontólogo distinto de la cuenta de pruebas: Aldo Montenegro Delgado frente a Plis Plis. Esta diferencia se registra fuera del criterio de persistencia y descarga; no se certifica la correspondencia de la identidad del firmante. No se repitió la finalización ni se modificaron otras evaluaciones.'
}
with (root/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    r=csv.DictReader(f);headers=r.fieldnames;rows=list(r)
for row in rows:
    code=row['Codigo']
    if code in results:
        row.update({'Resultado obtenido':results[code],'Estado':'Aprobado','Evidencia':'; '.join('Evidencias_Caja_Negra/'+n for n,_ in images[code])+('; Evidencias_Caja_Negra/CN-05_diagnostico_prueba.pdf' if code=='CN-05' else '')})
assert {r['Codigo']:r for r in rows if r['Codigo'] in ['CN-01','CN-04']}==baseline['resultados_previos']
assert sum(r['Estado']=='No ejecutado' and r['Codigo'].startswith('CB-') for r in rows)==5
with (root/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=headers);w.writeheader();w.writerows(rows)

doc=Document(root/'Informe_Pruebas_Sonrie.docx')
def case_paragraphs(d,code):
    active=False;out=[]
    for p in d.paragraphs:
        if p.style.name.startswith('Heading') and p.text.startswith(('CN-','CB-')):
            if active:break
            active=p.text.startswith(code+' ')
        if active:out.append(p.text)
    return out
protected={c:case_paragraphs(doc,c) for c in ['CN-01','CN-04']}
active=None
for p in list(doc.paragraphs):
    if p.style.name.startswith('Heading'):
        active=next((c for c in results if p.text.startswith(c+' ')),None)
    if active:
        if p.text.startswith('Resultado obtenido '):p.text='Resultado obtenido '+results[active]
        elif p.text.startswith('Estado de la prueba '):p.text='Estado de la prueba Aprobado'
        elif p.text.startswith('Datos de entrada '):p.text='Datos de entrada '+inputs[active]
        elif p.text.startswith('Precondición '):p.text='Precondición Respaldo completo confirmado por el responsable y uso autorizado de los servicios actuales. Cuenta ficticia Plis Plis; solo paciente y evaluación nuevos de Fase 2B. Sin cambios de código, configuración, dependencias ni modelos.'
        elif p.text.startswith('Evidencia '):p.text='Evidencia '+('; '.join(n for n,_ in images[active]))+('. PDF descargado: CN-05_diagnostico_prueba.pdf.' if active=='CN-05' else '')+' Capturas reales insertadas a continuación en esta ficha; trazas en Fase2B_registro.json.'
        elif p.text.startswith('Destino previsto de evidencia '):
            p.text='Ubicación de evidencias Evidencias_Caja_Negra. Observación: '+observations[active]
            for index,(name,title) in enumerate(images[active],1):
                br=p.insert_paragraph_before();br.add_run().add_break(__import__('docx').enum.text.WD_BREAK.PAGE)
                heading=p.insert_paragraph_before(active+' Evidencia '+str(index));heading.style=doc.styles['Heading 3']
                cap=p.insert_paragraph_before(title);cap.paragraph_format.keep_with_next=True
                figure=p.insert_paragraph_before();figure.add_run().add_picture(str(ev/name),width=Cm(16))
                source=p.insert_paragraph_before('Captura real '+name);source.runs[0].font.size=Pt(9)
    if p.text.startswith('El Sistema Sonríe es una aplicación web de apoyo'):
        p.text='El Sistema Sonríe es una aplicación web de apoyo a la detección y clasificación de caries mediante radiografías panorámicas. Este informe contiene el plan de diez casos y los resultados reales de los cinco casos de caja negra ejecutados en las fases 2 y 2B. Las cinco pruebas de caja blanca permanecen No ejecutado. La evaluación funcional no acredita precisión clínica del modelo ni cobertura de código.'
    elif p.text.startswith('CN-01 Aprobado. CN-04 Fallido'):
        p.text='CN-01, CN-02, CN-03 y CN-05: Aprobado. CN-04: Fallido, conservando sus cuatro variantes y evidencias anteriores. CB-01 a CB-05: No ejecutado. Los estados se refieren al alcance y datos concretos documentados; no se declara cobertura de código ni exactitud clínica.'
    elif p.text.startswith('Conclusión parcial de Fase 2:'):
        p.text='Conclusión parcial de las fases 2 y 2B: se verificaron el acceso, el alta de un paciente ficticio, el procesamiento de una panorámica autorizada y la conservación del diagnóstico y resultados con descarga PDF. CN-04 mantiene el fallo ya documentado de aceptación del TXT por la interfaz pese al rechazo del microservicio. Se observó ajuste de porcentajes en pantalla y un odontólogo en el PDF diferente de la cuenta de sesión; ambas diferencias se documentan sin correcciones. Los hashes confirman que los datos clínicos y uploads preexistentes permanecieron intactos durante Fase 2B. Quedan pendientes las cinco pruebas de caja blanca.'
    elif p.text.startswith('Alcance de Fase 2: CN-01 y CN-04 ejecutados.'):
        p.text='Registro de fases 2 y 2B: CN-01 y CN-04 conservan sus resultados anteriores. En Fase 2B se ejecutaron CN-02, CN-03 y CN-05 con un paciente nuevo y una evaluación nueva. No se ejecutaron pruebas de caja blanca. El responsable confirmó el respaldo completo y autorizó el uso de los servicios actuales y la radiografía de prueba.'
    elif p.text.startswith('Se conservan cinco capturas reales:'):
        p.text='Se conservan intactas las cinco capturas anteriores de CN-01 y CN-04. Se añadieron capturas reales de CN-02, CN-03 y CN-05 y el PDF descargado de la evaluación ficticia 201. Los registros generados por la automatización no contienen contraseñas ni tokens.'
for t in doc.tables:
    for row in t.rows:
        if row.cells[0].text in results:row.cells[-1].text='Aprobado'
doc.add_page_break()
doc.add_heading('Registro de ejecución de Fase 2B',1)
doc.add_paragraph('Ejecución realizada el 31 de octubre de 2026, entre las 17:32 y 17:37, zona America/Bogota. Playwright 1.62.1 y Chromium 151.0.7922.34, ventana independiente con área de 1440 × 1000. Servicios actuales: React 3000, Flask 5000 y FastAPI 8000. No se instalaron dependencias nuevas en esta fase.')
doc.add_paragraph('Identificadores creados: paciente 17, DNI ficticio 99103125; evaluación 201; radiografía 310; resultado de detección 241; detecciones 556, 557 y 558; diagnóstico 179. El paciente ficticio 16 y la evaluación 200, usados antes en CN-04, se mantuvieron intactos. Se conservan los nuevos registros para revisión y no se eliminaron al terminar.')
doc.add_paragraph('La imagen img_120820261.png fue seleccionada de la carpeta indicada por el responsable, quien confirmó su uso para validación y pruebas. Se inspeccionó visualmente sin observar identificadores de paciente y se copió sin modificarla al directorio de pruebas. La carga de CN-03 añadió una única radiografía al almacenamiento propio del sistema, tal como requiere el flujo autorizado. Los registros y logs que el propio sistema genera al procesar son parte de su funcionamiento; no se alteraron manualmente.')
doc.add_heading('Control de integridad y preservación',2)
doc.add_paragraph('Antes de operar se registró una línea base SHA-256 de cada fila existente de pacientes, evaluaciones, radiografías, resultados, detecciones y diagnósticos, además de los 276 archivos de uploads. Después se cotejó la misma información: ninguna fila preexistente cambió o desapareció y todos los archivos previos conservaron su hash. Se añadieron exclusivamente un paciente, una evaluación, una radiografía, un resultado, tres detecciones y un diagnóstico. La autenticación generó sus propios registros de sesión y auditoría; esas tablas no se incluyeron en el cotejo clínico.')
doc.add_paragraph('Se verificó por separado que las filas del CSV correspondientes a CN-01 y CN-04 y los 13 archivos previos de evidencia que coinciden con esos códigos conservan su contenido. El ejecutor restringió operaciones a los registros nuevos de esta fase y no registró bloqueos. No se intentó sobrescribir radiografías o reprocesar evaluaciones existentes. Manifiestos: Fase2B_integridad_antes.json y Fase2B_integridad_despues.json.')
doc.add_heading('Verificación del PDF descargado',2)
doc.add_paragraph('Archivo CN-05_diagnostico_prueba.pdf; nombre sugerido por el sistema diagnostico_PruebaTesisPacienteFicticio.pdf; 3749711 bytes y dos páginas. Se comprobaron su estructura, el expediente 201, el DNI 99103125, el texto ficticio, la radiografía y los tres recuadros. Se renderizaron y revisaron visualmente ambas páginas. SHA-256 '+pdf_check['sha256']+'.')
doc.add_paragraph('El PDF muestra confianzas 54,1 %, 53,8 % y 50,3 %, mientras la interfaz presenta distribuciones enteras ajustadas a 100. El PDF identifica a Aldo Montenegro Delgado, aunque la sesión utilizada corresponde a Plis Plis. CN-05 acredita persistencia y descarga del expediente; la correspondencia de la identidad del odontólogo queda expresamente fuera de esa aprobación funcional. No se corrigió la diferencia.')
doc.save(root/'Informe_Pruebas_Sonrie.docx')
check=Document(root/'Informe_Pruebas_Sonrie.docx')
assert all(case_paragraphs(check,c)==protected[c] for c in protected)
assert len(check.inline_shapes)==14
assert sum(r['Estado']=='No ejecutado' for r in rows)==5
print('Fase 2B registrada: CN-02, CN-03 y CN-05 Aprobado; CN-01/CN-04 conservados; cinco CB No ejecutado. Word con 14 capturas insertadas.')
