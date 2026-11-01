# Manual de usuario - Sistema Sonríe

Este manual corresponde a la versión actual del sistema e incorpora los módulos
de Preferencias, Odontólogos, Solicitudes, Mensajes de soporte, Soporte / Ayuda
y Diagnósticos pendientes.

## 1. Propósito del manual

Este manual explica cómo utilizar el Sistema Sonríe para gestionar pacientes,
crear evaluaciones diagnósticas asistidas por inteligencia artificial (IA),
revisar los resultados, consultar los reportes y administrar las opciones de
cuenta y soporte del sistema.

El sistema es una herramienta de apoyo. Los hallazgos, las cajas delimitadoras
y los porcentajes de confianza deben ser revisados e interpretados por el
odontólogo antes de emitir el diagnóstico clínico y definir el tratamiento.

Los módulos administrativos —Odontólogos, Solicitudes y Mensajes de soporte—
solo están disponibles para los roles autorizados. Si una opción no aparece en
el menú, significa que la cuenta no tiene permiso para utilizarla.

## 2. Elementos generales de la interfaz

### 2.1 Panel principal

Ruta: **Inicio** (`/dashboard`).

Después de iniciar sesión se muestra el **Panel de Inicio**, con el resumen
general de la clínica. La pantalla debe mostrar:

| Elemento | Descripción |
| --- | --- |
| **Total Pacientes** | Cantidad total de pacientes registrados. |
| **Diagnósticos** | Total de diagnósticos realizados, con el número de completados y pendientes. |
| **Radiografías** | Total de radiografías digitales subidas y almacenadas. |
| **Diagnósticos Hoy** | Diagnósticos finalizados durante el día, comparados con el día anterior. |
| **Accesos Rápidos** | Botones **Nuevo diagnóstico**, **Ver Pacientes**, **Diagnósticos Pendientes** y **Estadísticas y Reportes**. |
| **Últimos Diagnósticos** | Evaluaciones recientes con paciente, tipo de visita, fecha y estado. |
| **Caries Más Encontradas** | Gráfico de las localizaciones con mayor cantidad de detecciones. |

En **Últimos Diagnósticos**, las evaluaciones pendientes muestran el botón
**Continuar diagnóstico**, que permite retomar el flujo guardado. Las
evaluaciones completadas muestran su estado y pueden abrirse desde el historial.

Los accesos rápidos conducen a los módulos correspondientes. El botón **Nuevo
diagnóstico** inicia una evaluación nueva; si se intenta reanudar un caso
pendiente, el sistema conserva el avance registrado.

> **Captura sugerida:** panel principal completo, con las cuatro tarjetas de
> indicadores, los accesos rápidos y los paneles de actividad reciente.

### 2.2 Menú lateral, roles y permisos

El menú lateral se muestra después de iniciar sesión y contiene las opciones
autorizadas para la cuenta:

| Opción | Ruta | Visible para |
| --- | --- | --- |
| **Inicio** | `/dashboard` | Usuarios con permiso o administradores. |
| **Diagnóstico** | `/nueva-evaluacion` | Usuarios con permiso o administradores. |
| **Pacientes** | `/pacientes` | Usuarios con permiso o administradores. |
| **Historial de diagnósticos** | `/historial` | Usuarios con permiso o administradores. |
| **Reportes** | `/reportes` | Usuarios con permiso o administradores. |
| **Configuración > Preferencias** | `/configuracion` | Todos los usuarios. |
| **Configuración > Mi Perfil** | `/perfil` | Todos los usuarios. |
| **Configuración > Odontólogos** | `/usuarios` | Administradores y superadministradores. |
| **Configuración > Solicitudes** | `/solicitudes` | Administrador principal y superadministradores. |
| **Configuración > Msg soporte** | `/soporte-mensajes` | Superadministradores. |
| **Soporte / Ayuda** | `/ayuda` | Todos los usuarios. |
| **Cerrar sesión** | — | Todos los usuarios. |

Los roles del sistema son:

- **Odontólogo:** acceso clínico estándar. Solo ve los módulos marcados en sus
  permisos.
- **Administrador:** acceso total a los módulos clínicos y a la gestión de
  odontólogos.
- **Superadministrador:** acceso total, incluida la bandeja de mensajes de
  soporte y la gestión de solicitudes.
- **Administrador principal:** cuenta con `id_odontologo` igual a `1`. Sus
  permisos no se pueden modificar y, junto con los superadministradores, puede
  aprobar solicitudes y asignar el rol de superadministrador.

Reglas de permisos:

- Los administradores ven todos los módulos principales de forma automática,
  aunque no tengan rutas marcadas en la configuración de permisos.
- A los odontólogos se les asignan módulos específicos: **Inicio**,
  **Diagnóstico**, **Pacientes**, **Historial de diagnósticos** y **Reportes**.
- Un administrador que no sea el administrador principal no puede modificar sus
  propios permisos ni asignar el rol de superadministrador.
- Cuando un administrador normal intenta cambiar el rol de otro usuario, el
  sistema genera una **solicitud** que debe ser aprobada por el administrador
  principal o por un superadministrador.
- **Mi Perfil** y **Soporte / Ayuda** están disponibles aunque el usuario no
  tenga permisos sobre los módulos clínicos.

El icono de menú permite contraer o expandir la barra lateral. Cuando está
contraída, se deben utilizar los iconos o sus textos emergentes. En pantallas
pequeñas el menú se abre como panel lateral y se cierra al seleccionar una
opción o presionar la tecla `Esc`.

Las opciones **Solicitudes** y **Msg soporte** pueden mostrar un contador con la
cantidad de elementos pendientes.

> **Captura sugerida:** menú lateral expandido, con los módulos principales, el
> submenú **Configuración** abierto y los contadores de pendientes señalados.

---

## 3. Inicio de sesión y gestión de cuenta

### 3.1 Iniciar sesión

En la pantalla **INICIAR SESIÓN** se deben mostrar y señalar:

1. Logo y nombre del sistema.
2. Campo **Correo Electrónico**.
3. Campo **Contraseña**.
4. Casilla **Recordarme (Opcional)**.
5. Botón **Iniciar sesión**.
6. Enlace **¿Olvidaste tu clave?**.
7. Área de mensajes de error.

**Procedimiento:**

1. Escribir el correo registrado.
2. Escribir la contraseña.
3. Marcar **Recordarme** solo si se utiliza un equipo seguro.
4. Presionar **Iniciar sesión**.
5. Esperar la redirección al panel principal.

**Validaciones y mensajes:**

