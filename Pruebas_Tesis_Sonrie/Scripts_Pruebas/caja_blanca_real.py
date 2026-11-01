"""Ejecuta cuerpos originales seleccionados con AST y dependencias controladas.

No importa create_app, modelos ORM ni el inicializador YOLO. No usa los servicios.
Los nodos se compilan con archivo y líneas originales, sin reescribir sus cuerpos.
"""
import sys
sys.dont_write_bytecode=True
import ast,asyncio,contextlib,csv,hashlib,importlib.util,io,json,os,re,socket,time,types,unittest,unicodedata,tempfile
from pathlib import Path
from datetime import date,datetime,timedelta
from unittest.mock import MagicMock,patch
from flask import Flask,Blueprint,request,jsonify,send_file,current_app

PROJECT=Path(__file__).resolve().parents[2]
ROOT=PROJECT/'Pruebas_Tesis_Sonrie'
OUT=ROOT/'Evidencias_Caja_Blanca'
TEMP=ROOT/'Scripts_Pruebas'/'Temporal_Fase3'
OUT.mkdir(exist_ok=True);TEMP.mkdir(exist_ok=True)
os.chdir(TEMP)
os.environ['PYTHONDONTWRITEBYTECODE']='1'
os.environ['TORCH_HOME']=str(TEMP/'torch_cache')
os.environ['HF_HOME']=str(TEMP/'hf_cache')
ROWS=[];FUNCTIONS={};LINES={};ARCS={}
class FixedDate(date):
    @classmethod
    def today(cls):return cls(2026,10,31)

def load_functions(relative,names,env):
    path=PROJECT/relative
    tree=ast.parse(path.read_text(encoding='utf-8-sig'),filename=str(path))
    selected=[n for n in tree.body if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name in names]
    assert {n.name for n in selected}==set(names)
    env.update({'__file__':str(path),'__name__':'ensayo_'+path.stem})
    exec(compile(ast.Module(body=selected,type_ignores=[]),str(path),'exec'),env)
    for n in selected:FUNCTIONS[(str(path),n.name)]={'archivo':relative,'funcion':n.name,'linea':n.lineno,'fin':n.end_lineno,'sha256_archivo':hashlib.sha256(path.read_bytes()).hexdigest()}
    return types.SimpleNamespace(**{n:env[n] for n in names})

def traced(frame,event,arg):
    key=(frame.f_code.co_filename,frame.f_code.co_name)
    if key in FUNCTIONS:
        if event=='line':
            LINES.setdefault(key,set()).add(frame.f_lineno)
            old=LAST.get(id(frame))
            if old is not None:ARCS.setdefault(key,set()).add((old,frame.f_lineno))
            LAST[id(frame)]=frame.f_lineno
        elif event=='return':LAST.pop(id(frame),None)
    return traced
LAST={}
def in_memory_async(coro):
    # Estas corutinas solo esperan BytesIO y funciones simuladas ya resueltas.
    # Se ejecuta el await original sin crear sockets internos de un event loop.
    try:
        coro.send(None)
    except StopIteration as end:return end.value
    finally:coro.close()
    raise RuntimeError('Corutina suspendida inesperadamente; no se permite I/O real')
def variant(group,name,inputs,expected,call,functions):
    def test():
        entry={'caso':group,'variante':name,'datos':inputs,'esperado':expected,'funciones':functions}
        old=sys.gettrace();sys.settrace(traced)
        try:
            observed=call();entry['obtenido']=observed
            if observed!=expected:
                entry['estado']='Fallido';raise AssertionError('Esperado '+repr(expected)+'; obtenido '+repr(observed))
            entry['estado']='Aprobado'
        except Exception as e:
            entry.setdefault('estado','Bloqueado' if not isinstance(e,AssertionError) else 'Fallido')
            entry['error']=type(e).__name__+': '+str(e)
            raise
        finally:
            sys.settrace(old);ROWS.append(entry)
    return unittest.FunctionTestCase(test,description=group+' '+name)

