"""Lecturas de integridad de filas existentes, uploads y evidencias anteriores."""
from pathlib import Path
import hashlib,json,csv,sys
from datetime import datetime,timezone
from dotenv import dotenv_values
from sqlalchemy import create_engine,inspect,text
root=Path(__file__).resolve().parents[2]
out=root/'Pruebas_Tesis_Sonrie'/'Evidencias_Caja_Negra'
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(1048576),b''):h.update(block)
    return h.hexdigest()
engine=create_engine(dotenv_values(root/'backend'/'.env')['DATABASE_URL'])
tables=['pacientes','evaluaciones_diagnosticas','radiografias','resultados_deteccion','detecciones_caries','diagnosticos_odontologo']
data={'fecha_utc':datetime.now(timezone.utc).isoformat(),'tablas':{},'uploads':{},'evidencias_previas':{},'resultados_previos':{}}
with engine.connect() as conn:
    inspector=inspect(conn)
    for table in tables:
        keys=inspector.get_pk_constraint(table)['constrained_columns']
        rows=conn.execute(text('SELECT * FROM `'+table+'`')).mappings().all()
        data['tablas'][table]={':'.join(str(r[k]) for k in keys):hashlib.sha256(json.dumps(dict(r),sort_keys=True,default=str,ensure_ascii=False).encode()).hexdigest() for r in rows}
engine.dispose()
for p in (root/'backend'/'uploads').rglob('*'):
    if p.is_file():data['uploads'][p.relative_to(root/'backend'/'uploads').as_posix()]=sha(p)
for pattern in ['CN-01*','CN-04*']:
    for p in out.glob(pattern):
        if p.is_file():data['evidencias_previas'][p.name]=sha(p)
with (root/'Pruebas_Tesis_Sonrie'/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    for r in csv.DictReader(f):
        if r['Codigo'] in ['CN-01','CN-04']:data['resultados_previos'][r['Codigo']]=r
stage=sys.argv[1]
if stage=='antes':
    p=out/'Fase2B_integridad_antes.json'
    if p.exists():raise SystemExit('Ya existe línea base; no se sobrescribe.')
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'tablas':{t:len(v) for t,v in data['tablas'].items()},'uploads':len(data['uploads']),'evidencias_anteriores':len(data['evidencias_previas'])}))
else:
    old=json.loads((out/'Fase2B_integridad_antes.json').read_text(encoding='utf-8'))
    result={'fecha_utc':data['fecha_utc'],'cambios_filas_previas':{},'nuevas_filas':{},'uploads_anteriores_alterados':[],'nuevos_uploads':[],'evidencias_anteriores_intactas':old['evidencias_previas']==data['evidencias_previas'],'resultados_cn01_cn04_intactos':old['resultados_previos']==data['resultados_previos']}
    for t,rows in old['tablas'].items():
        result['cambios_filas_previas'][t]=[k for k,v in rows.items() if data['tablas'][t].get(k)!=v]
        result['nuevas_filas'][t]=sorted(set(data['tablas'][t])-set(rows))
    result['uploads_anteriores_alterados']=[k for k,v in old['uploads'].items() if data['uploads'].get(k)!=v]
    result['nuevos_uploads']=sorted(set(data['uploads'])-set(old['uploads']))
    (out/'Fase2B_integridad_despues.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
