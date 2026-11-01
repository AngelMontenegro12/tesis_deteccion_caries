(async()=>{
 const browser=cn04Page.context().browser();
 await browser.close();
 setTimeout(()=>process.exit(0),500);
 return 'Ventana independiente CN-04 cerrada sin logout ni cambios de datos; proceso temporal finalizado.';
})()