validation_env={'re':re,'date':FixedDate}
validation=load_functions('backend/app/utils/validation.py',['valid_email','valid_phone','valid_dni','valid_date','patient_error'],validation_env)
import bcrypt
security_env={'bcrypt':bcrypt}
security=load_functions('backend/app/utils/security.py',['hash_password','verify_password'],security_env)
SYNTHETIC_HASH=security.hash_password('ClaveSoloSimuladaCB')

class AuthFixture:
    def __init__(self):
        self.user=types.SimpleNamespace(id_odontologo=42,contrasena_hash=SYNTHETIC_HASH,to_dict=lambda:{'id_odontologo':42,'correo':'cuenta@example.test'})
        self.model=MagicMock();self.model.query.filter_by.return_value.first.return_value=self.user
        self.db=types.SimpleNamespace(session=MagicMock())
        self.clock=1000.0
        self.env={'Blueprint':Blueprint,'request':request,'jsonify':jsonify,'datetime':datetime,'timedelta':timedelta,'secrets':types.SimpleNamespace(token_urlsafe=lambda n:'TOKEN_FICTICIO_SIN_VALIDEZ'),'time':types.SimpleNamespace(time=lambda:self.clock),'db':self.db,'Odontologo':self.model,'HistorialAcceso':lambda **kw:types.SimpleNamespace(**kw),'Sesion':lambda **kw:types.SimpleNamespace(**kw),'verify_password':security.verify_password,'valid_email':validation.valid_email,'auth_bp':Blueprint('auth_ensayo',__name__,url_prefix='/api/auth'),'intentos_login':{},'MAX_INTENTOS':5,'TIEMPO_BLOQUEO':300,'DURACION_SESION_HORAS':24}
        self.auth=load_functions('backend/app/routes/auth.py',['_obtener_dispositivo','_registrar_acceso','login'],self.env)
        self.app=Flask('ensayo_auth');self.app.testing=True;self.app.register_blueprint(self.env['auth_bp']);self.client=self.app.test_client()
    def post(self,data=None,ip='192.0.2.44'):
        r=self.client.post('/api/auth/login',json=data or {},environ_overrides={'REMOTE_ADDR':ip})
        return r
    def fail(self,missing=False):
        if missing:self.model.query.filter_by.return_value.first.return_value=None
        return self.post({'correo':'cuenta@example.test','contrasena':'ClaveFicticiaIncorrecta'})
    def success(self):return self.post({'correo':'cuenta@example.test','contrasena':'ClaveSoloSimuladaCB'})

