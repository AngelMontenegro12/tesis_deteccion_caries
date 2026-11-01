// Ejecutor interactivo para CN-04. No exporta credenciales ni sesiones.
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const root = path.resolve(__dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(__dirname, 'Navegadores');
const {chromium} = require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless:false});
  const context = await browser.newContext({viewport:{width:1366,height:900}});
  // Impedir almacenamiento de radiografías, reprocesamiento y cambios existentes.
  await context.route('**/api/**', async route => {
    const req=route.request(), u=new URL(req.url()), method=req.method();
    const allowed=['GET','HEAD','OPTIONS'].includes(method) ||
      (method==='POST' && u.origin==='http://localhost:5000' && ['/api/auth/login','/api/pacientes','/api/evaluaciones'].includes(u.pathname)) ||
      (method==='POST' && u.origin==='http://localhost:8000' && u.pathname==='/api/validate');
    if(!allowed){console.log('SOLICITUD_BLOQUEADA_POR_RESTRICCION: '+method+' '+u.pathname);return route.abort('blockedbyclient');}
    return route.continue();
  });
  const page=await context.newPage();
  const events=[];
  page.on('response',async response=>{
    const u=new URL(response.url());
    if(u.origin==='http://localhost:8000' && u.pathname==='/api/validate'){
      let body;try{body=await response.json();}catch{body='Respuesta no JSON';}
      const event={fecha:new Date().toISOString(),ruta:u.pathname,http:response.status(),respuesta:body};
      events.push(event);
      fs.writeFileSync(path.join(root,'Evidencias_Caja_Negra','CN-04_validaciones_observadas.json'),JSON.stringify(events,null,2));
      console.log('VALIDACION: '+JSON.stringify(event));
    }
  });
  await page.goto('http://localhost:3000/login');
  await page.getByRole('button',{name:/iniciar sesi[oó]n/i}).waitFor();
  console.log('CN04_FORMULARIO_LISTO: introducir credenciales privadas en esta ventana.');
  await page.waitForURL('http://localhost:3000/dashboard',{timeout:0});
  console.log('CN04_SESION_LISTA');
  const rl=readline.createInterface({input:process.stdin,terminal:false});
  for await(const line of rl){
    try{
      const cmd=JSON.parse(line);
      if(cmd.action==='state')console.log('ESTADO: '+JSON.stringify({url:page.url(),texto:await page.locator('body').innerText()}));
      else if(cmd.action==='goto' && cmd.path==='/nueva-evaluacion'){await page.goto('http://localhost:3000'+cmd.path);console.log(await page.locator('body').innerText());}
      else if(cmd.action==='click'){await page.getByRole(cmd.role||'button',{name:cmd.name,exact:!!cmd.exact}).click();console.log(await page.locator('body').innerText());}
      else if(cmd.action==='fill'){
        if(/contrase|password|correo/i.test(cmd.label))throw Error('Campo reservado');
        await page.getByLabel(cmd.label,{exact:!!cmd.exact}).fill(cmd.value);console.log('Campo ficticio completado.');
      }else if(cmd.action==='screenshot' && /^CN-04_[a-zA-Z0-9_-]+\.png$/.test(cmd.name)){
        await page.screenshot({path:path.join(root,'Evidencias_Caja_Negra',cmd.name),fullPage:true});console.log('CAPTURA: '+cmd.name);
      }else if(cmd.action==='inputs')console.log(await page.locator('input,select,textarea,button').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,name:e.name,id:e.id,placeholder:e.placeholder,text:e.tagName==='BUTTON'?e.innerText:undefined,disabled:e.disabled}))));
      else if(cmd.action==='upload' && ['CN04_incompatible.txt','CN04_corrupto.png','CN04_no_panoramica_vertical.png'].includes(cmd.file)){
        await page.locator('input[type=file]').nth(cmd.index||0).setInputFiles(path.join(__dirname,'Archivos_Ficticios_CN04',cmd.file));console.log('Archivo ficticio seleccionado; almacenamiento persistente bloqueado.');
      }else console.log('Comando no permitido.');
    }catch{console.log('Acción no completada; observar estado antes de continuar.');}
  }
})().catch(()=>{console.error('No se pudo completar el ejecutor CN-04.');process.exitCode=1;});