- Ambos campos son obligatorios.
- El correo debe tener un formato válido, por ejemplo
  `odontologo@dominio.com`.
- Mientras se procesa el acceso se muestra un estado de carga; no se debe
  presionar varias veces el botón.
- Si las credenciales no son correctas, se muestra **Credenciales incorrectas**
  o **Credenciales incorrectas o usuario inactivo**.
- Después de **cinco intentos fallidos**, la dirección IP queda bloqueada
  durante **cinco minutos**. El mensaje indica el tiempo restante y no se debe
  seguir intentando.
- Si no existe una sesión válida, las pantallas protegidas redirigen nuevamente
  al inicio de sesión.
- La opción **Recordarme** conserva las credenciales en el navegador. Se debe
  evitar utilizarla en computadoras compartidas.

> **Captura sugerida:** pantalla de inicio de sesión y mensaje de credenciales
> inválidas o de bloqueo temporal.

### 3.2 Recuperar la contraseña

Al presionar **¿Olvidaste tu clave?** se abre el modal **Recuperar Contraseña**.

**Procedimiento:**

1. Ingresar el correo electrónico de la cuenta.
2. Presionar **Verificar**.
3. Leer el mensaje mostrado por el sistema:
   - **Solicitud enviada exitosamente:** la solicitud quedó pendiente y debe ser
     revisada por un administrador.
   - **Solicitud pendiente de aprobación:** ya existe una solicitud abierta; se
     debe esperar su revisión.
   - **Solicitud aprobada:** se habilita el paso para establecer la nueva
     contraseña.
4. Cuando la solicitud esté aprobada, ingresar **Nueva Contraseña** y
   **Confirmar Contraseña**.
5. Presionar **Actualizar**.
6. Cerrar el modal y volver a iniciar sesión con la nueva contraseña.

**Validaciones:**

- El correo debe tener un formato válido y pertenecer a una cuenta activa.
- La nueva contraseña debe tener al menos **6 caracteres**.
- Las dos contraseñas nuevas deben coincidir.
- No se puede establecer una nueva contraseña mientras la solicitud no haya
  sido aprobada. La aprobación se realiza en el módulo **Solicitudes**.
- Los errores de conexión o del servidor se muestran dentro del modal.

> **Captura sugerida:** modal de recuperación en el paso de verificación y en el
> paso de establecimiento de la nueva contraseña.

### 3.3 Configurar el perfil del odontólogo

Ruta: **Configuración > Mi Perfil** (`/perfil`).

La pantalla debe mostrar:

- Fotografía de perfil y control para seleccionar una nueva imagen.
- **Información Personal:** **Nombres**, **Apellidos**, **Correo Electrónico**
  y **Teléfono**.
- **Información Profesional:** **Número de Colegiatura (Opcional)** y
  **Especialidad (Opcional)**.
- Sección **Seguridad:** **Contraseña Actual**, **Nueva Contraseña** y
  **Confirmar Contraseña**.
- Botón **Guardar teléfono**.
- Botón **Actualizar Contraseña**.
- En el editor de fotografía, botón **Aplicar y Guardar** y opción para
  cancelar o cerrar el ajuste.

**Datos editables:**

| Campo | Estado | Validación |
| --- | --- | --- |
| **Nombres** | Solo lectura | Se modifica mediante solicitud al administrador. |
| **Apellidos** | Solo lectura | Se modifica mediante solicitud al administrador. |
| **Correo Electrónico** | Solo lectura | Se modifica mediante solicitud al administrador. |
| **Teléfono** | Editable | Obligatorio, 9 dígitos y debe empezar en 9. |
| **Número de Colegiatura** | Solo lectura | Se modifica mediante solicitud al administrador. |
| **Especialidad** | Solo lectura | Se modifica mediante solicitud al administrador. |

El sistema indica: **Para modificar otros datos de tu perfil, contacta al
administrador mediante el módulo Soporte / Ayuda.** Por ello, el único dato
personal que se guarda desde esta pantalla es el teléfono.

**Validaciones de datos generales:**

- El teléfono debe contener exactamente nueve dígitos y comenzar en 9.
- El botón **Guardar teléfono** permanece deshabilitado si no hay cambios o si
  el teléfono no es válido.
- Se debe esperar el mensaje de confirmación antes de abandonar la pantalla.

**Validaciones de contraseña:**

- Los tres campos son obligatorios.
- La nueva contraseña debe tener al menos **6 caracteres**.
- La nueva contraseña debe ser diferente de la actual.
- La nueva contraseña y su confirmación deben coincidir.
- El sistema muestra la dificultad de la contraseña como **Baja**, **Media** o
  **Alta**.
- Si la contraseña actual no es correcta, se muestra el error del servidor.
- Al finalizar se muestra un mensaje de confirmación y los campos se limpian.

**Fotografía:**

1. Seleccionar la fotografía.
2. Ajustar el encuadre en el editor **Ajustar Foto**.
3. Presionar **Aplicar y Guardar**.
4. Esperar el mensaje de actualización exitosa.

> **Captura sugerida:** perfil con la fotografía, los campos de solo lectura, el
> teléfono editable y la tarjeta de seguridad.

---

## 4. Gestión de pacientes

Ruta: **Pacientes** (`/pacientes`).

### 4.1 Listado, búsqueda y vistas

La pantalla **Gestión de Pacientes** debe mostrar:

- Título **Gestión de Pacientes**.
- Contador **Total pacientes**.
- Botón **Registrar Paciente**.
- Buscador con el texto **Buscar por nombres, apellidos o DNI (Opcional)...**.
- Selector de vistas.
- Filtros agrupados por categoría.
- Listado de pacientes y paginación.

**Vistas disponibles:**

| Vista | Descripción |
| --- | --- |
| **Vista de Cuadrícula** | Tarjetas de paciente en una cuadrícula. |
| **Vista de Tabla** | Listado compacto con ordenamiento por columna. |
| **Vista de Lista Expandida** | Filas con mayor detalle del paciente. |
| **Tablero Kanban** | Columnas **Nuevos**, **Diagnóstico Pendiente**, **En Tratamiento** y **En Control**. |

**Filtros:**

- Grupo **Pacientes:** **Todos**, **Menores de edad**, **Mayores de edad** y
  **Nuevos Pacientes**.
- Grupo **Diagnósticos:** **Con Diagnóstico Pendiente**, **Atendidos este
  mes**, **Urgencias** y **Controles de rutina**.

Para buscar, escribir el nombre, apellido o DNI en el buscador. La lista se
actualiza con coincidencias parciales. Si no hay coincidencias, se muestra
**No se encontraron pacientes** y la indicación de probar otros términos o
limpiar los filtros.

