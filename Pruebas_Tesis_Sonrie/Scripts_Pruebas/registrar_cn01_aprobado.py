"""Actualiza documentación a partir de observaciones reales de Playwright."""
from pathlib import Path
from datetime import datetime
import json,csv,shutil
from docx import Document
from docx.shared import Cm

root=Path(__file__).resolve().parents[1]
evidence=root/'Evidencias_Caja_Negra'
obs=json.loads((evidence/'CN-01_observaciones_playwright.json').read_text())
assert obs['formulario_observado'] and obs['login_http']==200 and obs['dashboard_observado']
assert obs['url']=='http://localhost:3000/dashboard'
image=evidence/'CN-01_dashboard_playwright.png'
assert image.is_file()
backup=root/'Scripts_Pruebas'/'Respaldos'/('CN01_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
for name in ['Informe_Pruebas_Sonrie.docx','Resultados_Pruebas.csv']:shutil.copy2(root/name,backup/name)
result='Playwright observó el formulario en una instancia independiente de Chromium, el usuario introdujo las credenciales ficticias de forma privada y envió el formulario. POST /api/auth/login respondió HTTP 200 el 31/10/2026 a las 17:10:00 (America/Bogota). Se observó navegación a http://localhost:3000/dashboard y se capturó el Panel de Inicio a las 17:10:01 con la cuenta Plis Plis. No se registraron contraseñas ni tokens. La persistencia interna de sesión y auditoría no se evaluó en este caso de caja negra.'
pending='Variantes de CN-04 aún no ejecutadas. El usuario confirmó respaldo completo y autorizó usar el sistema actual. Hay archivos ficticios preparados. Se requiere continuar con una sesión controlable de Playwright y un escenario ficticio exclusivo; no se guardarán radiografías incompatibles ni se modificarán evaluaciones existentes.'
with (root/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    r=csv.DictReader(f);fields=r.fieldnames;rows=list(r)
for r in rows:
    if r['Codigo']=='CN-01':r.update({'Resultado obtenido':result,'Estado':'Aprobado','Evidencia':'Evidencias_Caja_Negra/CN-01_dashboard_playwright.png; Evidencias_Caja_Negra/CN-01_observaciones_playwright.json'})
    elif r['Codigo']=='CN-04':r.update({'Resultado obtenido':pending,'Estado':'Bloqueado','Evidencia':'Pendiente de captura de variantes; preparación disponible en Scripts_Pruebas/Archivos_Ficticios_CN04/'})
assert sum(r['Estado']=='No ejecutado' for r in rows)==8
with (root/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
doc=Document(root/'Informe_Pruebas_Sonrie.docx')
active=None
for p in list(doc.paragraphs):
    if p.style.name.startswith('Heading'):
        active=next((code for code in ['CN-01','CN-04'] if p.text.startswith(code+' ')),None)
    if active:
        if p.text.startswith('Resultado obtenido '):p.text='Resultado obtenido '+(result if active=='CN-01' else pending)
        elif p.text.startswith('Estado de la prueba '):p.text='Estado de la prueba '+('Aprobado' if active=='CN-01' else 'Bloqueado')
        elif p.text.startswith('Evidencia '):
            if active=='CN-01':
                p.text='Evidencia CN-01_dashboard_playwright.png y CN-01_observaciones_playwright.json, en Evidencias_Caja_Negra.'
                caption=p.insert_paragraph_before('Figura CN 01 Panel de Inicio después de autenticación HTTP 200')
                figure=p.insert_paragraph_before();figure.add_run().add_picture(str(image),width=Cm(16))
            else:p.text='Evidencia Pendiente de captura de las variantes de CN-04.'
    if p.text.startswith('CN-01 y CN-04 están bloqueados'):
        p.text='CN-01 aprobado mediante ejecución completa con Playwright. CN-04 pendiente de ejecución de sus variantes y temporalmente bloqueado por falta de continuidad de automatización y escenario ficticio verificado. Los otros ocho casos permanecen No ejecutado.'
    elif p.text.startswith('Condiciones de ejecución futura:'):
        p.text='El responsable confirmó respaldo completo de base de datos y uploads y autorizó las pruebas CN-01 y CN-04 sobre los servicios actuales en 3000, 5000 y 8000. El respaldo SQL fue inspeccionado, pero la copia de uploads no se cotejó independientemente. Se usarán cuenta y datos ficticios; no se modificarán registros existentes ni se reprocesarán evaluaciones. Se descargó Chromium para Playwright únicamente dentro de la carpeta de pruebas con autorización.'
    elif p.text.startswith('Alcance exclusivo: CN-01 y CN-04. No se iniciaron sesiones'):
        p.text='Registro actualizado de Fase 2. Se ejecutó CN-01 y se observó autenticación exitosa y acceso al panel. CN-04 sigue sin ejecutar sus variantes. No se han ejecutado CN-02, CN-03, CN-05 ni casos de caja blanca.'
    elif p.text.startswith('No se generaron capturas de evidencia porque'):
        p.text='Se generó una captura real del dashboard para CN-01. No hay capturas de variantes de CN-04; sus archivos ficticios son entradas preparadas y no evidencia de comportamiento.'
    elif p.text=='Preparación propuesta del entorno aislado':p.text='Condiciones vigentes del entorno autorizado'
    elif p.text.startswith('Requiere autorización. Preparar una instancia adicional'):
        p.text='El responsable descartó una segunda instancia y autorizó los servicios actuales tras confirmar respaldo completo. No se creó otra base, no se restauraron respaldos ni se reiniciaron servicios.'
    elif p.text.startswith('Mantener los servicios actuales y sus archivos intactos.'):
        p.text='Se mantienen el código, las configuraciones y los modelos originales. La automatización limita las acciones al alcance autorizado. El futuro ejecutor de CN-04 bloquea solicitudes de cambio a registros existentes, almacenamiento de radiografías, finalización y procesamiento; cualquier intervención de esa barrera debe consignarse y no se atribuirá al sistema como validación propia.'
    elif p.text.startswith('Se deberá comprobar'):
        pass
for t in doc.tables:
    for row in t.rows:
        if row.cells[0].text=='CN-01':row.cells[-1].text='Aprobado'
        elif row.cells[0].text=='CN-04':row.cells[-1].text='Bloqueado'
doc.save(root/'Informe_Pruebas_Sonrie.docx')
print('CN-01 aprobado con captura insertada. CN-04 pendiente; otros ocho casos No ejecutado.')
