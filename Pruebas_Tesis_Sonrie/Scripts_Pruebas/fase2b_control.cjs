const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'Control_Fase2B');
(async()=>{
 const cmd=JSON.parse(process.argv[2]);cmd.id=Date.now()+'-'+Math.random().toString(36).slice(2);
 fs.writeFileSync(path.join(dir,'comando.json'),JSON.stringify(cmd));
 const deadline=Date.now()+90000;
 while(Date.now()<deadline){
  try{const result=JSON.parse(fs.readFileSync(path.join(dir,'respuesta.json'),'utf8'));if(result.id===cmd.id){console.log(JSON.stringify(result));return;}}catch{}
  await new Promise(r=>setTimeout(r,200));
 }
 console.log(JSON.stringify({ok:false,error:'Tiempo de espera de control agotado; observar antes de repetir.'}));
})();
