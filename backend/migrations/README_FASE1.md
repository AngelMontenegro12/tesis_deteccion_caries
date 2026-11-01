# Fase 1: colaboración clínica y responsables

## Ajuste posterior: edición controlada de identidad

Antes de activar este ajuste, aplicar **manualmente** también
`002_identidad_expediente.sql` después de `001_auditoria_clinica.sql`, primero en
una base ficticia. Crea `identidades_expediente` y añade `motivo` a la bitácora;
no modifica ni elimina datos existentes. Verificar previamente si esos objetos
ya existen: no repetir el ALTER ni borrar tablas para resolver diferencias.
No se ha ejecutado en MySQL. La base real no se ha consultado ni modificado.

La regla anterior de bloquear toda rectificación de identidad queda reemplazada:
los cambios efectivos de nombres, apellidos, DNI, nacimiento, género y apoderado
exigen `confirmar_identidad: true` y `motivo_rectificacion` (1–500 caracteres).
La UI enumera los campos que detectó el backend y solicita confirmación y motivo.
Contacto y dirección no requieren esa confirmación. Los campos reenviados sin
cambios, espacios exteriores y equivalencias null/vacío no cuentan como cambio.

Los nuevos cierres guardan una instantánea de identidad en la misma transacción
que el diagnóstico. Para cierres antiguos sin instantánea, se capturan los datos
actualmente disponibles **antes** de la primera rectificación y se marcan como
`previa_rectificacion_legada`: esto no reconstruye modificaciones anteriores ni
certifica correspondencia con PDFs emitidos antes de introducir este mecanismo.
Las instantáneas no se sobrescriben en rectificaciones posteriores. PDF, nombre
de descarga y detalle del expediente usan esa identidad; la ficha del paciente
y las evaluaciones futuras usan los datos corregidos. Los diagnósticos, planes,
imágenes y firmantes de cierres existentes siguen bloqueados para edición.

Se guarda actor, campos efectivos y motivo en la bitácora; no poner datos
sensibles en el motivo. Las instantáneas sí contienen identidad clínica y deben
protegerse con las mismas medidas de acceso/respaldo/retención que el expediente.
No se añade una API pública de modificación de instantáneas. Los bloqueos de
fila de paciente serializan cierre/rectificación en motores que los soportan;
SQLite no prueba concurrencia MySQL. La migración y esa concurrencia requieren
verificación manual en ensayo antes de activar el código.

El modelo actual de paciente no contiene foto ni endpoint de carga de foto de
paciente. No se inventa uno en este ajuste; la foto de perfil de odontólogos no
cambia. Añadir fotografía de paciente sería una funcionalidad aparte.

## Migración manual requerida

`001_auditoria_clinica.sql` crea exclusivamente la nueva tabla `auditoria_clinica`.
No altera pacientes, evaluaciones, diagnósticos ni autores existentes. No se ha
ejecutado contra MySQL. No ejecutar `backend/run.py` para aplicar esta migración:
ese arranque invoca `create_all()`.

1. Respaldar el esquema/datos mediante el procedimiento de la clínica.
2. Revisar el SQL y seleccionar explícitamente una base de ensayo vacía o ficticia
   en MySQL Workbench. No importar datos de pacientes reales.
3. Comprobar que `auditoria_clinica` no existe; si existe, comparar el esquema en
   lugar de eliminarla o sobrescribirla.
4. Abrir `001_auditoria_clinica.sql` y ejecutar su único `CREATE TABLE` en ensayo.
5. Ejecutar las verificaciones manuales de abajo. Solo después, un responsable
   puede programar la aplicación del mismo SQL a la base elegida y activar el código.

