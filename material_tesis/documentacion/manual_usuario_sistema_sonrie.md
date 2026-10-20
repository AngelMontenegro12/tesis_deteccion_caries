# Manual de usuario - Sistema Sonríe

## 1. Propósito del manual

Este manual explica cómo utilizar el Sistema Sonríe para gestionar pacientes,
crear evaluaciones diagnósticas asistidas por inteligencia artificial (IA),
revisar los resultados y consultar los reportes del sistema.

El sistema es una herramienta de apoyo. Los hallazgos, las cajas delimitadoras
y los porcentajes de confianza deben ser revisados e interpretados por el
odontólogo antes de emitir el diagnóstico clínico y definir el tratamiento.

## 2. Elementos generales de la interfaz

Después de iniciar sesión se muestra un menú lateral con las opciones que el
usuario tenga autorizadas:

- **Inicio:** acceso al panel principal.
- **Diagnóstico:** creación de una nueva evaluación.
- **Pacientes:** registro, búsqueda y consulta de expedientes.
- **Historial de diagnósticos:** consulta de evaluaciones completadas o pendientes.
- **Reportes:** consulta de los cuatro reportes disponibles.
- **Configuración > Mi Perfil:** actualización de los datos del odontólogo,
  contraseña y fotografía.
- **Soporte / Ayuda:** acceso a la ayuda del sistema.
- **Cerrar sesión:** finaliza la sesión actual y regresa a la pantalla de acceso.

El botón de menú permite contraer o expandir la barra lateral. Cuando está
contraída, se deben utilizar los íconos o sus textos emergentes para identificar
cada opción.

> **Captura sugerida:** pantalla completa del sistema con el menú lateral
> expandido y el nombre de cada módulo señalado con flechas.

---

## 3. Inicio de sesión y gestión de cuenta

### 3.1 Iniciar sesión

En la pantalla **INICIAR SESIÓN** se deben mostrar y señalar:

1. Logo y nombre del sistema.
2. Campo **Correo Electrónico**.
3. Campo **Contraseña**.
4. Casilla **Recordarme**.
5. Botón **Iniciar sesión**.
6. Enlace **¿Olvidaste tu clave?**.
7. Área de mensajes de error.

### Procedimiento

1. Escribir el correo registrado.
2. Escribir la contraseña.
3. Marcar **Recordarme** solo si se está utilizando un equipo seguro.
4. Presionar **Iniciar sesión**.
5. Esperar la redirección al panel principal.

### Validaciones y mensajes

- Ambos campos son obligatorios.
- El correo debe tener un formato válido, por ejemplo:
  `odontologo@dominio.com`.
- Mientras se procesa el acceso se muestra un estado de carga; no se debe
  presionar varias veces el botón.
- Si las credenciales no son correctas, se muestra un mensaje de error y el
  usuario debe verificar el correo y la contraseña.
- Si no existe una sesión válida, las pantallas protegidas redirigen nuevamente
  al inicio de sesión.
- La opción **Recordarme** conserva las credenciales en el navegador. Se debe
  evitar utilizarla en computadoras compartidas.

### 3.2 Recuperar la contraseña

Al presionar **¿Olvidaste tu clave?** se abre el modal **Recuperar
Contraseña**.

1. Ingresar el correo electrónico de la cuenta.
2. Presionar el botón para solicitar la recuperación.
3. Leer el mensaje mostrado por el sistema. La solicitud puede quedar pendiente
   de aprobación o ser aprobada.
4. Cuando se habilite el segundo paso, ingresar **Nueva Contraseña** y
   **Confirmar Contraseña**.
5. Presionar **Actualizar**.
6. Cerrar el modal y volver a iniciar sesión con la nueva contraseña.

**Validaciones:**

- El correo debe tener un formato válido.
- Las dos contraseñas nuevas deben coincidir.
- Si la solicitud todavía está pendiente, se debe esperar la aprobación
  correspondiente; no se debe repetir la solicitud innecesariamente.
- Los errores de conexión o del servidor se muestran dentro del modal.

