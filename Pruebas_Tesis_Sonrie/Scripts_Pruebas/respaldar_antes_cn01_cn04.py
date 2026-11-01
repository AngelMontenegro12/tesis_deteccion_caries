"""Respaldo no destructivo. Ejecutar solo tras autorización del responsable.

Usa el Python existente del backend; no importa la aplicación ni inicia servicios.
No restaura datos, no ejecuta pruebas y no imprime credenciales.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import shutil
import subprocess
from urllib.parse import urlsplit, unquote
from dotenv import dotenv_values

project = Path(__file__).resolve().parents[2]
output = project / 'Pruebas_Tesis_Sonrie' / 'Respaldos_Sistema' / datetime.now().strftime('%Y%m%d_%H%M%S')
dump = Path(r'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe')
source = project / 'backend' / 'uploads'
config = dotenv_values(project / 'backend' / '.env')
url = urlsplit(str(config.get('DATABASE_URL') or ''))
database = unquote(url.path.lstrip('/'))
if not dump.is_file() or not source.is_dir() or not database or not url.hostname:
    raise SystemExit('Falta herramienta, carpeta uploads o configuración de base de datos. No se creó respaldo.')
output.mkdir(parents=True, exist_ok=False)
environment = os.environ.copy()
environment['MYSQL_PWD'] = unquote(url.password or '')
args = [str(dump), '--host=' + url.hostname, '--port=' + str(url.port or 3306),
        '--user=' + unquote(url.username or ''), '--single-transaction', '--quick',
        '--routines', '--triggers', '--events', '--hex-blob', '--no-tablespaces',
        '--set-gtid-purged=OFF', '--result-file=' + str(output / 'base_datos.sql'), database]
result = subprocess.run(args, env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
environment.pop('MYSQL_PWD', None)
if result.returncode:
    (output / 'ESTADO.txt').write_text('RESPALDO INCOMPLETO: mysqldump falló. No ejecutar pruebas. Revisar permisos o compatibilidad sin divulgar credenciales.\n', encoding='utf-8')
    raise SystemExit('mysqldump falló; no se imprimen sus mensajes para proteger la configuración. No continuar con pruebas.')
sql = output / 'base_datos.sql'
if not sql.is_file() or sql.stat().st_size == 0:
    raise SystemExit('Exportación vacía; respaldo no válido. No continuar.')
shutil.copytree(source, output / 'uploads')
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''): h.update(block)
    return h.hexdigest()
records=[]
for original in sorted(source.rglob('*')):
    if not original.is_file(): continue
    relative=original.relative_to(source)
    copied=output/'uploads'/relative
    a,b=digest(original),digest(copied)
    if a != b: raise SystemExit('Un archivo cambió durante el respaldo o no coincide. No continuar con pruebas.')
    records.append({'archivo':relative.as_posix(),'bytes':copied.stat().st_size,'sha256':b})
if len(records) != sum(p.is_file() for p in (output/'uploads').rglob('*')):
    raise SystemExit('El inventario de archivos no coincide. No continuar.')
manifest={'fecha_utc':datetime.now(timezone.utc).isoformat(),'base_datos':database,
          'sql_bytes':sql.stat().st_size,'sql_sha256':digest(sql),'archivos_uploads':records,
          'limitaciones':['No se realizó restauración de prueba.',
                          'single-transaction proporciona consistencia para tablas transaccionales; requiere comprobar motores.',
                          'Evitar escrituras concurrentes durante la exportación y copia de archivos.',
                          'El respaldo contiene datos existentes; no compartirlo como evidencia de la tesis.']}
(output/'manifiesto.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(output/'ESTADO.txt').write_text('EXPORTACIÓN Y COPIA COMPLETADAS. Integridad SHA-256 de archivos comprobada. Restauración no ensayada. Revisar limitaciones del manifiesto antes de autorizar pruebas.\n',encoding='utf-8')
print('Respaldo creado en: '+str(output))
print('Archivos copiados y cotejados: '+str(len(records)))
print('No se ejecutaron pruebas ni se modificaron datos de origen.')