El nuevo código necesita esta tabla para guardar operaciones clínicas: si la
bitácora no puede persistirse, se revierte la transacción del alta/edición/cierre.
No hay relleno retroactivo ni atribución inventada de operaciones antiguas.
Los identificadores de la bitácora se conservan como referencias históricas sin
cascadas de borrado. No se almacenan nombres, valores clínicos ni tokens: solo
actor, recurso, acción, nombres de campos y fecha. No se añade una API pública
para leer o modificar esta tabla.

## Política

- Odontólogos activos: lectura/creación/edición compartida según permisos
  `/pacientes` o `/nueva-evaluacion` para pacientes; `/nueva-evaluacion` para
  escribir, reanudar, procesar o finalizar evaluaciones.
- El ID del autor original de paciente/evaluación no cambia al editar. El
  firmante de un diagnóstico nuevo es quien lo finaliza con su sesión.
- La gestión administrativa sigue separada y no cambia con esta migración.
- Evaluaciones con estado `completada` **o** diagnóstico ya guardado: no se permite
  cambiar contexto, radiografías, reprocesar ni sustituir el cierre (409).
  Un reintento idéntico del mismo firmante devuelve el cierre existente sin
  duplicarlo. Un cierre de otro actor o con contenido distinto devuelve 409.
- El PDF utiliza la instantánea del expediente; la identidad actual se puede
  rectificar con confirmación y motivo, sin modificar cierres históricos.
- El procesamiento IA registra `solicitar_procesamiento`, no éxito de inferencia:
  el servicio existente mantiene transacciones propias.

## Pruebas seguras automatizadas

Desde `backend/`, con dependencias instaladas en un entorno de pruebas:

```powershell
python -m unittest discover -s tests -p 'test_*.py' -v
```

Las pruebas crean SQLite en memoria y archivos temporales ficticios. No arrancan
`run.py`, ni conectan con MySQL, ni cargan `.pt`. La inferencia compartida se simula.
SQLite no acredita integridad de solicitudes concurrentes en MySQL ni constituye
una prueba de la migración MySQL. Queda pendiente esa verificación en ensayo.

## Verificación manual (solo base ficticia)

1. Preparar A y B odontólogos activos con módulos clínicos, C sin permisos y un
   administrador. Registrar los IDs de fixtures conocidos; no enumerar registros.
2. Como B, crear paciente/evaluación pendiente. Como A, editar su teléfono y el
   motivo de consulta; ambos deben guardarse y conservar `id_odontologo=B`.
3. Consultar en Workbench únicamente metadatos de ensayo:
   `SELECT id_actor, recurso, id_recurso, accion, campos, creado_en FROM auditoria_clinica ORDER BY id_evento DESC;`
   Las ediciones deben identificar A; las altas deben identificar B.
4. Como A, reanudar la evaluación de B. Guardar sus radiografías ficticias y
   finalizar con un diagnóstico de ensayo. El autor de evaluación sigue siendo B;
   el diagnóstico y el evento `finalizar` identifican A.
5. Intentar editar contexto, guardar radiografías, procesar o enviar un cierre
   distinto sobre esa evaluación, también como administrador: 409 sin cambios.
   La UI debe mostrar el error, no confirmar éxito.
6. Cambiar teléfono del paciente: permitido y auditado, sin confirmación extra.
   Cambiar DNI/nombre/nacimiento: comprobar lista de campos, cancelar (sin cambios),
   luego confirmar y dar un motivo. La ficha debe cambiar y el PDF/detalle antiguo
   conservar la identidad previa. Repetir con un paciente sin cierres y con un
   diagnóstico legado sin instantánea. Comprobar actor/motivo en la bitácora.
7. Como C, intentar las mismas escrituras: 403. Como A, intentar cambiar roles,
   estado o permisos administrativos: 403. Sin sesión, API/imagen/PDF: 401.
8. Como A/B con permisos de lectura, comprobar imagen y PDF de la evaluación
   finalizada. Abrir la URL de imagen sin Bearer: 401. Comparar diagnóstico y autor
   antes/después de los intentos bloqueados: deben permanecer intactos.
