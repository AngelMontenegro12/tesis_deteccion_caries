// Recuperación del control del ejecutor propio; no inspecciona credenciales.
const fs=require('fs');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9229/json/list')).json();
 const target=targets.find(t=>t.url.includes('fase2b_playwright.cjs'));if(!target)throw Error('No es el ejecutor Fase2B');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 const reply=new Promise(r=>{ws.onmessage=e=>{const x=JSON.parse(e.data);if(x.id===1)r(x);};});
 const expression=fs.readFileSync(process.argv[2],'utf8');
 ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
 const result=await reply;console.log(JSON.stringify(result.result?.exceptionDetails?{error:result.result.exceptionDetails.exception?.description}:result.result?.result?.value));ws.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
