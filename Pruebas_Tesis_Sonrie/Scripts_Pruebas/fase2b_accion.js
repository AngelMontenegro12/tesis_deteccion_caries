(async()=>{
 const pw=process.mainModule.require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const pages=[...pw.chromium._connection._objects.values()].filter(o=>o.constructor.name==='_Page');
 if(pages.length!==1)throw Error('Página ambigua');
 globalThis.fase2bPage=pages[0];
 await fase2bPage.getByRole('button',{name:'Registrar Paciente',exact:true}).last().click({timeout:10000});
 return {url:fase2bPage.url(),texto:await fase2bPage.locator('body').innerText()};
})()
