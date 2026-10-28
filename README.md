# Sistema Sonríe — Plan de despliegue

Sistema web para la gestión de pacientes y evaluaciones odontológicas, con un
microservicio de inteligencia artificial para analizar radiografías y detectar
caries.

## 1. Arquitectura del sistema

El despliegue está compuesto por los siguientes servicios:

| Componente | Tecnología | Puerto local | Responsabilidad |
|---|---|---:|---|
| Frontend | React 18 + Vite 5 | `3000` | Interfaz web para el personal odontológico |
| Backend | Flask 3 + SQLAlchemy | `5000` | Autenticación, pacientes, evaluaciones, reportes y persistencia |
| Microservicio IA | FastAPI + Uvicorn | `8000` | Validación de imágenes e inferencia de caries |
| Base de datos | MySQL | `3306` | Almacenamiento de usuarios, pacientes, evaluaciones y resultados |

Flujo principal:

```text
Navegador
   │
   ├──► Frontend React/Vite :3000
   │        │
   │        └──► Backend Flask :5000 ───► MySQL :3306
   │                              │
   │                              └──► API IA FastAPI :8000
   │
   └── Las imágenes procesadas se sirven desde el backend
```

## 2. Requisitos de infraestructura

### 2.1 Servidor de aplicación

Requisitos mínimos recomendados:

- Sistema operativo: Windows 10/11 de 64 bits, Ubuntu 22.04 LTS o equivalente.
- CPU: 4 núcleos.
- RAM: 8 GB como mínimo; 16 GB recomendado para procesar radiografías sin
  presión de memoria.
- Almacenamiento: 20 GB libres para el código, dependencias, modelos,
  imágenes subidas y resultados.
- Python **3.10.x de 64 bits**. Se recomienda usar la misma versión para el
  backend y el microservicio IA.
- Node.js **18 LTS o superior** y npm.
- Git, para obtener y actualizar el proyecto.
- Acceso de red entre los servicios en los puertos `3000`, `5000`, `8000` y
  `3306`, según dónde se instale cada componente.

### 2.2 Base de datos

- MySQL Server 8.0 o compatible.
- Base de datos: `bd_detec_caries`.
- Usuario con permisos para crear tablas, insertar, actualizar y consultar
  datos de la aplicación.
- Los archivos de referencia son:
  - `bd_detec_caries_tablas.sql`: estructura de tablas.
  - `bd_detec_caries_condatos.sql`: estructura y datos de prueba.

### 2.3 Aceleración para IA

El microservicio funciona en CPU, aunque una GPU NVIDIA con CUDA compatible
reduce el tiempo de inferencia. Si se utiliza GPU, PyTorch debe instalarse
con la versión de CUDA compatible con el controlador instalado en el servidor.

## 3. Estructura relevante del proyecto

```text
.
├── api_ia_sonrie/       # Microservicio FastAPI y modelos configurados
├── backend/              # API Flask y conexión con MySQL
├── frontend/             # Aplicación React/Vite
├── material_tesis/       # Scripts, documentación, datasets y resultados
├── bd_detec_caries_*.sql # Scripts de base de datos
├── requirements.txt      # Dependencias generales históricas del proyecto
└── package.json          # Dependencias auxiliares del proyecto
```

Cada aplicación tiene su propio archivo de dependencias. Para desplegar se
deben instalar como mínimo:

- `backend/requirements.txt` para Flask.
- `api_ia_sonrie/requirements.txt` para FastAPI.
- Dependencias de `frontend/package.json` mediante npm.

El código de IA utiliza además `ultralytics`, `torch`, `opencv-python`,
`numpy` y `Pillow`. Verifica que estén instaladas en el entorno del
microservicio antes de iniciarlo; la lista del archivo de requisitos debe
mantenerse sincronizada con el modelo que se despliegue.

## 4. Procedimiento de instalación y configuración

Los siguientes comandos están escritos para PowerShell en Windows. En Linux
se deben adaptar las rutas y el comando de activación del entorno virtual.