La vista de tabla muestra las columnas **Paciente**, **DNI**, **Edad** y
**Última atención**. Los pacientes con una evaluación pendiente se identifican
con la etiqueta **Dx pendiente** y un indicador lateral.

La paginación muestra **12 pacientes por página** en cuadrícula, tabla y lista.
El tablero Kanban muestra **6 pacientes por columna** y tiene paginación
independiente en cada columna.

> **Captura sugerida:** listado con el buscador, los dos grupos de filtros, el
> selector de vistas y la paginación.

### 4.2 Registrar un nuevo paciente

Presionar **Registrar Paciente**. El formulario **Registrar Nuevo Paciente**
debe mostrar los siguientes campos:

| Campo | Obligatorio | Observación |
| --- | --- | --- |
| **Nombres** | Sí | Mínimo 2 caracteres. |
| **Apellidos** | Sí | Mínimo 2 caracteres. |
| **DNI** | Sí | Exactamente 8 dígitos numéricos. |
| **Nacimiento** | Sí | No puede ser posterior a la fecha actual. |
| **Género** | Sí | Selección obligatoria. |
| **Teléfono** | Sí | 9 dígitos y debe empezar en 9. |
| **Dirección (Opcional)** | No | Dato complementario. |
| **Correo (Opcional)** | No | Si se informa, debe ser válido. |
| **Observaciones Generales (Opcional)** | No | Alergias, condiciones previas u otros datos. |
| **Nombre del Apoderado** | Solo para menores | Obligatorio si el paciente tiene menos de 18 años. |
| **Tel. Apoderado** | Solo para menores | Obligatorio si el paciente tiene menos de 18 años. |

**Validaciones del registro:**

- Nombres y apellidos son obligatorios y deben tener al menos dos caracteres.
- El DNI es obligatorio y debe tener ocho dígitos numéricos.
- La fecha de nacimiento es obligatoria y no puede ser posterior a la fecha
  actual.
- El género es obligatorio.
- El teléfono es obligatorio, debe tener nueve dígitos y comenzar en 9.
- Si se informa un correo, debe tener un formato válido.
- Al calcularse una edad menor de 18 años, se habilita el bloque **Datos del
  Apoderado (Obligatorio en menores de edad)**.
- Para un menor de edad son obligatorios el nombre y el teléfono del apoderado.
- El teléfono del apoderado debe tener nueve dígitos y comenzar en 9.
- Los errores aparecen debajo del campo correspondiente. También puede aparecer
  un mensaje general si el servidor rechaza el registro.
- No se debe cerrar el formulario mientras se muestra el estado de envío.

Presionar **Registrar Paciente**. Si el registro es exitoso, el paciente aparece
en el listado y queda disponible para iniciar una evaluación.

> **Captura sugerida:** formulario de paciente adulto y formulario de paciente
> menor con el bloque de apoderado resaltado.

### 4.3 Consultar el perfil y el historial del paciente

Hacer clic sobre una tarjeta, fila o elemento del tablero del paciente. Se abre
el panel **Perfil Clínico**, que debe mostrar:

- Nombre completo.
- DNI y fecha de nacimiento.
- Edad.
- Teléfono, correo y dirección.
- Datos del apoderado cuando correspondan.
- Sección **Historial de Diagnósticos** en forma de línea de tiempo.

**Filtros del historial:**

- **Fecha exacta**.
- **Tipo de visita**, con la opción **Todas las visitas**.
- **Desde** y **Hasta** para un rango de fechas.
- Botón **Limpiar** cuando hay filtros activos.

Cada evaluación del historial muestra su tipo de visita, fecha, hora y estado:

- **Completada:** se puede abrir con **Ver diagnóstico y radiografía**.
- **Pendiente:** se puede seleccionar **Continuar diagnóstico pendiente** para
  retomar el flujo guardado.

El historial tiene paginación propia. Si el paciente no tiene evaluaciones, se
muestra **Sin historial clínico previo**. Si los filtros no devuelven
resultados, se muestra el aviso correspondiente y la opción de corregir las
fechas.

En el encabezado del panel:

- **Editar Paciente** (icono de lápiz): abre el formulario de edición.
- **Cerrar** (icono X): cierra el panel.

> **Captura sugerida:** panel **Perfil Clínico** con los datos del paciente, los
> filtros del historial y una línea de tiempo con evaluaciones completadas y
> pendientes.

### 4.4 Editar datos personales

1. Abrir el perfil clínico del paciente.
2. Presionar el icono **Editar Paciente**.
3. Modificar los campos necesarios.
4. Presionar **Registrar Paciente** o el botón equivalente del formulario.

Se conservan las mismas validaciones del registro: nombres, apellidos, DNI,
fecha de nacimiento, teléfono y, si el paciente es menor, datos obligatorios del
apoderado. Si se cambia la fecha de nacimiento y la persona pasa a ser menor de
edad, se deben completar los datos del apoderado antes de guardar.

---

## 5. Evaluaciones diagnósticas

Ruta: **Diagnóstico** (`/nueva-evaluacion`) o botón **Nuevo diagnóstico** del
panel principal.

El flujo se divide en cinco pasos:

1. **Identificación del Paciente**.
2. **Contexto Clínico**.
3. **Carga de Radiografías**.
4. **Resumen y Ejecución**.
5. **Resultados**.

El sistema guarda el avance de la evaluación en curso para permitir su
reanudación. Si se cierra la pantalla, se puede retomar el caso desde el
historial o desde **Diagnósticos Pendientes**.

### 5.1 Paso 1: Identificación del Paciente

Se debe mostrar:

- Pestañas **Buscar Paciente** y **Registrar Nuevo**.
- Buscador con el texto **Ingrese DNI o Nombre del paciente (Opcional)...**
- Botón **Buscar**.
- Sección **Resultados Encontrados**.
- Botón **Seleccionar** en cada resultado.
- Tarjeta **Paciente Seleccionado** con los datos del paciente.
- Enlace **Seleccionar otro** para cambiar de paciente.

Los resultados muestran nombres, apellidos, DNI y edad. Se listan hasta cuatro
coincidencias. Si no hay resultados, se muestra **No se encontraron pacientes
que coincidan con la búsqueda**.

Antes de continuar se debe verificar que el paciente seleccionado sea el
correcto. No iniciar una evaluación con el expediente de otra persona. Si el
paciente no existe, utilizar **Registrar Nuevo** y completar el formulario.

### 5.2 Paso 2: Contexto Clínico