def auth_tests():
    suite=[]
    cases=[('sin_credenciales',{},400,False),('sin_correo',{'contrasena':'ficticia'},400,False),('sin_clave',{'correo':'cuenta@example.test'},400,False),('correo_invalido',{'correo':'sin-arroba','contrasena':'ficticia'},400,False),('usuario_inexistente',{'correo':'cuenta@example.test','contrasena':'ficticia'},401,True),('clave_incorrecta',{'correo':'cuenta@example.test','contrasena':'ficticia'},401,False),('credenciales_ficticias_correctas',{'correo':'cuenta@example.test','contrasena':'ClaveSoloSimuladaCB'},200,False)]
    for name,data,status,missing in cases:
        def check(data=data,missing=missing):
            f=AuthFixture()
            if missing:f.model.query.filter_by.return_value.first.return_value=None
            return f.post(data).status_code
        suite.append(variant('CB-01',name,'JSON ficticio; usuario ORM y sesión simulados; no se usan credenciales reales',status,check,['login','valid_email','verify_password']))
    def query_active():
        f=AuthFixture();f.success();return f.model.query.filter_by.call_args.kwargs.get('activo')
    suite.append(variant('CB-01','consulta_solo_usuario_activo','Consulta ORM simulada',True,query_active,['login']))
    def invalid_no_count():
        f=AuthFixture();f.post({});f.post({'correo':'invalido','contrasena':'ficticia'});return f.env['intentos_login']['192.0.2.44']['intentos']
    suite.append(variant('CB-01','rechazos_formato_no_suman_intentos','Dos JSON inválidos',0,invalid_no_count,['login']))
    def commit_failure():
        f=AuthFixture();f.db.session.commit.side_effect=RuntimeError('fallo ficticio');r=f.success();return {'http':r.status_code,'rollback':f.db.session.rollback.called}
    suite.append(variant('CB-01','excepcion_persistencia_en_login_exitoso','Commit simulado que falla',{'http':200,'rollback':True},commit_failure,['login']))
    def audit_failure():
        f=AuthFixture();f.db.session.commit.side_effect=RuntimeError('auditoria ficticia');r=f.fail();return {'http':r.status_code,'rollback':f.db.session.rollback.called}
    suite.append(variant('CB-01','excepcion_auditoria_clave_erronea','Commit de auditoría simulado que falla',{'http':401,'rollback':True},audit_failure,['login','_registrar_acceso']))
    for missing in [False,True]:
        def limit(missing=missing):
            f=AuthFixture();return [f.fail(missing).status_code for _ in range(5)]
        suite.append(variant('CB-02','umbral_'+('usuario_ausente' if missing else 'clave_erronea'),'IP ficticia 192.0.2.44; reloj 1000; cinco fallos',[401,401,401,401,429],limit,['login']))
    def blocked():
        f=AuthFixture()
        for _ in range(5):f.fail()
        f.clock=1299;return f.success().status_code
    suite.append(variant('CB-02','clave_correcta_durante_bloqueo','Reloj justo antes del vencimiento',429,blocked,['login']))
    for when in [1300,1301]:
        def expires(when=when):
            f=AuthFixture()
            for _ in range(5):f.fail()
            f.clock=when;r=f.fail();return {'http':r.status_code,**f.env['intentos_login']['192.0.2.44']}
        suite.append(variant('CB-02','vence_'+str(when),'Reloj simulado en/después del vencimiento',{'http':401,'intentos':1,'bloqueado_hasta':None},expires,['login']))
    def success_reset():
        f=AuthFixture()
        for _ in range(4):f.fail()
        r=f.success();return {'http':r.status_code,**f.env['intentos_login']['192.0.2.44']}
    suite.append(variant('CB-02','exito_reinicia_contador','Cuatro fallos y éxito ficticio',{'http':200,'intentos':0,'bloqueado_hasta':None},success_reset,['login']))
    def duration():
        f=AuthFixture()
        for _ in range(5):f.fail()
        return f.env['intentos_login']['192.0.2.44']['bloqueado_hasta']-f.clock
    suite.append(variant('CB-02','duracion_300_segundos','Reloj fijo sin esperas reales',300.0,duration,['login']))
    def another_ip():
        f=AuthFixture()
        for _ in range(5):f.fail()
        return f.post({'correo':'cuenta@example.test','contrasena':'ClaveSoloSimuladaCB'},ip='192.0.2.45').status_code
    suite.append(variant('CB-02','otra_ip_independiente','IP A bloqueada; IP B ficticia diferente',200,another_ip,['login']))
    def before_window():
        f=AuthFixture()
        for _ in range(4):f.fail()
        f.clock=100000;return f.fail().status_code
    suite.append(variant('CB-02','fallos_previos_no_caducan','Cuatro fallos; gran salto del reloj antes del quinto',429,before_window,['login']))
    return suite

