globalThis.cn04Control=async cmd=>{
 const p=cn04Page;
 if(cmd.action==='audit'){
  const api=p.context().request;
  const patients=await (await api.get('http://localhost:5000/api/pacientes/buscar?q=99103104')).json();
  const own=patients.filter(x=>x.dni==='99103104' && x.nombres==='Prueba Carga' && x.apellidos==='Ficticio Octubre');
  const list=await (await api.get('http://localhost:5000/api/evaluaciones?search=99103104')).json();
  const evals=(list.data||[]).filter(e=>own.some(x=>x.id_paciente===e.id_paciente));
  const details=[];
  for(const e of evals){const d=await (await api.get('http://localhost:5000/api/evaluaciones/'+e.id_evaluacion+'/detalle')).json();details.push({id_evaluacion:e.id_evaluacion,estado:e.estado,radiografias:d.radiografias,diagnostico:d.diagnostico});}
  const pw=process.mainModule.require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const writeRequests=[...pw.chromium._connection._objects.values()].filter(o=>o.constructor.name==='_Request' && typeof o.url==='function' && /\/api\/evaluaciones\/\d+\/(radiografias|procesar|completar)/.test(o.url()) && !['GET','HEAD','OPTIONS'].includes(o.method())).map(o=>({metodo:o.method(),url:o.url()}));
  const out={fecha:new Date().toISOString(),pacientes_ficticios:own.map(x=>({id_paciente:x.id_paciente,nombres:x.nombres,apellidos:x.apellidos,dni:x.dni})),evaluaciones_ficticias:details,solicitudes_de_almacenamiento_procesamiento_finalizacion:writeRequests,limites:'No se pulsó Continuar con el TXT; no se evaluó su persistencia. La barrera de automatización bloquea escrituras de radiografías y cambios de registros existentes.'};
  process.mainModule.require('fs').writeFileSync(process.mainModule.require('path').resolve('Pruebas_Tesis_Sonrie/Evidencias_Caja_Negra/CN-04_auditoria_escenario.json'),JSON.stringify(out,null,2));
  return out;
 }
 if(cmd.action==='click')await p.getByRole(cmd.role||'button',{name:cmd.name,exact:!!cmd.exact}).click();
 if(cmd.action==='fill')await p.locator(cmd.selector).fill(cmd.value);
 if(cmd.action==='select')await p.locator(cmd.selector).selectOption(cmd.value);
 if(cmd.action==='upload')await p.locator('input[type=file]').nth(cmd.index||0).setInputFiles(process.mainModule.require('path').resolve('Pruebas_Tesis_Sonrie/Scripts_Pruebas/Archivos_Ficticios_CN04',cmd.file));
 if(cmd.action==='screenshot')await p.screenshot({path:process.mainModule.require('path').resolve('Pruebas_Tesis_Sonrie/Evidencias_Caja_Negra',cmd.name),fullPage:true});
 const state={fecha:new Date().toISOString(),url:p.url(),texto:await p.locator('body').innerText(),inputs:await p.locator('input,select,textarea,button').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,name:e.name,id:e.id,placeholder:e.placeholder,text:e.tagName==='BUTTON'?e.innerText:undefined,disabled:e.disabled,options:e.tagName==='SELECT'?[...e.options].map(x=>({text:x.text,value:x.value})):undefined})))};
 if(cmd.action==='screenshot')process.mainModule.require('fs').writeFileSync(process.mainModule.require('path').resolve('Pruebas_Tesis_Sonrie/Evidencias_Caja_Negra',cmd.name.replace('.png','_observacion.json')),JSON.stringify(state,null,2));
 return state;
};
cn04Control({action:'state'})
