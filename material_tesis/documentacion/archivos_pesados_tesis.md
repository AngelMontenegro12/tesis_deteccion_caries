# Reporte de Archivos Pesados y Datasets (Tesis Detección de Caries)

Este documento detalla las carpetas que contienen imágenes, datasets y archivos de gran tamaño tanto dentro del proyecto principal (`sistema_sonrie_tesis`) como en su directorio padre. El objetivo es identificar qué se puede eliminar o respaldar en un disco externo para liberar espacio, ya que el tamaño total roza los 57 GB.

---

## 1. Dentro del proyecto (`sistema_sonrie_tesis`)
**Tamaño aproximado total:** 57.4 GB

La mayor parte del almacenamiento de este proyecto está concentrada en la API de Inteligencia Artificial (`api_ia_sonrie`) y los resultados de entrenamiento de YOLO (`runs`).

### 🗂️ Carpetas de Datasets (dentro de `api_ia_sonrie/dataset`)
**Tamaño Total de esta sección:** ~42.95 GB
Aquí están las distintas versiones de los datasets para el modelo de detección.

* **`raw` (13.71 GB)**
  * **Contenido:** 3603 imágenes (`.png`), archivos `.json`.
  * **Detalle:** Son las imágenes originales sin ningún tipo de preprocesamiento.
* **`processed_v1_9_clahe_global` (13.27 GB)**
  * **Contenido:** 2403 imágenes (`.png`), 2403 etiquetas YOLO (`.txt`).
  * **Detalle:** Dataset procesado aplicando el filtro CLAHE (Contrast Limited Adaptive Histogram Equalization) global.
* **`processed_v1_6_full_aug` (10.72 GB)**
  * **Contenido:** 2403 imágenes (`.png`), 2403 etiquetas YOLO (`.txt`).
  * **Detalle:** Dataset con técnicas de *Data Augmentation* aplicadas (rotaciones, cambios de brillo, etc.).
* **`processed_v1_2_LIMPIO` (5.24 GB)**
  * **Contenido:** 1232 imágenes (`.png`), 530 imágenes (`.jpg`), 1762 etiquetas YOLO (`.txt`).
  * **Detalle:** Versión más antigua del dataset limpio, combinando PNGs y JPGs.

### 🧠 Resultados de Entrenamiento YOLO (`runs/`)
**Tamaño Total de esta sección:** ~5.85 GB
Cada vez que se entrena o prueba el modelo YOLO, se generan archivos aquí.

* **`train` (4.02 GB)**
  * **Contenido:** Pesos de los modelos (`.pt`), gráficas de entrenamiento y matrices de confusión (`.png`, `.jpg`).
  * **Detalle:** Contiene los pesos (`best.pt`, `last.pt`) de múltiples corridas de entrenamiento. Muchas corridas antiguas pueden ser eliminadas.
* **`detect` (1.81 GB)**
  * **Contenido:** Imágenes inferidas (`.jpg`, `.png`).
  * **Detalle:** Resultados visuales de pasar el modelo por imágenes de prueba.
* **`val` (0.02 GB)**
  * **Contenido:** Archivos ligeros de validación (`.jpg`, `.json`).

### 📦 Otros Datasets en el Proyecto
* **`dataset_clasificador` (2.34 GB)**
  * **Contenido:** 750 imágenes (`.png`), 676 imágenes (`.jpg`), 36 (`.jpeg`).
  * **Detalle:** Parece ser un dataset utilizado para entrenar un modelo clasificador previo o paralelo (tal vez para clasificar tipo de radiografía).

### ⚙️ Otras carpetas pesadas (Código y Entornos)
* **`.venv` (5.11 GB)**
  * **Contenido:** Librerías de Python instaladas (PyTorch, Ultralytics, etc.).
  * **Nota:** No son imágenes, pero pesa mucho. Si necesitas espacio urgente, esta carpeta se puede borrar y regenerar luego ejecutando `pip install -r requirements.txt`.
* **`backend` (0.68 GB)** y **`frontend` (0.13 GB)**
  * **Contenido:** Código fuente, scripts (`.js`, `.py`), mapas de código (`.map`). No requieren limpieza profunda, son carpetas ligeras.

---

## 2. En la ruta padre (`D:\LPT ANGEL\USAT\2026-1\tesis_caries`)

Estas carpetas se encuentran un nivel arriba del proyecto y también contienen datasets y modelos.

* **`processed_v1_2_LIMPIO` (2.53 GB)**
  * **Contenido:** 662 imágenes (`.png`), 662 etiquetas YOLO (`.txt`), 1 archivo `.yaml`.
  * **Detalle:** Parece ser un respaldo o una versión reducida del dataset limpio v1.2. *Considerar si es un duplicado de la carpeta que está dentro de `api_ia_sonrie/dataset`.*
* **`modelos` (0.002 GB / 1.78 MB)**
  * **Contenido:** Scripts de python, archivos markdown, imágenes ligeras. No impacta en el almacenamiento.

---

## 💡 Recomendaciones para liberar espacio rápidamente:

1. **Eliminar Datasets Antiguos:** Si el modelo final ya está entrenado con `v1_9_clahe_global` o `v1_6_full_aug`, podrías mover `processed_v1_2_LIMPIO` (tanto el de 5.2 GB como el de 2.5 GB) y `raw` (13.7 GB) a un disco duro externo o Google Drive/OneDrive.
2. **Limpiar corridas de YOLO (`runs/train`):** Conserva solo la carpeta del entrenamiento final o el que dio mejores métricas. Los entrenamientos fallidos o experimentales guardan pesos (`.pt`) de varios cientos de MB cada uno.
3. **Mover `.venv`:** Si no vas a programar o correr el proyecto en unos días, puedes borrar la carpeta `.venv` (libera 5 GB al instante). Luego la vuelves a crear cuando retomes el proyecto.