def patient_tests():
    suite=[]
    values={
      'valid_dni':[('00123456',True),('1234567',False),('123456789',False),('1234567a',False),(None,False)],
      'valid_phone':[('912345678',True),('812345678',False),('91234567',False),('9123456789',False),('',False),(None,False)],
      'valid_email':[('persona@example.test',True),('persona@dominio',False),('persona@dominio.',False),('sin-arroba',False),('',False),(None,False)],
      'valid_date':[('1900-01-01',True),('2026-10-31',True),('1899-12-31',False),('2026-11-01',False),('2001-02-29',False),('2000-02-29',True),('2000-13-01',False),('1900-1-01',False),(None,False)]}
    for name,entries in values.items():
        for i,(value,expected) in enumerate(entries,1):
            suite.append(variant('CB-03',name+'_'+str(i),repr(value)+'; hoy simulado 2026-10-31',expected,lambda name=name,value=value:getattr(validation,name)(value),[name]))
    base={'nombres':'Persona','apellidos':'Ficticia','dni':'00123456','fecha_nacimiento':'1990-01-15','genero':'Otro','telefono':'912345678','correo':''}
    rules=[('adulto_valido',{},None),('correo_opcional_vacio',{'correo':''},None),('correo_invalido',{'correo':'invalido'},'Ingrese un correo electrónico válido'),('nombre_corto',{'nombres':'A'},'Los nombres son requeridos (mínimo 2 caracteres)'),('apellido_corto',{'apellidos':''},'Los apellidos son requeridos (mínimo 2 caracteres)'),('genero_ausente',{'genero':''},'El género es requerido'),('dni_invalido',{'dni':'123'},'El DNI debe tener exactamente 8 dígitos'),('fecha_futura',{'fecha_nacimiento':'2026-11-01'},'La fecha de nacimiento debe estar entre 1900 y hoy'),('telefono_invalido',{'telefono':'812345678'},'El teléfono es requerido (9 dígitos y debe empezar en 9)'),('menor_sin_apoderado',{'fecha_nacimiento':'2015-01-01'},'El nombre del apoderado es requerido para menores'),('menor_sin_telefono_apoderado',{'fecha_nacimiento':'2015-01-01','apoderado':'Tutor Ficticio'},'El teléfono del apoderado es requerido (9 dígitos y debe empezar en 9)'),('menor_telefono_apoderado_invalido',{'fecha_nacimiento':'2015-01-01','apoderado':'Tutor Ficticio','telefono_apoderado':'123'},'El teléfono del apoderado debe tener 9 dígitos y empezar en 9'),('menor_con_apoderado_valido',{'fecha_nacimiento':'2015-01-01','apoderado':'Tutor Ficticio','telefono_apoderado':'912345679'},None),('cumple_18_hoy',{'fecha_nacimiento':'2008-10-31'},None),('aun_17',{'fecha_nacimiento':'2008-11-01'},'El nombre del apoderado es requerido para menores')]
    for name,change,expected in rules:
        suite.append(variant('CB-03',name,json.dumps(change,ensure_ascii=False),expected,lambda change=change:validation.patient_error({**base,**change}),['patient_error']))
    suite.append(variant('CB-03','actualizacion_parcial_combina_datos','Objeto ficticio actual y cambio de nombres',None,lambda:validation.patient_error({'nombres':'Otra Persona'},types.SimpleNamespace(**base)),['patient_error']))
    return suite

