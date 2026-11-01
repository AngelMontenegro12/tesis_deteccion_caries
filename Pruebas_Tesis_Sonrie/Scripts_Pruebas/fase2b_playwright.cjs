// Control independiente de CN-02, CN-03 y CN-05 por archivos locales.
// No guarda contraseñas, cookies, tokens ni cuerpos de peticiones de login.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const ev=path.join(root,'Evidencias_Caja_Negra');
const control=path.join(__dirname,'Control_Fase2B');fs.mkdirSync(control,{recursive:true});
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(__dirname,'Navegadores');
const {chromium}=require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const run={inicio:new Date().toISOString(),dni:'99103125',paciente:null,evaluacion:null,radiografias:[],procesado:false,finalizado:false,eventos:[],bloqueos:[]};
const save=()=>fs.writeFileSync(path.join(ev,'Fase2B_registro.json'),JSON.stringify(run,null,2));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:false});
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 await context.route('**/api/**',async route=>{
  const q=route.request(),u=new URL(q.url()),m=q.method();let allow=['GET','HEAD','OPTIONS'].includes(m);
  if(m==='POST'&&u.origin==='http://localhost:5000'&&u.pathname==='/api/auth/login')allow=true;
  if(m==='POST'&&u.origin==='http://localhost:8000'&&u.pathname==='/api/validate')allow=true;
  if(m==='POST'&&u.origin==='http://localhost:5000'&&u.pathname==='/api/pacientes'){
   const data=q.postDataJSON();allow=!run.paciente&&data.dni===run.dni&&data.nombres==='Prueba Tesis'&&data.apellidos==='Paciente Ficticio';
  }
  if(m==='POST'&&u.origin==='http://localhost:5000'&&u.pathname==='/api/evaluaciones'){
   const data=q.postDataJSON();allow=!!run.paciente&&!run.evaluacion&&data.id_paciente===run.paciente.id_paciente;
  }
  const own=run.evaluacion&&u.origin==='http://localhost:5000'&&u.pathname.startsWith('/api/evaluaciones/'+run.evaluacion.id_evaluacion+'/');
  if(own&&['POST','PUT'].includes(m)){
   if(u.pathname.endsWith('/radiografias')&&!run.radiografias.length){
    const d=await(await context.request.get('http://localhost:5000/api/evaluaciones/'+run.evaluacion.id_evaluacion+'/detalle')).json();allow=d.radiografias?.length===0;
   }
   if(u.pathname.endsWith('/procesar')&&!run.procesado&&run.radiografias.length){run.procesado=true;allow=true;}
   if(u.pathname.endsWith('/completar')&&!run.finalizado){
    const d=await(await context.request.get('http://localhost:5000/api/evaluaciones/'+run.evaluacion.id_evaluacion+'/detalle')).json();allow=!d.diagnostico&&d.evaluacion?.estado!=='completada';if(allow)run.finalizado=true;
   }
  }
  if(!allow){run.bloqueos.push({fecha:new Date().toISOString(),metodo:m,ruta:u.pathname});save();return route.abort('blockedbyclient');}
  return route.continue();
 });
 const page=await context.newPage();
 page.on('response',async r=>{
  try{
   const u=new URL(r.url()),m=r.request().method();
   if(u.pathname==='/api/auth/login'){if(m==='POST'){run.eventos.push({ruta:u.pathname,http:r.status(),fecha:new Date().toISOString()});save();}return;}
   if(!['POST','PUT'].includes(m))return;
   if(!['http://localhost:5000','http://localhost:8000'].includes(u.origin))return;
   const body=await r.json();
   if(u.pathname==='/api/pacientes'&&r.status()===201&&body.dni===run.dni)run.paciente=body;
   if(u.pathname==='/api/evaluaciones'&&r.status()===201&&body.id_paciente===run.paciente?.id_paciente)run.evaluacion=body;
   if(u.pathname.endsWith('/radiografias')&&r.ok())run.radiografias=body.radiografias||[];
   run.eventos.push({fecha:new Date().toISOString(),ruta:u.pathname,metodo:m,http:r.status(),respuesta:body});save();
  }catch{}
 });
 async function state(){return {fecha:new Date().toISOString(),url:page.url(),texto:await page.locator('body').innerText(),controles:await page.locator('input,select,textarea,button,a').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,name:e.name,id:e.id,placeholder:e.placeholder,text:['BUTTON','A'].includes(e.tagName)?e.innerText:undefined,href:e.tagName==='A'?e.getAttribute('href'):undefined,disabled:e.disabled,options:e.tagName==='SELECT'?[...e.options].map(x=>({text:x.text,value:x.value})):undefined}))) };}
 await page.goto('http://localhost:3000/login',{waitUntil:'domcontentloaded'});
 save();fs.writeFileSync(path.join(control,'listo.json'),JSON.stringify({url:page.url(),mensaje:'Introducir credenciales en Chromium; no se registran.'}));
 console.log('FORMULARIO_FASE2B_LISTO');
 let previous='';
 while(!page.isClosed()){
  const file=path.join(control,'comando.json');
  if(fs.existsSync(file)){
   const raw=fs.readFileSync(file,'utf8');
   if(raw!==previous){previous=raw;let c;
    try{
     c=JSON.parse(raw);let data;
     if(c.action==='state')data=await state();
     else if(c.action==='goto'&&['/pacientes','/nueva-evaluacion','/historial'].includes(c.path)){await page.goto('http://localhost:3000'+c.path,{waitUntil:'domcontentloaded'});data=await state();}
     else if(c.action==='reload'){await page.reload({waitUntil:'domcontentloaded'});data=await state();}
     else if(c.action==='click'){await page.getByRole(c.role||'button',{name:c.name,exact:!!c.exact}).click();data=await state();}
     else if(c.action==='clickText'){await page.getByText(c.text,{exact:!!c.exact}).click();data=await state();}
     else if(c.action==='fill'&&!/password|contrasena/i.test(c.selector)){await page.locator(c.selector).fill(c.value);data=await state();}
     else if(c.action==='select'){await page.locator(c.selector).selectOption(c.value);data=await state();}
     else if(c.action==='upload'){if(!c.file.startsWith(path.join(root,'Scripts_Pruebas','Radiografia_Fase2B')))throw Error('Ruta de prueba no permitida');await page.locator('input[type=file]').first().setInputFiles(c.file);data=await state();}
     else if(c.action==='screenshot'&&/^(CN-02|CN-03|CN-05)_[a-zA-Z0-9_-]+\.png$/.test(c.name)){
      await page.screenshot({path:path.join(ev,c.name),fullPage:true});data=await state();fs.writeFileSync(path.join(ev,c.name.replace('.png','_observacion.json')),JSON.stringify(data,null,2));
     }
     else if(c.action==='download'){
      const pending=page.waitForEvent('download',{timeout:60000});await page.getByRole('button',{name:c.name,exact:!!c.exact}).click();const download=await pending;const dest=path.join(ev,'CN-05_diagnostico_prueba.pdf');await download.saveAs(dest);data={archivo:dest,nombre_sugerido:download.suggestedFilename(),bytes:fs.statSync(dest).size};fs.writeFileSync(path.join(ev,'CN-05_descarga_observada.json'),JSON.stringify(data,null,2));
     }
     else if(c.action==='audit'){
      const id=run.evaluacion?.id_evaluacion;if(!id)throw Error('Sin evaluación propia');const r=await context.request.get('http://localhost:5000/api/evaluaciones/'+id+'/detalle');data={http:r.status(),detalle:await r.json()};fs.writeFileSync(path.join(ev,'Fase2B_detalle_persistido.json'),JSON.stringify(data,null,2));
     }
     else if(c.action==='finish'){save();fs.writeFileSync(path.join(control,'respuesta.json'),JSON.stringify({id:c.id,ok:true,data:'Fin sin logout ni eliminación de datos'}));await browser.close();return;}
     else throw Error('Acción no permitida');
     fs.writeFileSync(path.join(control,'respuesta.json'),JSON.stringify({id:c.id,ok:true,data}));
    }catch(e){fs.writeFileSync(path.join(control,'respuesta.json'),JSON.stringify({id:c?.id,ok:false,error:String(e.message).slice(0,700)}));}
   }
  }
  await sleep(250);
 }
})().catch(e=>{console.error('No se pudo iniciar o mantener el ejecutor de Fase 2B: '+e.name);process.exitCode=1;});