Se debe mostrar:

- **Tipo de Visita** con las opciones:
  - **Primera vez**.
  - **Control rutina**.
  - **Urgencia**.
  - **Seguimiento**.
- Campo obligatorio **Motivo de Consulta**.
- Campo opcional **Observaciones Clínicas Previas**.
- Botón **Guardar y Continuar**.

El motivo de consulta debe describir la razón principal por la que el paciente
acude. Las observaciones pueden incluir antecedentes, signos vitales o datos
clínicos relevantes. Verificar que el tipo de visita seleccionado corresponda a
la atención que se está registrando.

### 5.3 Paso 3: Carga de Radiografías

Se debe mostrar:

- Selector **Tipo de Imagen** con las opciones **Panorámica**,
  **Interproximal** y **Periapical**.
- Área para hacer clic, arrastrar o soltar una imagen.
- Vista previa de cada radiografía.
- Nombre y tamaño del archivo.
- Botón **Cambiar Imagen** cuando ya existe una vista previa.
- Botón **Agregar radiografía adicional**.
- Control para eliminar una radiografía.
- Botón **Continuar**.

**Restricción del análisis por IA:**

- El análisis automático solo está disponible para el formato **Panorámica**.
- Si se selecciona **Interproximal** o **Periapical**, el sistema muestra
  **Análisis no disponible** y el texto **Por el momento el análisis por IA
  solo está entrenado para formato Panorámica**.
- Para continuar con el análisis se debe cambiar el tipo a **Panorámica** y
  cargar una imagen válida.

**Validaciones:**

- La imagen es revisada por un validador antes del procesamiento.
- Si la imagen no parece una radiografía panorámica válida, se muestra un modal
  de imagen inválida y se debe reemplazar el archivo.
- Solo se deben cargar imágenes legibles, completas y correspondientes al
  paciente actual.
- Si se elimina una imagen ya cargada, se debe confirmar la acción en el modal
  **Eliminar radiografía**.
- No continuar sin haber cargado la radiografía requerida.
- Si el validador no responde por un problema de red, verificar visualmente la
  imagen antes de continuar y reportar cualquier comportamiento anómalo.
- Mientras se guardan las radiografías se muestra **Guardando radiografías...**;
  no se debe cerrar ni recargar la pantalla.

> **Captura sugerida:** paso de carga con una radiografía panorámica válida y,
> en otra imagen, el aviso **Análisis no disponible** para un tipo no
> compatible.

### 5.4 Paso 4: Resumen y Ejecución

En este paso se muestra el **Asistente Diagnóstico**, con el texto
**Radiografías han sido procesadas con éxito. El modelo analizará cada
radiografía.** y el botón **Iniciar Detección**.

A la derecha se muestra la **Cola de Procesamiento**, con una fila por
radiografía. Cada fila incluye:

- Miniatura de la imagen.
- Tipo de radiografía: **PANORÁMICA**, **INTERPROXIMAL** o **PERIAPICAL**.
- Nombre del archivo.
- Tamaño del archivo.

Al presionar **Iniciar Detección** se abre el modal de análisis, que muestra:

- Título **Procesando Radiografías** o **Procesamiento Completado**.
- Mensaje **Analizando estructura dental ...** o **Radiografías analizadas
  correctamente**.
- Estado **En cola**, **Analizando** o **Completado** por cada imagen.
- Porcentaje de avance y barra de progreso.
- **Tiempo transcurrido**.
- Botón **Ver resultados** cuando todas las radiografías terminan.

Durante el procesamiento:

- No cerrar la pestaña ni recargar la página.
- No volver a cargar la misma imagen.
- Esperar hasta que todas las radiografías terminen.
- Si la evaluación aparece como pendiente, utilizar **Continuar** desde el
  historial o **Continuar diagnóstico** desde **Diagnósticos Pendientes** en
  lugar de crear otra evaluación duplicada.

> **Captura sugerida:** **Asistente Diagnóstico** con la **Cola de
> Procesamiento** y el modal de análisis con sus estados y porcentajes.

### 5.5 Paso 5: Resultados

Cuando el procesamiento termina se habilitan el visor de resultados y el cierre
clínico. Revisar todos los hallazgos antes de finalizar.

La pantalla **Resultados** muestra:

- Visor de la radiografía con las detecciones.
- Selector de radiografías cuando existe más de una imagen.
- Contador de posibles lesiones detectadas.
- Tarjetas de hallazgo por diente o región.
- Sección **Cierre del Diagnóstico**.
- Campo **Diagnóstico Final (Opcional)**.
- Botón **Finalizar Diagnóstico**.
- Botón **Exportar PDF**.

El diagnóstico final debe ser redactado por el odontólogo con base en la
historia clínica, la radiografía, los hallazgos de la IA y la evaluación
profesional. Presionar **Finalizar Diagnóstico** solo después de completar la
revisión. El sistema muestra una confirmación y luego retorna al panel.

El botón **Exportar PDF** guarda el diagnóstico y descarga el expediente. Si la
evaluación ya fue completada, el sistema muestra un aviso y el enlace **Ir al
historial** para evitar duplicados.

> **Captura sugerida:** paso de resultados con el visor, las tarjetas de
> hallazgos, el campo de diagnóstico final y los botones de cierre.

### 5.6 Historial de diagnósticos

Ruta: **Historial de diagnósticos** (`/historial`).

La pantalla **Historial de Diagnósticos** permite consultar y filtrar todas las
evaluaciones. Debe mostrar:

- Buscador **Buscar por nombre, apellido o DNI (Opcional)...**
- Rango de fechas **Desde (Opcional)** y **Hasta (Opcional)**.
- Selector **Tipo de visita (Todos)** con **Primera vez**, **Control rutina**,
  **Urgencia** y **Seguimiento**.
- Selector **Todos los Estados** con **Completadas** y **Pendientes**.
- Botón **Limpiar filtros** cuando hay filtros activos.

La tabla muestra las columnas **Paciente**, **Fecha / Hora**, **Motivo /
Visita**, **Radiografías**, **Estado** y **Acciones**.

Estados y acciones:

- **Completada:** se puede abrir con **Ver detalle**.
- **Pendiente:** se puede abrir con **Ver detalle** o retomar con
  **Continuar**.

La vista móvil utiliza tarjetas con la misma información. El historial muestra
**10 resultados por página** y permite navegar entre páginas o ir a una página
específica.

Si no hay coincidencias, se muestra **No se encontraron diagnósticos** y la
indicación de ajustar los filtros.