def image_tests():
    import cv2,numpy as np
    from fastapi import UploadFile,HTTPException,APIRouter
    from starlette.datastructures import Headers
    from PIL import Image
    suite=[]
    imenv={'UploadFile':UploadFile,'HTTPException':HTTPException}
    image=load_functions('api_ia_sonrie/app/utils/image_utils.py',['process_image'],imenv)
    def upload(data=b'ficticio',mime='image/png'):
        file=tempfile.SpooledTemporaryFile(max_size=1048576,dir=TEMP);file.write(data);file.seek(0)
        return UploadFile(filename='archivo_ficticio',file=file,headers=Headers({'content-type':mime}))
    def mime_result(mime):
        try:return {'bytes':len(in_memory_async(image.process_image(upload(mime=mime))))}
        except HTTPException as e:return {'http':e.status_code,'mensaje':e.detail}
    suite.append(variant('CB-04','mime_imagen','UploadFile image/png con lectura de bytes',{'bytes':8},lambda:mime_result('image/png'),['process_image']))
    suite.append(variant('CB-04','mime_txt_incompatible','UploadFile text/plain',{'http':400,'mensaje':'El archivo debe ser una imagen.'},lambda:mime_result('text/plain'),['process_image']))
    env={'np':np,'cv2':cv2,'model':MagicMock(return_value=[]),'CONFIDENCE':0.45,'CLASS_MAP':{0:'Caries',1:'Deep Caries',2:'Periapical Lesion'},'CLASS_DISPLAY':{'Caries':'Caries Incipiente','Deep Caries':'Caries Profunda','Periapical Lesion':'Caries Periapical (Avanzada)'},'validar_con_clip':MagicMock(return_value=(True,'OK')),'validar_con_clasificador':MagicMock(return_value=(True,'OK'))}
    names=['_recortar_bordes_negros','_check_decodificable','_check_tamanio_minimo','_check_ratio_basico','validar_capa0','extraer_probabilidades','run_inference']
    detector=load_functions('api_ia_sonrie/app/services/detector.py',names,env)
    def png(w,h):return cv2.imencode('.png',np.full((h,w,3),160,dtype=np.uint8))[1].tobytes()
    for name,w,h,valid in [('horizontal',400,200,True),('ancho_299',299,100,False),('ancho_300',300,100,True),('alto_99',400,99,False),('alto_100',400,100,True),('ratio_124',372,300,False),('ratio_125',375,300,True),('vertical',400,800,False)]:
        suite.append(variant('CB-04','tecnica_'+name,f'PNG ficticio uniforme {w}x{h}',valid,lambda w=w,h=h:detector.validar_capa0(png(w,h))[0],['validar_capa0','_check_decodificable','_check_tamanio_minimo','_check_ratio_basico']))
    suite.append(variant('CB-04','archivo_corrupto','Bytes no vacíos que no son una imagen',False,lambda:detector.validar_capa0(b'PNG_FICTICIO_CORRUPTO')[0],['validar_capa0','_check_decodificable']))
    suite.append(variant('CB-04','imagen_toda_negra_sin_recorte','Array negro ficticio; rama sin coordenadas',[200,400,3],lambda:list(detector._recortar_bordes_negros(np.zeros((200,400,3),dtype=np.uint8)).shape),['_recortar_bordes_negros']))
    def border():
        a=np.zeros((300,600,3),dtype=np.uint8);a[50:250,100:500]=160;return list(detector._recortar_bordes_negros(a).shape)
    suite.append(variant('CB-04','recorte_bordes_negros','Contenido central 400x200 con padding',[210,410,3],border,['_recortar_bordes_negros']))
    def pipeline(layer):
        env['model']=MagicMock(return_value=[]);env['validar_con_clip']=MagicMock(return_value=(layer!='clip','rechazo CLIP simulado'));env['validar_con_clasificador']=MagicMock(return_value=(layer!='cls','rechazo CLS simulado'))
        out=detector.run_inference(b'corrupto' if layer=='tecnica' else png(400,200))
        return {'valid':out['valid'],'modelo_invocado':env['model'].called}
    for layer in ['tecnica','clip','cls','aceptada']:
        suite.append(variant('CB-04','pipeline_'+layer,'Validadores semánticos y modelo simulados',{'valid':layer=='aceptada','modelo_invocado':layer=='aceptada'},lambda layer=layer:pipeline(layer),['run_inference','validar_capa0']))
    def no_model():
        env['model']=None
        try:detector.run_inference(png(400,200));return 'sin error'
        except RuntimeError:return 'RuntimeError'
    suite.append(variant('CB-04','detector_no_disponible','Modelo simulado None','RuntimeError',no_model,['run_inference']))
    def inference_error():
        env['model']=MagicMock(side_effect=RuntimeError('fallo IA ficticio'));env['validar_con_clip']=lambda a:(True,'OK');env['validar_con_clasificador']=lambda a:(True,'OK')
        r=detector.run_inference(png(400,200));return {'valid':r['valid'],'error_presente':bool(r['error']),'detections':r['detections']}
    suite.append(variant('CB-04','excepcion_inferencia_devuelve_valid_true','Modelo simulado que lanza excepción',{'valid':True,'error_presente':True,'detections':[]},inference_error,['run_inference']))
    # Ejecutar los validadores reales con cargadores/modelos simulados; nunca descargar pesos.
    clsen={'_load_clasificador':lambda:False,'CLASIFICADOR_THRESHOLD':0.60,'IDX_VALIDA':1,'_cls_model':None}
    cls=load_functions('api_ia_sonrie/app/utils/cls_validator.py',['validar_con_clasificador'],clsen)
    for name,available,pred,score,expected in [('no_disponible',False,1,.9,True),('valida',True,1,.9,True),('umbral_exacto',True,1,.6,True),('clase_invalida',True,0,.2,False),('baja_confianza',True,1,.59,False)]:
        def check(available=available,pred=pred,score=score):
            clsen['_load_clasificador']=lambda:available
            probs=types.SimpleNamespace(top1=pred,top1conf=.9,data=[1-score,score]);clsen['_cls_model']=lambda *a,**k:[types.SimpleNamespace(probs=probs)]
            return cls.validar_con_clasificador(np.zeros((100,300,3),dtype=np.uint8))[0]
        suite.append(variant('CB-04','clasificador_'+name,'Salida del modelo ficticia; umbral 0,60',expected,check,['validar_con_clasificador']))
    def cls_error():
        clsen['_load_clasificador']=lambda:True;clsen['_cls_model']=MagicMock(side_effect=RuntimeError('ficticio'));return cls.validar_con_clasificador(np.zeros((100,300,3),dtype=np.uint8))[0]
    suite.append(variant('CB-04','clasificador_excepcion_deja_pasar','Excepción interna ficticia',True,cls_error,['validar_con_clasificador']))
    clip_tree=ast.parse((PROJECT/'api_ia_sonrie/app/utils/clip_validator.py').read_text(encoding='utf-8-sig'))
    constants={}
    for n in clip_tree.body:
        if isinstance(n,ast.Assign):
            for t in n.targets:
                if isinstance(t,ast.Name) and t.id in ['CLIP_LABELS','CLIP_MENSAJES','CLIP_THRESHOLD']:constants[t.id]=ast.literal_eval(n.value)
    clipenv={**constants,'cv2':cv2,'PILImage':Image,'torch':types.SimpleNamespace(no_grad=contextlib.nullcontext),'_load_clip':lambda:False,'_clip_processor':lambda **kw:{},'_clip_model':None}
    clip=load_functions('api_ia_sonrie/app/utils/clip_validator.py',['validar_con_clip'],clipenv)
    for name,available,scores,expected in [('no_disponible',False,[.9,.1,0,0,0,0,0,0],True),('valida_ganadora',True,[.8,.1,.1,0,0,0,0,0],True),('valida_no_ganadora',True,[.3,0,0,0,0,.7,0,0],True),('foto_rechazada',True,[.3,0,0,.7,0,0,0,0],False),('score_bajo',True,[.2,.12,.12,.12,.11,.11,.11,.11],False)]:
        def check(available=available,scores=scores):
            clipenv['_load_clip']=lambda:available
            clipenv['_clip_model']=lambda **kw:types.SimpleNamespace(logits_per_image=types.SimpleNamespace(softmax=lambda **kw:[np.array(scores)]))
            return clip.validar_con_clip(np.zeros((100,300,3),dtype=np.uint8))[0]
        suite.append(variant('CB-04','clip_'+name,'Probabilidades y disponibilidad simuladas',expected,check,['validar_con_clip']))
    def clip_error():
        clipenv['_load_clip']=lambda:True;clipenv['_clip_model']=MagicMock(side_effect=RuntimeError('ficticio'));return clip.validar_con_clip(np.zeros((100,300,3),dtype=np.uint8))[0]
    suite.append(variant('CB-04','clip_excepcion_deja_pasar','Excepción interna ficticia',True,clip_error,['validar_con_clip']))
    # Ruta original /validate, incluyendo imports locales apuntados a dobles de módulos.
    routeenv={'router':APIRouter(),'UploadFile':UploadFile,'File':lambda x:x,'process_image':image.process_image}
    route=load_functions('api_ia_sonrie/app/routes/predict.py',['validate_only'],routeenv)
    for layer in ['tecnica','clip','cls','aceptada']:
        def routecheck(layer=layer):
            fake={}
            for mod,name in [('app.services.detector','validar_capa0'),('app.utils.clip_validator','validar_con_clip'),('app.utils.cls_validator','validar_con_clasificador')]:
                fake[mod]=types.ModuleType(mod)
            fake['app.services.detector'].validar_capa0=lambda b:(layer!='tecnica','simulado',np.zeros((100,300,3),dtype=np.uint8))
            fake['app.utils.clip_validator'].validar_con_clip=lambda a:(layer!='clip','simulado')
            fake['app.utils.cls_validator'].validar_con_clasificador=lambda a:(layer!='cls','simulado')
            with patch.dict(sys.modules,fake):return in_memory_async(route.validate_only(upload()))['valid']
        suite.append(variant('CB-04','ruta_validate_'+layer,'Archivo ficticio y capas controladas',layer=='aceptada',routecheck,['validate_only','process_image']))
    return suite