> **Captura sugerida:** modal de recuperación mostrando el paso de solicitud y
> el paso de establecimiento de la nueva contraseña.

### 3.3 Configurar el perfil del odontólogo

Ruta: **Configuración > Mi Perfil**.

La pantalla debe mostrar:

- Fotografía de perfil y control para seleccionar una nueva imagen.
- Datos generales: **Nombres**, **Apellidos**, **Correo Electrónico**,
  **Teléfono**, **Número de Colegiatura** y **Especialidad**.
- Sección de seguridad: **Contraseña Actual**, **Nueva Contraseña** y
  **Confirmar Contraseña**.
- Botón **Guardar Cambios**.
- Botón **Actualizar Contraseña**.
- En el editor de fotografía, botón **Aplicar y Guardar** y opción para
  cancelar o cerrar el recorte.

**Validaciones de datos generales:**

- Nombres, apellidos, colegiatura y especialidad deben tener al menos dos
  caracteres cuando se informan.
- No se permiten números en nombres, apellidos ni especialidad.
- El correo debe ser válido.
- El teléfono es opcional, pero si se registra debe contener exactamente nueve
  dígitos.
- Si no existen cambios, no es necesario presionar **Guardar Cambios**.
- Se debe esperar el mensaje **Información actualizada correctamente** antes de
  abandonar la pantalla.

**Validaciones de contraseña:**

- Los tres campos son obligatorios.
- La nueva contraseña y su confirmación deben coincidir.
- La contraseña actual debe ser correcta; si no lo es, se mostrará el error del
  servidor.
- Al finalizar se muestra un mensaje de confirmación y los campos se limpian.

**Fotografía:**

1. Seleccionar la fotografía.
2. Ajustar el encuadre con el recortador.
3. Presionar **Aplicar y Guardar**.
4. Esperar el mensaje de actualización exitosa.

---

## 4. Gestión de pacientes

Ruta: **Pacientes**.

### 4.1 Listado y búsqueda

La pantalla debe mostrar:

- Título **Gestión de Pacientes**.
- Contador **Total pacientes**.
- Botón **Registrar Paciente**.
- Buscador **Buscar por nombres, apellidos o DNI...**.
- Selector de vista: cuadrícula, tabla, lista expandida y tablero Kanban.
- Filtros:
  - **Todos**.
  - **Menores de edad**.
  - **Mayores de edad**.
  - **Nuevos Pacientes**.
  - **Con Diagnóstico Pendiente**.
  - **Atendidos este mes**.
  - **Urgencias**.
  - **Controles de rutina**.

Para buscar, escribir el nombre, apellido o DNI en el buscador. La lista se
actualiza con coincidencias parciales. Si no hay coincidencias, se muestra
**No se encontraron pacientes**.

### 4.2 Registrar un nuevo paciente

Presionar **Registrar Paciente**. El formulario debe mostrar los siguientes
campos:

- **Nombres** (obligatorio).
- **Apellidos** (obligatorio).
- **DNI / Documento** (obligatorio).
- **Fecha de nacimiento** (obligatorio).
- **Género** (obligatorio).
- **Teléfono**.
- **Correo**.
- **Dirección**.
- **Observaciones generales**.
- **Nombre del apoderado**.
- **Teléfono del apoderado**.

### Validaciones del registro

- Nombres y apellidos son obligatorios.
- El DNI es obligatorio y debe tener ocho dígitos numéricos.
- La fecha de nacimiento es obligatoria y no puede ser posterior a la fecha
  actual.
- El género es obligatorio.
- Si se informa un correo, debe tener un formato válido.
- Si se informa un teléfono, debe tener nueve dígitos numéricos.
- Al calcularse una edad menor de 18 años, se habilita el bloque **Datos del
  Apoderado (Obligatorio en menores de edad)**.
- Para un menor de edad son obligatorios el nombre y el teléfono del apoderado.
- El teléfono del apoderado debe tener nueve dígitos numéricos.
- Los errores aparecen debajo del campo correspondiente. También puede aparecer
  un mensaje general si el servidor rechaza el registro.