> **Captura sugerida:** historial con los filtros de fecha, tipo de visita y
> estado, y una tabla con evaluaciones completadas y pendientes.

---

## 6. Visualización e interpretación de resultados

Ruta: **Historial de diagnósticos > Ver detalle** (`/evaluacion/:id`).

### 6.1 Visor de radiografía

El visor muestra la radiografía procesada y las cajas delimitadoras
(*bounding boxes*) alrededor de las regiones detectadas. Los controles son:

| Control | Función |
| --- | --- |
| **Mostrar cajas / Ocultar cajas** | Activa o desactiva las cajas delimitadoras. |
| **Mostrar etiquetas / Ocultar etiquetas** | Muestra u oculta el nombre de la clase; requiere que las cajas estén activas. |
| **Aislar selección / Desactivar aislamiento** | Muestra únicamente el hallazgo seleccionado. |
| **Alejar (`-`)** | Reduce el zoom de la imagen. |
| **Porcentaje de zoom** | Indica el nivel actual de ampliación. |
| **Acercar (`+`)** | Aumenta el zoom de la imagen. |
| **Restablecer (`1:1`)** | Devuelve la imagen a su escala y posición iniciales. |

La imagen se puede desplazar manteniendo presionado el botón del ratón o
arrastrando con el dedo en pantallas táctiles. Cuando existe más de una
radiografía, se muestran flechas para ir a la anterior o siguiente y una fila de
miniaturas en la parte inferior. El título **Radiografía Panorámica** y el
contador de imágenes permiten identificar la vista actual.

### 6.2 Lectura de hallazgos

Cada tarjeta de hallazgo indica:

- Número de diente o identificador del hallazgo.
- Localización o severidad detectada.
- Nivel de confianza.
- Distribución porcentual por clase:
  - **Caries Incipiente**.
  - **Caries Profunda**.
  - **Caries Periapical (Avanzada)**.

Las categorías se identifican visualmente por colores: incipiente, moderada o
profunda y avanzada o periapical. Seleccionar una tarjeta resalta el hallazgo
correspondiente en la imagen. La confianza no equivale a certeza clínica: un
porcentaje alto no reemplaza la revisión del odontólogo.

Si no se detectan lesiones, se muestra **No se detectaron caries en esta
imagen**.

### 6.3 Diagnóstico, cierre y expediente

Después de revisar los hallazgos:

1. Confirmar que la radiografía corresponde al paciente.
2. Revisar cada caja y cada clase detectada.
3. Comparar el resultado con el motivo de consulta y las observaciones.
4. Redactar el **Diagnóstico Final**.
5. Registrar las indicaciones clínicas y el plan de tratamiento según el
   criterio profesional y los protocolos de la clínica.
6. Presionar **Finalizar Diagnóstico**.

El expediente **Diagnóstico Clínico** muestra el **Diagnóstico Final** en modo
de solo lectura. También incluye **Contexto de Visita** con fecha, tipo de
visita, motivo de consulta y observaciones auxiliares, además de **Hallazgos del
Modelo**.

Los botones del expediente son:

- **Descargar Expediente:** disponible cuando la evaluación está completada y
  existe un diagnóstico registrado. Mientras se genera, muestra **Preparando
  PDF...**.
- **Volver a Pacientes:** regresa al listado de pacientes.

Si la evaluación no está completada o no tiene diagnóstico, se muestra **La
descarga estará disponible al finalizar este diagnóstico**.

El usuario no debe aceptar automáticamente una detección como diagnóstico
definitivo. Las detecciones pueden ser omitidas o revisadas por el filtro de
validación, por lo que la evaluación clínica sigue siendo obligatoria.

> **Captura sugerida:** visor con cajas y etiquetas activas, tarjetas de
> hallazgos con porcentajes y el expediente con el diagnóstico final.

---

## 7. Módulo de reportes

Ruta: **Reportes** (`/reportes`).

La pantalla **Estadísticas y reportes** muestra el botón **Ir al dashboard** y
cuatro pestañas:

1. **Precisión y Rendimiento de IA**.
2. **Epidemiológico de Caries**.
3. **Productividad Clínica**.
4. **Evolución del Paciente**.

Al cambiar de pestaña el sistema carga la información correspondiente y
conserva la última pestaña seleccionada. Si los datos están cargando se debe
esperar; si ocurre un error, se muestra un mensaje de reporte no disponible y se
puede volver a intentar.

### 7.1 Reporte de precisión y rendimiento de IA

Debe mostrar y explicar:

| Indicador | Descripción |
| --- | --- |
| **Confianza media** | Promedio de confianza global de las detecciones válidas. |
| **Aceptación clínica** | Porcentaje de resultados útiles tras el filtro de validación. |
| **Tasa de rechazo** | Porcentaje de errores o registros con confianza 0, asociados a imágenes incorrectas. |
| **Total detecciones** | Cantidad total de resultados analizados. |
| **Detecciones válidas** | Indicador radial con el porcentaje y tarjeta con la cantidad de resultados que superan el filtro de validación. |
| **Detecciones rechazadas** | Cantidad de resultados descartados. |
| **% detecciones rechazadas** | Porcentaje de rechazo sobre el total. |

También se muestra un **Resumen clínico** con la lectura rápida de los
indicadores.

La **tasa de rechazo** representa detecciones o registros que no superaron el
filtro de validación, por ejemplo imágenes incorrectas. No debe interpretarse
como una tasa de enfermedad en pacientes.

### 7.2 Reporte epidemiológico de caries

Debe mostrar:

- **Lesiones históricas:** total de caries clasificadas y procesadas.
- **Pacientes evaluados:** pacientes únicos con detecciones cariosas.
- **Edad media:** edad media estimada de los pacientes con lesiones.
- **Distribución de severidad**, con el gráfico **Caries históricas** y las
  categorías **Incipiente**, **Moderada (Profunda)** y **Avanzada
  (Periapical)**.
- **Incidencia por edad**, con el gráfico **Severidad vs edad**, agrupado por
  edad exacta del paciente.

La leyenda de colores distingue incipiente, moderada/profunda y
avanzada/periapical. Al leer el reporte, comparar los grupos utilizando la misma
unidad de medida y verificar si existen datos suficientes. La ausencia de datos
debe interpretarse como falta de información, no como cero casos clínicos.

### 7.3 Reporte de productividad clínica

Debe mostrar:

