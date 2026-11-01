"""Genera reportes desde resultados ya ejecutados; no vuelve a probar el sistema."""
from pathlib import Path
import json,csv,html,hashlib
from collections import Counter

ROOT=Path(__file__).resolve().parents[1];PROJECT=ROOT.parent;OUT=ROOT/'Evidencias_Caja_Blanca'
rows=[]
for name in ['CB-01_CB-02_resultados.json','CB-03_CB-04_CB-05_resultados.json','CB-04_frontend_resultados.json']:
    rows.extend(json.loads((OUT/name).read_text(encoding='utf-8'))['variantes'])
assert len(rows)==111
with (OUT/'Variantes_Caja_Blanca.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['Caso','Variante','Datos simulados','Funciones','Esperado','Obtenido','Estado'])
    for r in rows:w.writerow([r['caso'],r['variante'],r['datos'],', '.join(r['funciones']),json.dumps(r['esperado'],ensure_ascii=False),json.dumps(r.get('obtenido'),ensure_ascii=False),r['estado']])
titles={'CB-01':'Rutas internas del inicio de sesión','CB-02':'Bloqueo por intentos fallidos','CB-03':'Validación de datos del paciente','CB-04':'Validación de imágenes y errores HTTP','CB-05':'Precondiciones y generación del PDF'}
focus={
'CB-01':['sin_credenciales','correo_invalido','usuario_inexistente','clave_incorrecta','credenciales_ficticias_correctas','excepcion_persistencia_en_login_exitoso'],
'CB-02':['umbral_clave_erronea','clave_correcta_durante_bloqueo','vence_1300','exito_reinicia_contador','duracion_300_segundos','otra_ip_independiente'],
'CB-03':['valid_dni_1','valid_dni_4','valid_date_4','menor_sin_apoderado','menor_con_apoderado_valido','cumple_18_hoy'],
'CB-04':['archivo_corrupto','tecnica_vertical','ruta_validate_aceptada','frontend_http_400_debe_rechazarse','frontend_http_500_debe_rechazarse','frontend_error_de_red_debe_rechazarse'],
'CB-05':['inexistente','pendiente','sin_diagnostico','completada_generador_real_sin_radiografias','falta_pymupdf','error_generico']}
snippets={
'CB-01':('backend/app/routes/auth.py',"    if not data or not data.get('correo') or not data.get('contrasena'):",4),
'CB-02':('backend/app/routes/auth.py',"        if registro['bloqueado_hasta'] and tiempo_actual < registro['bloqueado_hasta']:",5),
'CB-03':('backend/app/utils/validation.py',"    if minor and not str(merged.get('apoderado') or '').strip():",5),
'CB-04':('frontend/src/pages/EvaluacionClinica.jsx','      return true;',7),
'CB-05':('backend/app/routes/evaluaciones.py',"    if evaluacion.estado != 'completada':",5)}
metadata={}
def value(obj):
    if isinstance(obj,dict):
        return '; '.join(str(k)+'='+str(v) for k,v in obj.items() if k not in ['mensajes','estado_cargando_final'])
    return str(obj)
for code,title in titles.items():
    own=[r for r in rows if r['caso']==code];counts=Counter(r['estado'] for r in own);state='Fallido' if counts['Fallido'] else 'Aprobado'
    source,needle,n=snippets[code];lines=(PROJECT/source).read_text(encoding='utf-8-sig').splitlines();start=next(i for i,x in enumerate(lines) if needle in x);snippet='\n'.join(f'{i+1:4}  {lines[i]}' for i in range(start,min(start+n,len(lines))))
    if code=='CB-04':
        start=next(i for i,x in enumerate(lines) if 'const validateImage = async' in x)
        pos=next(i for i in range(start,len(lines)) if lines[i].strip()=='return true;')
        snippet='\n'.join(f'{i+1:4}  {lines[i]}' for i in range(pos,min(pos+7,len(lines))))
    selected=[next(r for r in own if r['variante']==name) for name in focus[code]]
    table=''.join('<tr><td>'+html.escape(r['variante'].replace('_',' '))+'</td><td>'+html.escape(value(r['esperado']))+'</td><td>'+html.escape(value(r.get('obtenido')))+'</td><td class="'+('fail' if r['estado']=='Fallido' else 'pass')+'">'+r['estado']+'</td></tr>' for r in selected)
    note='106 variantes Python con unittest y 5 variantes JavaScript con node:test. Sin llamadas a los servicios, MySQL, esperas de bloqueo ni inferencia de modelos reales.'
    page=f'''<!doctype html><html lang="es"><meta charset="utf-8"><title>{code} Reporte real</title><style>
body{{font:20px/1.35 Arial,sans-serif;margin:30px;color:#17212b}}h1{{font-size:28px;margin:0 0 8px}}h2{{font-size:23px;margin:16px 0 8px}}p{{margin:8px 0}}.meta{{font-size:18px;color:#425466}}table{{border-collapse:collapse;width:100%;table-layout:fixed;font-size:18px}}th,td{{border:1px solid #cbd5e1;padding:9px;overflow-wrap:anywhere;text-align:left}}th{{background:#e8eef2}}th:first-child{{width:30%}}th:last-child{{width:13%}}.fail{{color:#a21919;font-weight:bold}}.pass{{color:#166534;font-weight:bold}}pre{{background:#f5f6f7;padding:12px;font:16px/1.4 Consolas,monospace;white-space:pre-wrap}}footer{{font-size:17px;margin-top:14px}}
</style><h1>{code} {title}</h1><p><b>Estado {state}</b> · {len(own)} variantes · {counts['Aprobado']} aprobadas · {counts['Fallido']} fallidas · {counts['Bloqueado']} bloqueadas</p><p class="meta">Ejecución del 31 de octubre de 2026 · Datos y dependencias simulados · Código original</p><h2>Resultados reales seleccionados</h2><table><tr><th>Variante</th><th>Esperado</th><th>Obtenido</th><th>Estado</th></tr>{table}</table><p class="meta">Muestra de {len(selected)} variantes. Todas las variantes y sus resultados están en Variantes_Caja_Blanca.csv y los reportes JSON.</p><h2>Fragmento original ejecutado</h2><p class="meta">{html.escape(source)}</p><pre>{html.escape(snippet)}</pre><footer>{note}<br>Sin porcentaje de cobertura: coverage no está instalado. Se conservan trazas de líneas y transiciones Python; no representan una medición total de ramas.</footer></html>'''
    (OUT/(code+'_reporte.html')).write_text(page,encoding='utf-8')
    metadata[code]={'estado':state,'variantes':len(own),'aprobadas':counts['Aprobado'],'fallidas':counts['Fallido'],'bloqueadas':counts['Bloqueado'],'funciones':sorted(set(f for r in own for f in r['funciones'])),'fragmento':snippet,'archivo':source,'reporte':code+'_reporte.html','captura':code+'_reporte_ejecucion.png'}
(OUT/'Resumen_Caja_Blanca.json').write_text(json.dumps({'variantes_totales':len(rows),'aprobadas':sum(r['estado']=='Aprobado' for r in rows),'fallidas':sum(r['estado']=='Fallido' for r in rows),'casos':metadata},ensure_ascii=False,indent=2),encoding='utf-8')
# Línea base documental: preservar todos los resultados y archivos de caja negra.
baseline={'csv':[],'evidencias':{}}
with (ROOT/'Resultados_Pruebas.csv').open(encoding='utf-8-sig',newline='') as f:
    baseline['csv']=[r for r in csv.DictReader(f) if r['Codigo'].startswith('CN-')]
for p in (ROOT/'Evidencias_Caja_Negra').rglob('*'):
    if p.is_file():baseline['evidencias'][p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
bp=OUT/'Integridad_Caja_Negra_antes_actualizar.json'
if not bp.exists():bp.write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({c:{k:v for k,v in x.items() if k in ['estado','variantes','aprobadas','fallidas','bloqueadas']} for c,x in metadata.items()},ensure_ascii=False))