### 4.1 Obtener el código

```powershell
git clone https://github.com/AngelMontenegro12/tesis_deteccion_caries
cd sistema_sonrie_tesis
```

### 4.2 Crear el entorno virtual

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version
```

La versión debe mostrar Python `3.10.x`. Si PowerShell bloquea la activación,
habilita la ejecución de scripts para el usuario actual:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 4.3 Instalar dependencias del backend y de IA

```powershell
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
python -m pip install -r api_ia_sonrie\requirements.txt
python -m pip install ultralytics torch torchvision opencv-python numpy Pillow
```

Si se va a utilizar GPU NVIDIA, sustituye la instalación de `torch` por el
comando oficial de PyTorch correspondiente a la versión de CUDA del servidor.

### 4.4 Instalar dependencias del frontend

```powershell
cd frontend
npm ci
cd ..
```

Si no existe `package-lock.json` actualizado, usa `npm install` una vez y
conserva el archivo generado para despliegues reproducibles.

### 4.5 Crear la base de datos

Inicia MySQL y crea la base de datos:

```sql
CREATE DATABASE bd_detec_caries
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Después importa uno de los scripts:

```powershell
mysql -u <USUARIO_MYSQL> -p bd_detec_caries < bd_detec_caries_condatos.sql
```

Usa `bd_detec_caries_tablas.sql` cuando necesites únicamente la estructura
vacía. No importes ambos scripts sobre la misma base sin revisar previamente
las tablas y los datos incluidos.

## 5. Configuración del backend Flask

Crea o actualiza `backend/.env` sin subirlo al repositorio:

```dotenv
DATABASE_URL=mysql+pymysql://<USUARIO_MYSQL>:<CONTRASENA>@<HOST_MYSQL>:3306/bd_detec_caries
SECRET_KEY=<CLAVE_LARGA_Y_ALEATORIA>
IA_API_URL=http://127.0.0.1:8000/api/predict
```

El backend obtiene la conexión desde `DATABASE_URL`. La variable
`IA_API_URL` debe apuntar al endpoint `/api/predict` del microservicio IA.
Cuando los servicios estén en servidores distintos, sustituye `127.0.0.1` por
el nombre DNS o la IP privada del servidor de IA.

### PDF de diagnóstico

El endpoint `GET /api/evaluaciones/<id>/pdf` descarga un expediente únicamente
si la evaluación tiene un diagnóstico final guardado. Utiliza
`backend/app/templates/reportes/diagnostico_referencia.pdf` como fondo para
todas las páginas y agrega los datos clínicos, radiografías y hallazgos.
`diagnostico.docx` es el archivo editable de la clínica: si cambias su diseño,
vuelve a exportarlo con el nombre `diagnostico_referencia.pdf` en la misma
carpeta. Ambos archivos deben estar disponibles en el servidor. La generación
usa PyMuPDF, incluido en `backend/requirements.txt`.
Instala las dependencias con el mismo intérprete que inicia Flask; si usas
`.venv`, ejecuta `.venv\Scripts\python.exe -m pip install -r backend\requirements.txt`
desde la raíz del proyecto antes de iniciar el backend.

## 6. Configuración del microservicio de IA

El archivo `api_ia_sonrie/run.py` inicia FastAPI con Uvicorn. Crea o actualiza
`api_ia_sonrie/.env`:

```dotenv
HOST=0.0.0.0
PORT=8000
MODEL_PATH=models/dentex_caries_v1_3_mejorado.pt
CONFIDENCE=0.45
CLASIFICADOR_PATH=models/clasificador_panoramica.pt
CLASIFICADOR_THRESHOLD=0.60
```

### Modelos necesarios

Los archivos definidos en `MODEL_PATH` y `CLASIFICADOR_PATH` deben existir
antes de iniciar el servicio. Las rutas relativas se resuelven desde
`api_ia_sonrie`, por lo que los modelos deben quedar en:

```text
api_ia_sonrie/
└── models/
    ├── dentex_caries_v1_3_mejorado.pt
    └── clasificador_panoramica.pt
```