- No se debe cerrar el formulario mientras se muestra el estado de envío.

Presionar **Guardar**, **Registrar** o **Registrar y Continuar**, según la
pantalla desde la que se abrió el formulario. Si el registro es exitoso, el
paciente aparece en el listado.

> **Captura sugerida:** formulario de paciente adulto y formulario de paciente
> menor con el bloque de apoderado resaltado.

### 4.3 Consultar el perfil y el historial del paciente

Hacer clic sobre una tarjeta o fila del paciente. Se abre el panel **Perfil
Clínico**, que debe mostrar:

- Nombre completo.
- DNI y fecha de nacimiento.
- Edad.
- Teléfono, correo y dirección.
- Datos del apoderado cuando correspondan.
- Sección **Historial de Diagnósticos** en forma de línea de tiempo.

Cada evaluación del historial muestra su tipo de visita, fecha, hora y estado:

- **Completada:** se puede abrir para revisar los resultados.
- **Pendiente:** se puede seleccionar **Continuar** o **Reanudar** para retomar
  el flujo guardado.

En el encabezado del panel:

- **Editar Paciente** (ícono de lápiz): abre el formulario de edición.
- **Cerrar** (ícono X): cierra el panel.

Si el paciente no tiene evaluaciones, se muestra **Sin historial clínico
previo**.

### 4.4 Editar datos personales

1. Abrir el perfil clínico del paciente.
2. Presionar el ícono **Editar Paciente**.
3. Modificar los campos necesarios.
4. Presionar **Guardar cambios** o el botón equivalente del formulario.

Se conservan las mismas validaciones del registro: nombres, apellidos, DNI,
fecha de nacimiento y, si el paciente es menor, datos obligatorios del
apoderado. Si se cambia la fecha de nacimiento y la persona pasa a ser menor
de edad, se deben completar los datos del apoderado antes de guardar.

---

## 5. Evaluaciones diagnósticas

Ruta: **Diagnóstico** o botón **Nuevo Diagnóstico** del panel principal.

El flujo se divide en cinco pasos. El sistema guarda el avance de la evaluación
en curso para permitir su reanudación.

### Paso 1: Identificación del paciente

Se debe mostrar:

- Buscador de pacientes por nombre, apellido o DNI.
- Resultados de búsqueda.
- Botón **Seleccionar**.
- Datos del paciente seleccionado.
- Alternativa para **Registrar y Continuar** si el paciente no existe.
- Botón **Seleccionar otro** para cambiar de paciente.

Antes de continuar se debe verificar que el paciente seleccionado sea el
correcto. No iniciar una evaluación con el expediente de otra persona.

### Paso 2: Contexto clínico

Se debe mostrar:

- **Tipo de visita** con las opciones:
  - Primera vez.
  - Control rutina.
  - Urgencia.
  - Seguimiento.
- Campo obligatorio **Motivo de Consulta**.
- Campo opcional **Observaciones Clínicas Previas**.
- Botón **Guardar y Continuar**.

El motivo de consulta debe describir la razón principal por la que el paciente
acude. Las observaciones pueden incluir antecedentes o datos clínicos
relevantes. Verificar que el tipo de visita seleccionado corresponda a la
atención que se está registrando.

### Paso 3: Carga de radiografías

Se debe mostrar:

- Área para seleccionar o arrastrar una imagen.
- Tipo de radiografía, priorizando **PANORÁMICA** para este flujo.
- Vista previa de cada imagen.
- Nombre y tamaño del archivo.
- Control para agregar o eliminar una radiografía.
- Botón **Continuar**.

**Validaciones:**

- La imagen es revisada por un validador antes del procesamiento.
- Si la imagen no parece una radiografía panorámica válida, se muestra un modal
  de imagen inválida y se debe reemplazar el archivo.
- Solo se deben cargar imágenes legibles, completas y correspondientes al
  paciente actual.
- Si se elimina una imagen ya cargada, confirmar la acción en el modal.
- No continuar sin haber cargado la radiografía requerida.
- Si el validador no responde por un problema de red, verificar visualmente la
  imagen antes de continuar y reportar cualquier comportamiento anómalo.