def pdf_tests():
    import pymupdf
    suite=[]
    pdfpath=PROJECT/'backend/app/services/diagnostico_pdf.py'
    spec=importlib.util.spec_from_file_location('generador_real_ensayo',pdfpath);renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
    def fixtures():
        ev=types.SimpleNamespace(id_evaluacion=900001,id_paciente=900002,estado='completada',fecha_evaluacion=datetime(2026,10,31,12),tipo_visita='Primera vez',motivo_consulta='ENSAYO FICTICIO CB-05',observaciones='Ficticio')
        pa=types.SimpleNamespace(nombres='Persona',apellidos='Ficticia',dni='00123456',fecha_nacimiento=date(1990,1,1),genero='Otro',telefono='912345678',correo='persona@example.test',edad=36,apoderado=None)
        od=types.SimpleNamespace(nombres='Profesional',apellidos='Ficticio',especialidad='Prueba',colegiatura='FICTICIO')
        dg=types.SimpleNamespace(id_odontologo=900003,fecha_diagnostico=datetime(2026,10,31,12),diagnostico_texto='DIAGNOSTICO FICTICIO CB-05',plan_tratamiento='',observaciones='Sin atención clínica')
        return ev,pa,od,dg
    class Fixture:
        def __init__(self):
            self.ev,self.pa,self.od,self.dg=fixtures();self.diagnosis=MagicMock();self.diagnosis.query.filter_by.return_value.order_by.return_value.first.return_value=self.dg
            self.db=types.SimpleNamespace(session=MagicMock());self.db.session.get.side_effect=lambda model,id:{'Eval':self.ev,'Patient':self.pa,'Dentist':self.od}.get(model)
            rad=MagicMock();rad.query.filter_by.return_value.order_by.return_value.all.return_value=[]
            self.env={'evaluaciones_bp':Blueprint('pdf_ensayo',__name__,url_prefix='/api/evaluaciones'),'db':self.db,'EvaluacionDiagnostica':'Eval','Paciente':'Patient','Odontologo':'Dentist','DiagnosticoOdontologo':self.diagnosis,'Radiografia':rad,'ResultadosDeteccion':MagicMock(),'DeteccionesCaries':MagicMock(),'jsonify':jsonify,'current_app':current_app,'send_file':send_file,'BytesIO':io.BytesIO,'re':re,'unicodedata':unicodedata}
            self.route=load_functions('backend/app/routes/evaluaciones.py',['descargar_diagnostico_pdf'],self.env)
            self.app=Flask('pdf_ficticio');self.app.testing=True;self.app.logger.disabled=True;self.app.register_blueprint(self.env['evaluaciones_bp']);self.client=self.app.test_client()
        def get(self,generator=None):
            module=types.ModuleType('app.services.diagnostico_pdf');module.generar_pdf_diagnostico=generator or renderer.generar_pdf_diagnostico
            with patch.dict(sys.modules,{'app.services.diagnostico_pdf':module}):return self.client.get('/api/evaluaciones/900001/pdf')
    for name,status in [('inexistente',404),('pendiente',409),('sin_diagnostico',404),('sin_paciente',404)]:
        def check(name=name):
            f=Fixture()
            if name=='inexistente':f.ev=None
            elif name=='pendiente':f.ev.estado='pendiente'
            elif name=='sin_diagnostico':f.diagnosis.query.filter_by.return_value.order_by.return_value.first.return_value=None
            else:f.pa=None
            generator=MagicMock();r=f.get(generator);return {'http':r.status_code,'generador_invocado':generator.called}
        suite.append(variant('CB-05',name,'Objetos ORM simulados sin base de datos',{'http':status,'generador_invocado':False},check,['descargar_diagnostico_pdf']))
    def realpdf():
        f=Fixture();raw=renderer.generar_pdf_diagnostico(f.ev,f.pa,f.od,f.dg,[]);r=f.get();assert r.status_code==200;d=pymupdf.open(stream=r.data,filetype='pdf');txt=''.join(p.get_text() for p in d);data={'http':r.status_code,'tipo':r.mimetype,'texto_ficticio':'DIAGNOSTICO FICTICIO CB-05' in txt,'paciente_ficticio':'Persona Ficticia' in txt,'paginas':len(d)};d.close();(OUT/'CB-05_pdf_objetos_ficticios.pdf').write_bytes(r.data);return data
    suite.append(variant('CB-05','completada_generador_real_sin_radiografias','Entidades ficticias y plantilla original de solo lectura',{'http':200,'tipo':'application/pdf','texto_ficticio':True,'paciente_ficticio':True,'paginas':1},realpdf,['descargar_diagnostico_pdf','generar_pdf_diagnostico']))
    for name,error,status in [('falta_pymupdf',ModuleNotFoundError('Dependencia ficticia',name='pymupdf'),503),('otra_dependencia',ModuleNotFoundError('Dependencia ficticia',name='otro'),500),('error_generico',RuntimeError('Fallo ficticio'),500)]:
        def check(error=error):
            f=Fixture();return f.get(MagicMock(side_effect=error)).status_code
        suite.append(variant('CB-05',name,'Excepción simulada del generador',status,check,['descargar_diagnostico_pdf']))
    def filename():
        f=Fixture();f.pa.nombres='María Elena';f.pa.apellidos='Núñez Silva';r=f.get(lambda *a:b'%PDF-simulado');return 'diagnostico_MariaElenaNunezSilva.pdf' in r.headers['Content-Disposition']
    suite.append(variant('CB-05','nombre_archivo_normalizado','Nombre ficticio con tildes y espacios',True,filename,['descargar_diagnostico_pdf']))
    return suite

