// Capturas de reportes locales construidos a partir de la ejecución real.
const path=require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(__dirname,'Navegadores');
const {chromium}=require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1080,height:1100},deviceScaleFactor:1});
 const out=path.resolve(__dirname,'..','Evidencias_Caja_Blanca');
 for(const code of ['CB-01','CB-02','CB-03','CB-04','CB-05']){
  await page.goto(pathToFileURL(path.join(out,code+'_reporte.html')).href);
  await page.screenshot({path:path.join(out,code+'_reporte_ejecucion.png'),fullPage:true});
 }
 await browser.close();console.log('Cinco reportes locales capturados sin conectarse a Sonrie.');
})().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1;});