### Paso 4: Procesamiento de IA

Se debe mostrar la **Cola de Procesamiento** con una fila por radiografía y
estados como:

- En espera.
- Analizando.
- Completado.
- Error, si corresponde.

También se puede mostrar el progreso y el tiempo transcurrido. Durante el
procesamiento:

- No cerrar la pestaña ni recargar la página.
- No volver a cargar la misma imagen.
- Esperar hasta que todas las radiografías terminen.
- Si la evaluación aparece como pendiente, utilizar **Reanudar** desde el
  historial en lugar de crear otra evaluación duplicada.

### Paso 5: Resultados y cierre

Cuando el procesamiento termina se habilitan el visor de resultados y el cierre
clínico. Revisar todos los hallazgos antes de finalizar.

En el cierre se muestra:

- Campo **Diagnóstico Final**.
- Botón **Finalizar Diagnóstico**.
- Botón **Exportar PDF** cuando esté habilitado.

El diagnóstico final debe ser redactado por el odontólogo con base en la
historia clínica, la radiografía, los hallazgos de la IA y la evaluación
profesional. Presionar **Finalizar Diagnóstico** solo después de completar la
revisión. El sistema muestra una confirmación y luego retorna al panel.

---

## 6. Visualización e interpretación de resultados

### 6.1 Visor de radiografía

El visor debe mostrar la radiografía procesada y las cajas delimitadoras
(*bounding boxes*) alrededor de las regiones detectadas.

Controles que deben señalarse:

- **Mostrar cajas / Ocultar cajas:** activa o desactiva las cajas.
- **Mostrar etiquetas / Ocultar etiquetas:** muestra u oculta el nombre de la
  clase; requiere que las cajas estén activas.
- **Aislar selección:** muestra únicamente el hallazgo seleccionado.
- Flechas de radiografía anterior y siguiente cuando existe más de una imagen.
- Controles de zoom, desplazamiento o ampliación del visor, cuando estén
  disponibles.

### 6.2 Lectura de hallazgos

Cada tarjeta de hallazgo debe indicar:

- Clase o severidad detectada.
- Ubicación visual mediante la caja en la radiografía.
- Nivel de confianza.
- Distribución porcentual por clase:
  - **Caries Incipiente**.
  - **Caries Profunda**.
  - **Caries Periapical (Avanzada)**.

Las categorías se identifican visualmente por colores: incipiente, moderada o
profunda y avanzada o periapical. Seleccionar una tarjeta debe resaltar el
hallazgo correspondiente en la imagen. La confianza no equivale a certeza
clínica: un porcentaje alto no reemplaza la revisión del odontólogo.

### 6.3 Diagnóstico y tratamiento

Después de revisar los hallazgos:

1. Confirmar que la radiografía corresponde al paciente.
2. Revisar cada caja y cada clase detectada.
3. Comparar el resultado con el motivo de consulta y las observaciones.
4. Redactar el **Diagnóstico Final**.
5. Registrar las indicaciones clínicas y el plan de tratamiento según el
   criterio profesional y los protocolos de la clínica.
6. Presionar **Finalizar Diagnóstico**.

El usuario no debe aceptar automáticamente una detección como diagnóstico
definitivo. Las detecciones pueden ser omitidas o revisadas por el filtro de
validación, por lo que la evaluación clínica sigue siendo obligatoria.

---

## 7. Módulo de reportes

Ruta: **Reportes**. En la parte superior se muestran cuatro botones o pestañas:

1. **Precisión y Rendimiento de IA**.
2. **Epidemiológico de Caries**.
3. **Productividad Clínica**.
4. **Evolución del Paciente** (reporte de diagnóstico individual).

Al cambiar de pestaña el sistema carga la información correspondiente. Si los
datos están cargando se debe esperar; si ocurre un error, se muestra un mensaje
de reporte no disponible y se puede volver a intentar.

### 7.1 Reporte de rendimiento de IA