| Indicador | Descripción |
| --- | --- |
| **Total Evaluaciones** | Evaluaciones clínicas procesadas en total. |
| **Especialistas Activos** | Odontólogos con evaluaciones registradas. |
| **Promedio Evaluaciones/Médico** | Volumen promedio por especialista. |
| **Tendencia de Evaluaciones** | Gráfico **Volumen de Actividad** con pacientes y evaluaciones en el tiempo. |
| **Rendimiento por Especialista** | Tabla **Carga de Trabajo** con **Odontólogo**, **Especialidad**, **Completadas**, **En progreso** y **Total**. |
| **Distribución** | Gráfico **Tipos de Visita** con la proporción de cada tipo de atención. |

Este reporte sirve para revisar la carga de trabajo y los tipos de atención
registrados; no debe utilizarse para modificar diagnósticos clínicos.

### 7.4 Reporte de evolución del paciente

Se accede desde la pestaña **Evolución del Paciente**. Debe permitir revisar la
evolución de un paciente mediante:

- Buscador **Ej. Juan Pérez o 72458901 (Opcional)** para localizar por DNI,
  nombres o apellidos.
- Selección del paciente en los resultados de búsqueda.
- Cabecera con edad, sexo, primera visita y total de visitas.
- Gráfico **Curva de Actividad de Caries**, con la evolución de las detecciones
  por severidad.
- **Historial Clínico** narrativo con las visitas registradas.
- **Visor Comparativo Antes / Después**.

En la comparativa se puede seleccionar una radiografía anterior en
**Seleccionar radiografía anterior ("Antes") (Opcional)**. El control deslizante
permite mover la división entre la imagen anterior y la posterior. La leyenda
distingue **Incipiente**, **Moderada** y **Avanzada**. Utilizar la comparación
para observar cambios, pero siempre verificar las imágenes y el expediente
clínico originales.

Si el paciente solo tiene una visita procesada, el sistema muestra la imagen
cruda frente a la procesada de esa única visita. Si no hay radiografías
suficientes, se muestra **No se encontraron radiografías suficientes para hacer
la comparativa**.

> **Captura sugerida:** pestañas de los cuatro reportes y una captura individual
> de cada reporte con sus tarjetas, gráficos y tablas principales.

---

## 8. Preferencias

Ruta: **Configuración > Preferencias** (`/configuracion`).

La pantalla **Preferencias** permite personalizar la experiencia y revisar el
estado de los servicios. Contiene las siguientes secciones:

### 8.1 Apariencia

- Interruptor **Mantener la barra lateral expandida**.
- Si se desactiva, el menú lateral se mostrará contraído cada vez que se
  ingrese al sistema.
- La preferencia se guarda en el navegador del usuario.

### 8.2 Cuenta

Muestra los datos registrados:

- **Correo electrónico**.
- **Rol**.
- **Colegiatura**.
- **Especialidad**.

El botón **Editar perfil** abre la pantalla **Mi Perfil**.

### 8.3 Seguridad

La tarjeta **Cambiar contraseña** indica que, por seguridad, la contraseña se
actualiza desde el perfil. El botón **Ir a seguridad** abre **Mi Perfil** en la
sección correspondiente.

### 8.4 Estado del sistema

Muestra el estado de los servicios:

| Servicio | Dirección |
| --- | --- |
| **Backend Flask + MySQL** | `http://127.0.0.1:5000/api` |
| **Microservicio de IA** | `http://127.0.0.1:8000/api/health` |

Cada servicio puede mostrar:

- **Verificando:** se está comprobando la conexión.
- **En línea:** el servicio responde correctamente.
- **Sin conexión:** no se pudo establecer la conexión.

El botón **Reintentar** vuelve a comprobar ambos servicios. Si el backend o el
microservicio de IA aparecen sin conexión, no se debe iniciar un procesamiento
hasta restablecer el servicio y reportar el problema por **Soporte / Ayuda**.

> **Captura sugerida:** pantalla de preferencias con el interruptor de
> apariencia, los datos de cuenta y el estado de los servicios.

---

## 9. Odontólogos

Ruta: **Configuración > Odontólogos** (`/usuarios`).

Este módulo es exclusivo de administradores y superadministradores. Si una
cuenta sin permiso intenta acceder, se muestra **Acceso Restringido** y la
indicación de contactar al administrador principal.

La pantalla **Odontólogos del sistema** permite administrar únicamente el
personal odontológico autorizado. Debe mostrar:

- Botón **Nuevo odontólogo**.
- Indicadores **Total odontólogos**, **Activos**, **Inactivos** y
  **Especialidades**.
- Buscador **Buscar por nombres, apellidos, correo, colegiatura o especialidad
  (Opcional)...**
- Botón **Ocultar inactivos** o **Mostrar inactivos**.
- Sección **Listado de odontólogos**.

La tabla muestra las columnas **Odontólogo**, **Contacto**, **Perfil clínico**,
**Estado**, **Rol** y **Acciones**. Las acciones disponibles son:

- **Permisos:** abre el modal **Permisos de acceso**.
- **Editar:** abre el formulario con los datos del odontólogo.
- **Desactivar** o **Activar:** cambia el estado de la cuenta.

### 9.1 Registrar o editar un odontólogo

El formulario **Nuevo odontólogo** o **Editar odontólogo** contiene:

| Campo | Obligatorio | Observación |
| --- | --- | --- |
| **Nombres** | Sí | Mínimo 2 caracteres. |
| **Apellidos** | Sí | Mínimo 2 caracteres. |
| **Correo** | Sí | Debe ser válido y no puede repetirse en otra cuenta. |
| **Contraseña** | Sí al crear; opcional al editar | Mínimo 6 caracteres. Al editar, dejar en blanco conserva la actual. |
| **Colegiatura (Opcional)** | No | Si se informa, mínimo 2 caracteres. |
| **Teléfono** | Sí | 9 dígitos y debe empezar en 9. |
| **Especialidad (Opcional)** | No | Si se informa, mínimo 2 caracteres. |
| **Cuenta activa (Opcional)** | No | Define si el odontólogo puede iniciar sesión. |

Presionar **Guardar cambios** para registrar o actualizar la cuenta.

### 9.2 Gestionar permisos

El modal **Permisos de acceso** contiene:

1. **Rol del usuario:**
   - **Odontólogo:** acceso clínico estándar.
   - **Administrador:** control total y configuración.
   - **Superadministrador:** acceso total y bandeja de soporte.
2. **Módulos accesibles (Opcional):**
   - **Inicio**.
   - **Diagnóstico**.
   - **Pacientes**.
   - **Historial de diagnósticos**.
   - **Reportes**.

El botón **Guardar configuración** aplica los cambios.

**Reglas:**

- Los usuarios con rol de **Administrador** tienen acceso total a todos los
  módulos, independientemente de los módulos marcados.