No reemplaces un modelo en producción sin registrar su versión y validar sus
resultados. Los archivos `.pt` son artefactos grandes y no deben guardarse en
el repositorio si superan los límites de GitHub; deben distribuirse mediante
el mecanismo de artefactos definido para el servidor.

## 7. Arranque de los servicios

Abre una terminal para cada servicio. Activa `.venv` en cada terminal.

### 7.1 Microservicio IA

```powershell
cd api_ia_sonrie
..\.venv\Scripts\Activate.ps1
python run.py
```

Queda disponible en `http://127.0.0.1:8000`.

### 7.2 Backend Flask

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
python run.py
```

Queda disponible en `http://127.0.0.1:5000`.

### 7.3 Frontend React

Para desarrollo:

```powershell
cd frontend
npm run dev
```

Queda disponible normalmente en `http://localhost:3000`.

Para generar los archivos de despliegue:

```powershell
cd frontend
npm run build
npm run preview
```

El frontend actualmente tiene URLs del backend escritas como
`http://localhost:5000` y el flujo de validación IA usa
`http://localhost:8000`. En un despliegue con dominios o servidores
separados, esas URLs deben cambiarse por las direcciones públicas o privadas
correspondientes, preferiblemente mediante una configuración por entorno.

## 8. Verificación posterior al despliegue

Comprueba los siguientes puntos en orden:

1. MySQL acepta conexiones con las credenciales de `backend/.env`.
2. El backend responde en `http://127.0.0.1:5000/api/test`.
3. El microservicio IA responde en `http://127.0.0.1:8000/api/health`.
4. El frontend abre sin errores en el navegador.
5. El inicio de sesión funciona.
6. Se puede crear un paciente y una evaluación.
7. Se puede subir una radiografía.
8. La evaluación se procesa y muestra las detecciones.
9. Las imágenes subidas se pueden consultar desde la aplicación.

Para validar el flujo completo desde consola:

```powershell
python material_tesis\scripts\validar_flujo.py "C:\ruta\a\radiografia.png"
```

El script usa un usuario y un paciente definidos en el propio archivo; para
un entorno real se deben reemplazar por credenciales de prueba controladas.

## 9. Recomendaciones para producción

- No usar `debug=True` ni `reload=True` en producción.
- Ejecutar Flask y FastAPI detrás de un proxy inverso como Nginx o IIS.
- Publicar únicamente el frontend y los endpoints necesarios; no exponer
  MySQL directamente a Internet.
- Restringir CORS a los dominios reales. La configuración actual del
  microservicio IA permite todos los orígenes y debe endurecerse antes de
  publicar.
- Cambiar `SECRET_KEY` por un valor aleatorio y mantener los archivos `.env`
  fuera de Git.
- Configurar HTTPS, copias de seguridad de MySQL y rotación de logs.
- Establecer límites de tamaño y tipo de archivo para las radiografías.
- Separar los directorios de cargas de usuarios, modelos y resultados, con
  permisos mínimos para el usuario que ejecuta los servicios.
- Supervisar memoria, CPU, espacio disponible y tiempo de respuesta del
  microservicio IA.

## 10. Solución rápida de problemas

| Problema | Revisión |
|---|---|
| Error de conexión a MySQL | Verifica que MySQL esté activo, que `DATABASE_URL` sea válido y que el puerto `3306` sea accesible |
| Backend no puede llamar a IA | Comprueba `IA_API_URL`, que FastAPI esté activo y que el puerto `8000` esté abierto |
| Error al cargar el modelo | Confirma que `MODEL_PATH` y `CLASIFICADOR_PATH` apunten a archivos existentes |
| Frontend muestra errores de red | Revisa que Flask esté en el puerto `5000` y que las URLs del frontend coincidan |
| `ModuleNotFoundError` | Activa `.venv` e instala el archivo de requisitos del componente correspondiente |
| Procesamiento lento | Ejecuta en un servidor con más CPU/RAM o configura una GPU NVIDIA compatible |
