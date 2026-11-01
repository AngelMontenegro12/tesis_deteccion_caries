// Ejecuta la función validateImage original con fetch y estado simulados.
const fs=require('fs'),path=require('path'),vm=require('vm');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','..');
const sourcePath=path.join(root,'frontend','src','pages','EvaluacionClinica.jsx');
const source=fs.readFileSync(sourcePath,'utf8');
const start=source.indexOf('  const validateImage = async (file) => {');
const end=source.indexOf('\n  const handleFileChange',start);
assert(start>=0&&end>start);
const snippet=source.slice(start,end);
const line=source.slice(0,start).split('\n').length;
const out=path.join(root,'Pruebas_Tesis_Sonrie','Evidencias_Caja_Blanca');
fs.writeFileSync(path.join(out,'CB-04_validateImage_fragmento_original.txt'),`Archivo: frontend/src/pages/EvaluacionClinica.jsx\nInicio: línea ${line}\n\n${snippet}`);
const records=[];
const variants=[
 {name:'imagen_aceptada',ok:true,body:{valid:true,error:null},expected:true},
 {name:'rechazo_semantico_200',ok:true,body:{valid:false,error:'Rechazo ficticio'},expected:false},
 {name:'http_400_debe_rechazarse',ok:false,status:400,body:{detail:'El archivo debe ser una imagen.'},expected:false},
 {name:'http_500_debe_rechazarse',ok:false,status:500,body:{detail:'Error ficticio'},expected:false},
 {name:'error_de_red_debe_rechazarse',network:true,expected:false}
];
for(const v of variants)test('CB-04 validateImage '+v.name,async()=>{
 const loading=[],messages=[];
 const sandbox={FormData:class{append(){}},setIsSubmitting:x=>loading.push(x),showInvalidImageModal:x=>messages.push(x),console:{error(){}},fetch:async()=>{if(v.network)throw Error('Error de red simulado sin conexión');return{ok:v.ok,status:v.status||200,json:async()=>v.body};}};
 vm.createContext(sandbox);
 new vm.Script(snippet+'\nglobalThis.underTest=validateImage;',{filename:sourcePath,lineOffset:line-1}).runInContext(sandbox);
 const observed=await sandbox.underTest({name:'archivo_ficticio'});
 const entry={caso:'CB-04',variante:'frontend_'+v.name,datos:v.network?'Excepción de fetch simulada':`Respuesta HTTP ${v.status||200} simulada`,funciones:['validateImage'],esperado:{aceptada:v.expected},obtenido:{aceptada:observed,mensajes:messages,estado_cargando_final:loading.at(-1)},estado:observed===v.expected?'Aprobado':'Fallido'};
 records.push(entry);
 assert.equal(loading.at(-1),false);
 assert.equal(observed,v.expected,'Ante un rechazo HTTP o fallo de comunicación no debe aceptarse el archivo');
});
process.on('exit',()=>{
 fs.writeFileSync(path.join(out,'CB-04_frontend_resultados.json'),JSON.stringify({fecha_utc:new Date().toISOString(),framework:'node:test',node:process.version,archivo_original:'frontend/src/pages/EvaluacionClinica.jsx',linea_inicial:line,cuerpo_original_sin_modificaciones:true,variantes:records,cobertura:'Sin porcentaje de ramas; escenarios controlados sobre función original extraída del componente.'},null,2));
});