- Solo el administrador principal o un superadministrador puede asignar el rol
  de **Superadministrador**. Para las demás cuentas, la opción aparece
  deshabilitada.
- Los permisos del **Administrador Principal** no se pueden modificar.
- Un administrador que no sea el administrador principal no puede modificar sus
  propios permisos.
- Si un administrador normal cambia el rol de otro usuario, el sistema muestra
  **¡Solicitud Enviada!** y el cambio queda pendiente de aprobación en
  **Solicitudes**.
- Si ya existe una solicitud de rol pendiente para el mismo usuario, el sistema
  muestra una advertencia y no permite crear otra.

> **Captura sugerida:** listado de odontólogos con sus indicadores y el modal de
> permisos con los roles y módulos.

---

## 10. Solicitudes

Ruta: **Configuración > Solicitudes** (`/solicitudes`).

Este módulo es exclusivo del administrador principal y de los
superadministradores. Permite aprobar o rechazar:

- Solicitudes de restablecimiento de contraseña.
- Solicitudes de ascenso a administrador.
- Solicitudes de degradación a odontólogo.

La pantalla **Solicitudes de Rol** debe mostrar:

- Buscador **Buscar por nombre (Opcional)...**
- Pestañas **Pendientes**, **Aprobadas** y **Rechazadas**, con el conteo de cada
  estado.
- Tarjetas de solicitud con el nombre del usuario, el tipo de solicitud, el
  solicitante o correo asociado y la fecha.

**Procedimiento:**

1. Abrir la pestaña **Pendientes**.
2. Revisar el tipo de solicitud y los datos del usuario.
3. Presionar **Aprobar** o **Rechazar**.
4. Esperar el modal **¡Operación Exitosa!** y presionar **Cerrar**.

**Efectos de la aprobación:**

- **Restablecer Contraseña:** el usuario queda habilitado para establecer una
  nueva contraseña desde **¿Olvidaste tu clave?**.
- **Ascender a Administrador:** el usuario recibe el rol y el acceso
  correspondiente.
- **Degradar a Odontólogo:** el usuario pierde el acceso administrativo.

Si una solicitud ya fue procesada, no se puede volver a aprobar o rechazar. Si
no hay solicitudes en la pestaña seleccionada, se muestra **No hay solicitudes**
y el estado consultado.

El contador del menú **Solicitudes** indica cuántas solicitudes están
pendientes.

> **Captura sugerida:** pestaña **Pendientes** con una solicitud de contraseña y
> una solicitud de rol, y el modal de operación exitosa.

---

## 11. Mensajes de soporte

Ruta: **Configuración > Msg soporte** (`/soporte-mensajes`).

Este módulo es exclusivo del superadministrador. Si otra cuenta intenta
acceder, se muestra **Acceso restringido** y el aviso de que la bandeja es
exclusiva del superadministrador.

La pantalla **Mensajes de soporte** permite revisar y responder los reportes
enviados desde **Soporte / Ayuda**. Debe mostrar:

- Botón **Actualizar**.
- Indicadores **Total**, **Sin responder** y **Respondidos**.
- Buscador **Buscar por código, asunto o usuario...**
- Filtros **Todos**, **Sin responder** y **Respondidos**.
- Selector de tipo: **Todos los tipos**, **Error**, **Consulta** y
  **Sugerencia**.
- Lista de mensajes con código, tipo, estado, asunto, descripción, usuario,
  correo y fecha.

**Procedimiento para responder:**

1. Seleccionar un mensaje de la lista.
2. Revisar **Usuario**, **Correo**, **Enviado**, **Página de origen** y
   **Descripción**.
3. Escribir la respuesta en el campo **Respuesta** o **Actualizar respuesta**.
4. Presionar **Enviar respuesta** o **Actualizar respuesta**.
5. Verificar el mensaje **Respuesta guardada correctamente**.

La respuesta queda visible para el usuario en **Soporte / Ayuda > Mis
mensajes**. Si el mensaje ya tenía respuesta, se muestra la fecha de la última
respuesta. El contador del menú **Msg soporte** indica cuántos mensajes están
sin responder.

> **Captura sugerida:** bandeja de mensajes con los indicadores, los filtros y el
> modal de respuesta.

---

## 12. Soporte / Ayuda

Ruta: **Soporte / Ayuda** (`/ayuda`).

La pantalla **Soporte / Ayuda** permite encontrar respuestas rápidas o
comunicarse con el administrador. Contiene:

### 12.1 Preguntas frecuentes

- Buscador **Buscar una pregunta...**
- Categorías: **Todas**, **Primeros pasos**, **Diagnóstico**, **Pacientes**,
  **Reportes**, **Cuenta** y **Soporte**.
- Lista desplegable de preguntas y respuestas.
- Paginación de **5 preguntas por página**, con navegación y opción de ir a una
  página específica.

Si no hay coincidencias, se muestra **No encontramos preguntas con ese
criterio** y la sugerencia de probar otra palabra o enviar una consulta.

### 12.2 Enviar un mensaje

El formulario muestra el **Usuario** y el correo de la sesión en modo de solo
lectura. Los campos son:

| Campo | Obligatorio | Validación |
| --- | --- | --- |
| **Tipo de mensaje** | Sí | **Consulta**, **Reportar un error** o **Sugerencia de mejora**. |
| **Asunto** | Sí | Entre 5 y 150 caracteres. |
| **Descripción** | Sí | Mínimo 10 caracteres; máximo 2000 caracteres. |

Presionar **Enviar mensaje**. Si el registro es exitoso, se muestra **Mensaje
registrado**, el **Código de referencia** y el botón **Registrar otro mensaje**.

La descripción debe incluir lo que ocurrió, qué se esperaba que sucediera y los
pasos para reproducir el problema. Los reportes llegan directamente al
superadministrador.

### 12.3 Mis mensajes

La sección **Mis mensajes** muestra:

- **Total enviados**.
- **Sin respuesta**.
- **Respondidos**.
- Lista de mensajes con código, tipo, estado, asunto y fechas.
- Detalle desplegable con **Tu mensaje** y, cuando exista, **Respuesta del
  administrador**.

Cada mensaje puede estar **Respondido** o **Sin respuesta**. La paginación
muestra **4 mensajes por página**. Si aún no se han enviado mensajes, se muestra
**Aún no has enviado mensajes**.

> **Captura sugerida:** centro de ayuda con las preguntas frecuentes, el
> formulario de mensaje y la sección **Mis mensajes** con una respuesta.

---

## 13. Diagnósticos pendientes

