"""Prepara archivos ficticios y documenta impedimentos; no llama al sistema."""
from pathlib import Path
from datetime import datetime
import csv, shutil, hashlib
from PIL import Image, ImageDraw
from docx import Document

root=Path(__file__).resolve().parents[1]
stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
backup=root/'Scripts_Pruebas'/'Respaldos'/stamp
backup.mkdir(parents=True,exist_ok=False)
for name in ['Informe_Pruebas_Sonrie.docx','Resultados_Pruebas.csv']:
    shutil.copy2(root/name,backup/name)
fixtures=root/'Scripts_Pruebas'/'Archivos_Ficticios_CN04'
fixtures.mkdir(exist_ok=True)
def write_new(name,data):
    p=fixtures/name
    if p.exists():
        raise FileExistsError(p)
    p.write_bytes(data)
write_new('CN04_incompatible.txt',b'Archivo ficticio para CN-04. No es una imagen. Sin datos personales.\n')
write_new('CN04_corrupto.png',b'\x89PNG\r\n\x1a\nCONTENIDO_FICTICIO_SIN_ESTRUCTURA_PNG')
im=Image.new('RGB',(400,800),'white')
draw=ImageDraw.Draw(im)
draw.rectangle((40,160,360,620),fill='lightblue',outline='black',width=5)
draw.text((40,70),'CN-04 IMAGEN VERTICAL FICTICIA',fill='black')
draw.text((40,690),'NO ES UNA RADIOGRAFIA',fill='black')
p=fixtures/'CN04_no_panoramica_vertical.png'
if p.exists(): raise FileExistsError(p)
im.save(p)
with (root/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f); headers=reader.fieldnames; rows=list(reader)
reasons={
 'CN-01':'No se inició sesión: no se verificó una instancia aislada ni se dispone de una cuenta ficticia validada. El login escribe sesiones y auditoría. Pendiente de autorización para preparar el entorno o de información de un entorno existente.',
 'CN-04':'No se ejecutaron variantes de interfaz. Llegar al paso de radiografías requiere guardar una evaluación; no se verificó aislamiento. Se prepararon un TXT incompatible, un PNG corrupto y una imagen vertical ficticia. Sin archivo, incompatible, corrupto y no panorámica quedan bloqueados hasta disponer de condiciones seguras.'
}
for row in rows:
    if row['Codigo'] in reasons:
        row['Resultado obtenido']=reasons[row['Codigo']]
        row['Estado']='Bloqueado'
        row['Evidencia']='Sin captura: variante no ejecutada por falta de aislamiento verificado'
with (root/'Resultados_Pruebas.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=headers); writer.writeheader(); writer.writerows(rows)
doc=Document(root/'Informe_Pruebas_Sonrie.docx')
active=None
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'):
        active=next((code for code in reasons if p.text.startswith(code+' ')),None)
    if active:
        if p.text.startswith('Resultado obtenido '): p.text='Resultado obtenido '+reasons[active]
        elif p.text.startswith('Estado de la prueba '): p.text='Estado de la prueba Bloqueado'
        elif p.text.startswith('Evidencia '): p.text='Evidencia Sin captura: prueba no ejecutada por falta de condiciones seguras.'
for t in doc.tables:
    for row in t.rows:
        if row.cells[0].text in reasons: row.cells[-1].text='Bloqueado'
for p in doc.paragraphs:
    if p.text.startswith('Los diez casos están preparados y no ejecutados.'):
        p.text='CN-01 y CN-04 están bloqueados por falta de aislamiento verificado. Ningún caso ha sido ejecutado; los otros ocho permanecen en estado No ejecutado. No hay resultados de aprobación, fallo ni métricas de cobertura.'
doc.add_page_break()
doc.add_heading('Registro de preparación de la Fase 2',1)
doc.add_paragraph('Alcance exclusivo: CN-01 y CN-04. No se iniciaron sesiones, no se enviaron archivos al servidor ni se ejecutaron otros casos. La inspección estática identificó escrituras de sesión y auditoría en login y persistencia de una evaluación al avanzar del contexto clínico a la carga de radiografías. No se ha acreditado una instancia aislada de los servicios en ejecución.')
doc.add_heading('Variantes de CN 04',2)
for text in [
 'Sin archivo — Bloqueado. No se llegó al paso de radiografías; no se observó el estado del botón ni un mensaje en ejecución.',
 'Archivo incompatible — Bloqueado. Preparado CN04_incompatible.txt; no enviado ni seleccionado en la interfaz.',
 'Archivo corrupto — Bloqueado. Preparado CN04_corrupto.png con firma PNG y cuerpo deliberadamente inválido; no enviado ni seleccionado.',
 'Imagen no panorámica — Bloqueado. Preparado CN04_no_panoramica_vertical.png de 400 × 800 píxeles, con dibujo y texto ficticios; no enviado ni seleccionado.'
]: doc.add_paragraph(text)
doc.add_paragraph('No se generaron capturas de evidencia porque no se ejecutaron los flujos. Los archivos ficticios son entradas preparadas, no resultados ni evidencia de comportamiento del sistema. Los mensajes y la posibilidad de continuar siguen sin observación empírica.')
doc.add_heading('Preparación propuesta del entorno aislado',2)
doc.add_paragraph('Requiere autorización. Preparar una instancia adicional dentro de Pruebas_Tesis_Sonrie con base de datos nueva sin datos reales, cuenta ficticia, paciente sintético y carpetas propias de uploads y logs. Utilizar las dependencias existentes y comprobar compatibilidad antes de iniciar. SQLite solo sería una alternativa si los modelos y las consultas requeridas son compatibles; de lo contrario se necesitaría una base MySQL exclusiva y permisos limitados a ella.')
doc.add_paragraph('Mantener los servicios actuales y sus archivos intactos. La interfaz contiene URLs absolutas a localhost:5000 y localhost:8000: abrirla en otro puerto no aísla sus peticiones. La instancia de prueba requiere un contexto de red separado que conserve esas direcciones dentro del aislamiento, o una solución de encaminamiento de pruebas expresamente documentada y autorizada, sin modificar el código original ni simular resultados de negocio. Verificar los destinos reales antes de cualquier login o carga.')
doc.add_paragraph('Todos los archivos y logs de la ejecución futura deberán permanecer dentro de la carpeta de pruebas. Se deberá comprobar que los modelos y registros del microservicio no se escriban en la instancia actual. Las credenciales se introducirán de manera privada y no aparecerán en documentos ni capturas. La creación de datos sintéticos para disponer del escenario de CN-04 será preparación del entorno, sin ejecutar CN-02, CN-03 ni CN-05.')
doc.save(root/'Informe_Pruebas_Sonrie.docx')
lines=['# Archivos ficticios para CN-04','','Ninguno se ha cargado al servidor. No son evidencia de ejecución.','']
for p in sorted(fixtures.iterdir()):
    if p.is_file(): lines.append(f'- {p.name}: {p.stat().st_size} bytes; SHA-256 {hashlib.sha256(p.read_bytes()).hexdigest()}')
(fixtures/'LEEME.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
assert sum(r['Estado']=='Bloqueado' for r in rows)==2
assert sum(r['Estado']=='No ejecutado' for r in rows)==8
print('Preparación completada. Dos casos bloqueados, ocho no ejecutados. Sin llamadas al sistema.')
