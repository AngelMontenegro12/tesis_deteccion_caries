// Puente de recuperación del ejecutor propio CN-04; no inspecciona credenciales.
const fs=require('fs');
(async()=>{
 const targets=await (await fetch('http://127.0.0.1:9229/json/list')).json();
 const target=targets.find(t=>t.url.includes('cn04_playwright.cjs'));
 if(!target)throw Error('El depurador no pertenece al ejecutor CN-04');
 const ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 const expression=process.argv[2]==='--json' ? `cn04Control(${JSON.stringify(JSON.parse(process.argv[3]))})` : process.argv[2]==='--command' ? `cn04Control(${Buffer.from(process.argv[3],'base64').toString('utf8')})` : fs.readFileSync(process.argv[2],'utf8');
 const response=new Promise((ok,no)=>{ws.onmessage=e=>{const r=JSON.parse(e.data);if(r.id===1)ok(r);};ws.onerror=no;});
 ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
 const result=await response;
 if(result.result?.exceptionDetails)console.log('ERROR_CONTROL: '+(result.result.exceptionDetails.exception?.description||result.result.exceptionDetails.text));
 else console.log(JSON.stringify(result.result?.result?.value));
 ws.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