def remaining_tests():return patient_tests()+image_tests()+pdf_tests()

if __name__=='__main__':
    groups=sys.argv[1].split(',') if len(sys.argv)>1 else ['CB-01','CB-02']
    candidates=auth_tests() if set(groups)&{'CB-01','CB-02'} else remaining_tests()
    tests=[t for t in candidates if t.shortDescription().split()[0] in groups]
    label='_'.join(groups)
    # Todo acceso de red falla: ni MySQL, ni HTTP, ni descarga de modelos.
    with patch.object(socket.socket,'connect',side_effect=RuntimeError('Red deshabilitada en pruebas')),patch.object(socket,'create_connection',side_effect=RuntimeError('Red deshabilitada en pruebas')):
        with (OUT/(label+'_unittest.txt')).open('w',encoding='utf-8') as log,contextlib.redirect_stdout(log),contextlib.redirect_stderr(log):
            result=unittest.TextTestRunner(stream=log,verbosity=2).run(unittest.TestSuite(tests))
    report={'fecha_utc':datetime.utcnow().isoformat()+'Z','python':sys.version,'framework':'unittest','grupos':groups,'variantes':ROWS,'ejecutadas':result.testsRun,'errores':len(result.errors),'fallos':len(result.failures),'aislamiento':'Sin importación de create_app ni conexión ORM. Cliente Flask y ORM simulados. Reloj e IP ficticios. Red bloqueada. Cuerpos Python compilados con AST sin modificaciones.','cobertura':'No se calcula porcentaje; coverage no está instalado. Se registran líneas y transiciones observadas, sin equipararlas a cobertura total de ramas.'}
    (OUT/(label+'_resultados.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str),encoding='utf-8')
    trace=[]
    for key,meta in FUNCTIONS.items():
        if key in LINES:trace.append({**meta,'lineas_ejecutadas':sorted(LINES[key]),'transiciones_observadas':[list(a) for a in sorted(ARCS.get(key,set()))]})
    (OUT/(label+'_traza_codigo.json')).write_text(json.dumps(trace,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'ejecutadas':result.testsRun,'fallos':len(result.failures),'errores':len(result.errors),'reporte':label+'_resultados.json'},ensure_ascii=False))
    sys.exit(0 if result.wasSuccessful() else 1)
