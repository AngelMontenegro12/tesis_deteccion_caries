# Verificación final: cuatro correcciones

## Alcance y seguridad

No ejecutar estas pruebas contra una base clínica real. La suite Python crea
SQLite en memoria y archivos temporales ficticios. No carga modelos ni migra MySQL.
Las pruebas de frontend usan solicitudes simuladas; los controladores de la página
se ejecutan sin DOM. No equivalen a una prueba visual del navegador.

Desde `backend`, con las dependencias de pruebas ya instaladas:

```powershell
python -m unittest discover -s tests -p 'test_*.py' -q
```

Desde `frontend`:

```powershell
node --test src/services/api.test.js src/services/patients.test.js src/utils/analysisTiming.test.js src/utils/radiografiaValidation.test.js src/utils/inferenceErrors.test.js src/utils/resultDetails.test.js src/utils/evaluationRecovery.test.js
```

Para reproducir específicamente los errores de almacenamiento sin tocar archivos reales:

```powershell
python -m unittest discover -s tests -p 'test_final_verification.py' -v
```

## Qué protege la implementación

- Inferencia: prepara respuestas sin transacción de base de datos abierta durante
  HTTP/YOLO. Antes de escribir, toma `FOR UPDATE` sobre la evaluación, renueva el
  estado ORM, revisa cierre y compara la versión de radiografías/resultados.
- Cierre: conserva el orden paciente -> evaluación, compatible con la protección
  de identidad histórica. El cierre y la escritura de IA respetan el mismo bloqueo
  de evaluación; no se bloquea al paciente durante YOLO.
- Reemplazo: H10 termina antes del bloqueo. Cada nuevo archivo se escribe en staging,
  se sincroniza y publica con nombre UUID antes de confirmar su referencia. Nunca
  se elimina el archivo anterior, tampoco al retirar una referencia de un lote.
- Un commit cuya confirmación se pierde puede haber tenido éxito. Se conservan los
  nuevos archivos después de intentar el commit: pueden quedar huérfanos, pero no
  se elimina un archivo que la base podría estar referenciando. No se añade una
  limpieza automática ni se borran archivos clínicos.
- Detalle: compara evaluación, todas las radiografías, estado e IDs de resultados
  con el recibo del POST confirmado. Reintentar detalle solo realiza GET `/detalle`.
- Recarga: no restaura un modal activo a partir de flags. Si hay un recibo confirmado,
  contrasta IDs con el backend antes de recuperarlo. Sin recibo, consulta el estado
  y avisa de interrupción; no identifica un intento usando resultados anteriores.
  No hay un trabajo persistente/ID de operación, por lo que un POST interrumpido
  puede haber terminado en el servidor sin que el navegador pueda atribuírselo.

## Comprobación manual (solo entorno aislado y datos sintéticos)

Reiniciar Flask y frontend con estos cambios. Abrir Network con Preserve log.

### 1. Procesamiento y cierre

1. Usar una evaluación ficticia pendiente con resultados previos y dos perfiles de
   navegador, cada uno con un odontólogo autorizado distinto.
2. En el perfil B, abrir sus resultados y dejar disponible Finalizar Diagnóstico.
3. En A, reanudar la evaluación e iniciar detección. Con un servicio IA simulado de
   prueba que demore la respuesta, finalizar en B mientras la inferencia está esperando.
4. B debe poder finalizar sin esperar toda la inferencia. A debe recibir HTTP 409,
   sin sustituir las detecciones previas ni habilitar nuevos resultados.
5. Intentar iniciar detección de nuevo en A: debe devolver 409 antes de llamar a IA.
6. Repetir con otro caso ficticio permitiendo que IA confirme primero: el cierre debe
   serializarse después y conservar los resultados que ya estaban confirmados.

**Pendiente:** ejecutar estas intercalaciones con conexiones independientes de
MySQL/InnoDB y el aislamiento real del despliegue (especialmente REPEATABLE READ).
SQLite verifica decisiones/reversiones y se comprueba el SQL generado para MySQL,
pero no ejecuta bloqueos de fila reales. No presentar esa concurrencia como aprobada.

### 2. Reemplazo de radiografías

1. En un caso ficticio pendiente, anotar ruta y contenido/hash del archivo anterior.
2. Cambiar la imagen por otra sintética válida, esperar H10 y continuar.
3. Comprobar una nueva ruta UUID, archivo nuevo legible y original intacto.
4. Ejecutar la suite final para simular fallo de escritura temporal, movimiento,
   commit fallido y commit exitoso con confirmación perdida. No parar MySQL real ni
   modificar permisos de carpetas clínicas para provocar errores manualmente.

### 3. Detalle fallido y reintento

1. Completar una inferencia ficticia hasta que aparezca Ver resultados.
2. En DevTools > Network request blocking, bloquear `*/api/evaluaciones/*/detalle`.
3. Pulsar Ver resultados: debe mantenerse el modal y mostrar un aviso; no abrir paso 5.
4. Desbloquear y pulsar Reintentar carga de resultados.
5. Debe abrir paso 5 con detalle válido. Network debe registrar solo nuevos GET
   `/detalle`, no un nuevo POST `/procesar` ni `/api/predict`.
6. El HTTP 500 específico se inyecta mediante las pruebas simuladas de frontend;
   el bloqueo de DevTools reproduce desconexión, no un HTTP 500.

### 4. Recarga

1. Con IA simulada lenta, iniciar detección y pulsar F5 antes de su respuesta.
2. El modal no debe quedar activo indefinidamente ni declarar éxito. Debe consultar
   `/detalle`, avisar de interrupción y permitir un reintento si el caso sigue abierto.
3. En otro intento, esperar Ver resultados y recargar: debe consultar el backend y
   recuperar los resultados confirmados por sus IDs, sin volver a ejecutar YOLO.
4. Bloquear `/detalle` antes de esa recarga: debe avisar y permitir Recuperar resultados,
   sin mostrar datos vacíos/antiguos ni ejecutar de nuevo inferencia.

## Límites

No se ha realizado en esta tarea la prueba visual, la precisión de modelos ni la
concurrencia efectiva en MySQL. Base de datos y filesystem no tienen una transacción
distribuida: se prioriza conservar archivos y evitar referencias rotas; se admiten
restos huérfanos tras fallo/crash. No se promete recuperación de trabajos cuya
respuesta nunca se confirmó. H08 mantiene su coordinador y tiempos normales sin cambios.