Debe mostrar y explicar:

- Confianza media.
- Aceptación clínica.
- Tasa de rechazo.
- Total de detecciones o resultados analizados.
- Resultados válidos y rechazados.
- Gráficos o tarjetas de métricas.

La **tasa de rechazo** representa detecciones o registros que no superaron el
filtro de validación, por ejemplo imágenes incorrectas. No debe interpretarse
como una tasa de enfermedad en pacientes.

### 7.2 Reporte epidemiológico

Debe mostrar:

- Total histórico de lesiones.
- Total de pacientes evaluados.
- Distribución por severidad.
- Gráfico de incidencia por grupo etario:
  - 0-9 años.
  - 10-17 años.
  - 18-34 años.
  - 35-54 años.
  - 55 años o más.
- Leyenda de colores para incipiente, moderada/profunda y avanzada/periapical.

Al leerlo, comparar los grupos utilizando la misma unidad de medida y verificar
si existen datos suficientes. La ausencia de datos debe mostrarse como
**No hay datos suficientes**, no como cero casos clínicos.

### 7.3 Reporte de productividad clínica

Debe mostrar:

- Total general de atenciones o evaluaciones.
- Número de especialistas.
- Promedio de atenciones por especialista.
- Tendencia de atenciones en el tiempo.
- Rendimiento por especialista.
- Distribución por tipo de visita.

Este reporte sirve para revisar la carga de trabajo y los tipos de atención
registrados; no debe utilizarse para modificar diagnósticos clínicos.

### 7.4 Reporte de diagnóstico individual

Se accede desde la pestaña **Evolución del Paciente**. Debe permitir revisar la
evolución de un paciente mediante:

- Selección o búsqueda del paciente.
- Línea de tiempo de evaluaciones.
- Comparación de radiografías **ANTES** y **DESPUÉS**.
- Cajas delimitadoras asociadas a cada evaluación.
- Tipo y fecha de visita.
- Diagnósticos registrados y hallazgos por clase.

El control deslizante de comparación permite mover la división entre la imagen
anterior y la posterior. Utilizarlo para observar cambios, pero siempre
verificar las imágenes y el expediente clínico originales.

> **Captura sugerida:** pestañas de los cuatro reportes y una captura individual
> de cada reporte con sus tarjetas y gráficos principales.

---

## 8. Estados, errores y recomendaciones

- **Cargando:** esperar a que termine la operación antes de repetirla.
- **Pendiente:** la evaluación fue iniciada, pero todavía no está finalizada;
  utilizar **Reanudar**.
- **Completada:** el expediente puede abrirse y revisarse.
- **Error de red:** verificar la conexión y volver a intentar. Si el error
  persiste, registrar el mensaje y contactar al soporte.
- **No se encontraron pacientes:** modificar el texto de búsqueda o limpiar los
  filtros.
- **Imagen inválida:** retirar el archivo y cargar una radiografía panorámica
  legible.

Antes de cerrar una evaluación se recomienda verificar:

- Paciente correcto.
- Tipo de visita correcto.
- Motivo de consulta completo.
- Radiografía correcta y legible.
- Hallazgos revisados uno por uno.
- Diagnóstico final redactado.
- Tratamiento definido por el odontólogo.

---

## 9. Checklist para capturas del manual

Para la versión ilustrada del manual se recomienda incluir:

1. Pantalla de inicio de sesión.
2. Mensaje de credenciales inválidas.
3. Modal de recuperación de contraseña.
4. Menú lateral y configuración del perfil.
5. Formulario de paciente adulto.
6. Formulario de paciente menor con datos del apoderado.
7. Listado de pacientes con buscador y filtros.
8. Panel de perfil clínico e historial.
9. Paso de contexto clínico.
10. Paso de carga de radiografía y validación de imagen inválida.
11. Cola de procesamiento.
12. Visor con cajas y controles de etiquetas/aislamiento.
13. Tarjetas de hallazgos y confianza.
14. Campo de diagnóstico final y botón de finalización.
15. Las cuatro pestañas del módulo de reportes.