Ruta: **Diagnósticos pendientes** (`/pendientes`), accesible desde el acceso
rápido **Diagnósticos Pendientes** del panel principal.

La pantalla permite revisar las evaluaciones que siguen en espera y entrar a
cada caso para continuar el trabajo clínico. Debe mostrar:

- Botón **Actualizar cola**.
- Indicadores **Pendientes**, **Con radiografías**, **Urgencias** y
  **Controles**.
- Buscador **Buscar por paciente, DNI o motivo (Opcional)...**
- Filtros **Todas**, **Primera vez**, **Control rutina**, **Urgencia** y
  **Seguimiento**.
- Sección **Cola de trabajo**.

La tabla muestra las columnas **Paciente**, **Fecha / hora**, **Tipo de visita**,
**Radiografías** y **Acciones**. Las acciones disponibles son:

- **Ver detalle:** abre el expediente de la evaluación.
- **Continuar:** retoma el flujo de la evaluación pendiente.

La vista móvil utiliza tarjetas con la misma información. La cola muestra **10
resultados por página**.

Si no hay casos, se muestra **No hay diagnósticos pendientes** y **La cola está
vacía por ahora**. Si ocurre un error de carga, se muestra el mensaje
correspondiente y se puede presionar **Actualizar cola**.

> **Captura sugerida:** cola de trabajo con los indicadores, los filtros por tipo
> de visita y las acciones **Ver detalle** y **Continuar**.

---

## 14. Estados, errores y recomendaciones

### 14.1 Estados frecuentes

| Estado o mensaje | Significado | Acción recomendada |
| --- | --- | --- |
| **Cargando** | La operación está en proceso. | Esperar antes de repetirla. |
| **Pendiente** | La evaluación fue iniciada, pero no está finalizada. | Usar **Continuar** o **Continuar diagnóstico**. |
| **Completada** | La evaluación tiene diagnóstico final. | Abrir **Ver detalle** o **Descargar Expediente**. |
| **En cola** | La radiografía espera ser analizada. | Esperar a que termine el procesamiento. |
| **Analizando** | El modelo está procesando la imagen. | No cerrar ni recargar la pantalla. |
| **Completado** | El análisis de la radiografía terminó. | Presionar **Ver resultados**. |
| **Credenciales incorrectas** | El correo o la contraseña no son válidos. | Verificar los datos e intentar nuevamente. |
| **Demasiados intentos fallidos** | La IP fue bloqueada temporalmente. | Esperar cinco minutos antes de reintentar. |
| **Solicitud pendiente de aprobación** | La recuperación de contraseña aún no fue aprobada. | Esperar la revisión en **Solicitudes**. |
| **Análisis no disponible** | El tipo de radiografía no es compatible con la IA. | Cambiar a **Panorámica** y cargar una imagen válida. |
| **Imagen inválida** | La imagen no parece una radiografía panorámica válida. | Retirar el archivo y cargar una imagen legible. |
| **No se encontraron pacientes** | La búsqueda o los filtros no devolvieron resultados. | Modificar el texto o limpiar los filtros. |
| **No hay diagnósticos pendientes** | La cola está vacía. | Revisar el historial o actualizar la cola. |
| **Sin conexión** | El backend o el microservicio de IA no responden. | Presionar **Reintentar** y reportar el problema. |
| **La descarga estará disponible al finalizar este diagnóstico** | El expediente aún no puede exportarse. | Finalizar la evaluación y registrar el diagnóstico. |
| **Acceso Restringido / Acceso restringido** | La cuenta no tiene permisos para el módulo. | Contactar al administrador principal. |

### 14.2 Recomendaciones antes de cerrar una evaluación

Antes de presionar **Finalizar Diagnóstico** se recomienda verificar:

- Paciente correcto.
- Tipo de visita correcto.
- Motivo de consulta completo.
- Radiografía correcta, legible y en formato **Panorámica**.
- Hallazgos revisados uno por uno.
- Diagnóstico final redactado.
- Tratamiento definido por el odontólogo.

### 14.3 Buenas prácticas de uso

- No compartir credenciales ni usar **Recordarme** en equipos compartidos.
- Cerrar sesión al terminar la atención.
- No crear evaluaciones duplicadas para un caso pendiente; reanudar el flujo
  existente.
- Revisar siempre los resultados de la IA con criterio clínico.
- Registrar en **Soporte / Ayuda** cualquier error, incluyendo los pasos para
  reproducirlo.
- Mantener actualizados el teléfono y la fotografía del perfil.
- Verificar el estado de los servicios en **Preferencias** antes de iniciar un
  procesamiento masivo.

---

## 15. Checklist para capturas del manual

Para la versión ilustrada del manual se recomienda incluir:

1. Pantalla de inicio de sesión.
2. Mensaje de credenciales inválidas.
3. Mensaje de bloqueo por intentos fallidos.
4. Modal de recuperación de contraseña en sus dos pasos.
5. Panel principal con indicadores y accesos rápidos.
6. Menú lateral expandido y submenú **Configuración**.
7. Perfil con fotografía, datos de solo lectura y teléfono editable.
8. Sección de seguridad y cambio de contraseña.
9. Pantalla de preferencias y estado de los servicios.
10. Listado de pacientes con buscador, filtros y selector de vistas.
11. Formulario de paciente adulto.
12. Formulario de paciente menor con datos del apoderado.
13. Panel **Perfil Clínico** con historial y filtros.
14. Paso **Identificación del Paciente**.
15. Paso **Contexto Clínico**.
16. Paso **Carga de Radiografías** con imagen válida.
17. Aviso **Análisis no disponible** para tipo no compatible.
18. Paso **Resumen y Ejecución** con **Asistente Diagnóstico**.
19. **Cola de Procesamiento** y modal de análisis.
20. Paso **Resultados** con visor y tarjetas de hallazgos.
21. Visor con cajas, etiquetas, aislamiento y controles de zoom.
22. Expediente con diagnóstico final y botones de descarga.
23. Historial de diagnósticos con filtros y estados.
24. Las cuatro pestañas del módulo de reportes.
25. Reporte de precisión y rendimiento de IA.
26. Reporte epidemiológico de caries.
27. Reporte de productividad clínica.
28. Reporte de evolución del paciente y visor comparativo.
29. Módulo de odontólogos y modal de permisos.
30. Módulo de solicitudes con una solicitud pendiente.
31. Bandeja de mensajes de soporte y modal de respuesta.
32. Centro de ayuda con preguntas frecuentes y **Mis mensajes**.
33. Diagnósticos pendientes con la cola de trabajo.
