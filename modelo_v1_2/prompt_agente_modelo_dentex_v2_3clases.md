# PROMPT — Agente IA: Modelo YOLOv8 con DENTEX 2023 (v3 — 3 clases)
> Versión con 3 clases: Impacted Tooth eliminado del modelo.

---

## ROL Y CONTEXTO

Eres un ingeniero experto en visión computacional. Tu tarea es construir un modelo de detección de caries entrenado con el dataset **DENTEX Challenge 2023**, listo para ser servido desde FastAPI.

---

## ESTRUCTURA REAL DEL DATASET DESCARGADO

```
dataset/raw/
├── training_data/
│   ├── quadrant/                          ← NO usar (sin diagnóstico)
│   ├── quadrant_enumeration/              ← NO usar (sin diagnóstico)
│   ├── quadrant-enumeration-disease/      ← ✅ DATASET PRINCIPAL (guión, no guión bajo)
│   │   ├── xrays/                         ← 705 imágenes .png
│   │   └── train_quadrant_enumeration_disease.json   ← anotaciones COCO
│   └── unlabelled/                        ← Opcional, omitir por ahora
│       └── xrays/                         ← 1571 imágenes sin etiquetar
└── validation_data/
    └── quadrant_enumeration_disease/      ← 50 imágenes SIN ground truth
        └── xrays/
```

**USAR SOLO:** `training_data/quadrant-enumeration-disease/`
**IGNORAR:** quadrant/, quadrant_enumeration/, unlabelled/, validation_data/

---

## CLASES DEL MODELO (del JSON de DENTEX)

```
0: Caries               → severidad BD: 'incipiente'
1: Deep Caries          → severidad BD: 'avanzada'
2: Periapical Lesion    → severidad BD: 'moderada'
```

> ⚠️ **Impacted Tooth excluido** del modelo: sus anotaciones serán ignoradas durante la conversión.

---

## PASO 1 — Verificar entorno

```python
import torch
print("GPU disponible:", torch.cuda.is_available())
print("Dispositivo:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")

# Instalar dependencias si no están
# pip install ultralytics opencv-python pillow matplotlib tqdm
```

---

## PASO 2 — Explorar el JSON real del dataset

```python
import json
from collections import Counter
import matplotlib.pyplot as plt

# RUTA CORREGIDA con guión (no guión bajo)
JSON_PATH = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"

with open(JSON_PATH, encoding='utf-8') as f:
    coco = json.load(f)

print(f"Total imágenes: {len(coco['images'])}")
print(f"Total anotaciones: {len(coco['annotations'])}")
print(f"\nClaves de una anotación de ejemplo:")
print(json.dumps(coco['annotations'][0], indent=2))
print(f"\nCategorías disponibles:")
print(json.dumps(coco['categories'], indent=2))

# IMPORTANTE: inspeccionar cómo se llama el campo de diagnóstico
# Puede ser 'disease_id', 'category_id', 'diagnosis', etc.
# El print anterior te lo mostrará exactamente
```

> ⚠️ **Ejecuta este paso primero** y observa el output de `coco['annotations'][0]`.
> El campo de diagnóstico puede llamarse `category_id` o tener atributos anidados.
> Ajusta el PASO 4 según lo que veas aquí.

---

## PASO 3 — Analizar distribución de clases

```python
import json
from collections import Counter
import matplotlib.pyplot as plt

JSON_PATH = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"

with open(JSON_PATH, encoding='utf-8') as f:
    coco = json.load(f)

# Mapear category_id → nombre
cat_map = {cat['id']: cat['name'] for cat in coco['categories']}
print("Mapa de categorías:", cat_map)

# Clases a usar (Impacted Tooth excluido)
CLASES_VALIDAS = {'Caries', 'Deep Caries', 'Periapical Lesion'}

# Contar instancias por categoría (solo las 3 clases)
counts = Counter()
for ann in coco['annotations']:
    cat_id = ann.get('category_id_3')  # Ajustar a category_id_3
    if cat_id is not None:
        nombre = cat_map.get(cat_id, f"id_{cat_id}")
        if nombre in CLASES_VALIDAS:
            counts[nombre] += 1

print("\nDistribución de clases (Impacted Tooth excluido):")
for cls, n in counts.most_common():
    print(f"  {cls}: {n} instancias")

# Graficar
plt.figure(figsize=(8, 4))
labels = list(counts.keys())
values = list(counts.values())
colors = ['#E74C3C', '#C0392B', '#8E44AD']
plt.bar(labels, values, color=colors[:len(labels)])
plt.title('Distribución de clases — DENTEX Diagnóstico (3 clases)')
plt.ylabel('Instancias')
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig('dataset/class_distribution.png', dpi=150)
plt.show()
print("\n✅ Gráfico guardado en dataset/class_distribution.png")
```

---

## PASO 4 — Convertir COCO → YOLO

```python
import json
import os
import shutil
import random
from pathlib import Path
from tqdm import tqdm

# ── RUTAS CORREGIDAS ──────────────────────────────────────────
JSON_PATH   = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"
IMAGES_DIR  = "dataset/raw/training_data/quadrant-enumeration-disease/xrays"
OUTPUT_DIR  = "dataset/processed"

VAL_SPLIT   = 0.10   # 10% validación → ~70 imgs val, ~635 imgs train
SEED        = 42

# ── MAPEO: category_id_3 DENTEX → clase YOLO (0-indexed) ────────
# Solo 3 clases. Impacted Tooth (id=0) excluido del mapeo → será ignorado.
# category_id_3 del JSON: 0: Impacted, 1: Caries, 2: Periapical Lesion, 3: Deep Caries
CATEGORY_TO_YOLO = {
    1: 0,  # Caries          → clase 0
    3: 1,  # Deep Caries     → clase 1
    2: 2,  # Periapical Les. → clase 2
    # 0: Impacted Tooth → EXCLUIDO
}
# ⚠️ Si el PASO 2 muestra IDs distintos, ajusta este diccionario

def coco_to_yolo_bbox(bbox, img_w, img_h):
    """[x, y, w, h] absoluto → [xc, yc, w, h] normalizado"""
    x, y, w, h = bbox
    xc = (x + w / 2) / img_w
    yc = (y + h / 2) / img_h
    wn = w / img_w
    hn = h / img_h
    return (
        max(0.0, min(1.0, xc)),
        max(0.0, min(1.0, yc)),
        max(0.0, min(1.0, wn)),
        max(0.0, min(1.0, hn)),
    )

def convert():
    with open(JSON_PATH, encoding='utf-8') as f:
        coco = json.load(f)

    id_to_img = {img['id']: img for img in coco['images']}

    # Agrupar anotaciones válidas por imagen (Impacted Tooth se salta automáticamente)
    from collections import defaultdict
    anns_by_img = defaultdict(list)
    skipped = 0
    for ann in coco['annotations']:
        cat_id = ann.get('category_id_3')
        if cat_id not in CATEGORY_TO_YOLO:
            skipped += 1
            continue
        anns_by_img[ann['image_id']].append(ann)

    print(f"Anotaciones válidas: {sum(len(v) for v in anns_by_img.values())}")
    print(f"Anotaciones ignoradas (Impacted Tooth u otro sin mapeo): {skipped}")
    print(f"Imágenes con al menos 1 anotación válida: {len(anns_by_img)}")

    # Split train/val
    img_ids = list(anns_by_img.keys())
    random.seed(SEED)
    random.shuffle(img_ids)
    val_n = int(len(img_ids) * VAL_SPLIT)
    val_ids   = set(img_ids[:val_n])
    train_ids = set(img_ids[val_n:])
    print(f"\nSplit → Train: {len(train_ids)} | Val: {len(val_ids)}")

    # Crear carpetas de salida
    for split in ['train', 'val']:
        Path(f"{OUTPUT_DIR}/images/{split}").mkdir(parents=True, exist_ok=True)
        Path(f"{OUTPUT_DIR}/labels/{split}").mkdir(parents=True, exist_ok=True)

    # Convertir y copiar
    stats = {'train': 0, 'val': 0, 'missing': 0}
    for split_name, split_ids in [('train', train_ids), ('val', val_ids)]:
        print(f"\nProcesando {split_name}...")
        for img_id in tqdm(split_ids):
            img_info = id_to_img[img_id]
            filename = img_info['file_name']
            img_w    = img_info['width']
            img_h    = img_info['height']

            src = os.path.join(IMAGES_DIR, filename)
            if not os.path.exists(src):
                stats['missing'] += 1
                continue

            # Copiar imagen
            shutil.copy2(src, f"{OUTPUT_DIR}/images/{split_name}/{filename}")

            # Escribir labels YOLO
            stem = Path(filename).stem
            with open(f"{OUTPUT_DIR}/labels/{split_name}/{stem}.txt", 'w') as lf:
                for ann in anns_by_img[img_id]:
                    yolo_cls = CATEGORY_TO_YOLO[ann['category_id_3']]
                    xc, yc, wn, hn = coco_to_yolo_bbox(ann['bbox'], img_w, img_h)
                    lf.write(f"{yolo_cls} {xc:.6f} {yc:.6f} {wn:.6f} {hn:.6f}\n")

            stats[split_name] += 1

    print(f"\n✅ Conversión completa:")
    print(f"   Train: {stats['train']} imágenes")
    print(f"   Val:   {stats['val']} imágenes")
    print(f"   No encontradas: {stats['missing']}")

if __name__ == "__main__":
    convert()
```

---

## PASO 5 — Crear dentex.yaml

Crea el archivo `dataset/processed/dentex.yaml`:

```yaml
# DENTEX Challenge 2023 — Detección de diagnósticos dentales (3 clases)
path: dataset/processed
train: images/train
val:   images/val

nc: 3

names:
  0: Caries
  1: Deep Caries
  2: Periapical Lesion
```

---

## PASO 6 — Entrenar YOLOv8

```python
from ultralytics import YOLO

# yolov8n → CPU/GPU débil | yolov8s → recomendado tesis | yolov8m → GPU buena
model = YOLO("yolov8s.pt")

results = model.train(
    data="dataset/processed/dentex.yaml",
    epochs=100,
    imgsz=640,
    batch=8,            # Bajar a 4 si hay error de memoria
    patience=20,        # Early stopping
    device=0,           # GPU. Cambiar a 'cpu' si no hay GPU
    project="runs/train",
    name="dentex_v1_2",
    exist_ok=True,

    # Augmentation adaptada a radiografías (escala de grises, no rotar mucho)
    hsv_h=0.0,          # Sin cambio de tono
    hsv_s=0.0,          # Sin saturación
    hsv_v=0.4,          # Sí variar brillo (distintos equipos de rayos X)
    degrees=5.0,        # Rotación leve
    fliplr=0.5,         # Voltear horizontalmente (espejo de radiografía)
    flipud=0.0,         # NO voltear verticalmente
    mosaic=0.5,
    mixup=0.1,

    # Optimizador
    optimizer="AdamW",
    lr0=0.001,
    weight_decay=0.0005,
    warmup_epochs=3,

    save=True,
    save_period=10,
    plots=True,
    verbose=True,
)

print(f"\nmAP50:    {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")
print(f"mAP50-95: {results.results_dict.get('metrics/mAP50-95(B)', 'N/A')}")
```

---

## PASO 7 — Evaluar

```python
from ultralytics import YOLO

model = YOLO("runs/train/dentex_v1_2/weights/best.pt")

metrics = model.val(
    data="dataset/processed/dentex.yaml",
    split="val",
    plots=True,
)

clases = ['Caries', 'Deep Caries', 'Periapical Lesion']
print(f"\nmAP50:     {metrics.box.map50:.4f}")
print(f"mAP50-95:  {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall:    {metrics.box.mr:.4f}")
print("\nPor clase:")
for i, cls in enumerate(clases):
    print(f"  {cls}: AP50={metrics.box.ap50[i]:.4f}")
```

---

## PASO 8 — Exportar modelo listo para FastAPI

```python
import shutil
from pathlib import Path

Path("models/weights").mkdir(parents=True, exist_ok=True)

shutil.copy(
    "runs/train/dentex_v1_2/weights/best.pt",
    "models/weights/dentex_caries_v1_2.pt"
)
print("✅ Modelo guardado en models/weights/dentex_caries_v1_2.pt")
```

---

## PASO 9 — Verificar respuesta del modelo (simula detector.py)

```python
from ultralytics import YOLO
from PIL import Image
import os

CLASES = ['Caries', 'Deep Caries', 'Periapical Lesion']
SEVERIDAD_MAP = {
    0: 'incipiente',   # Caries
    1: 'avanzada',     # Deep Caries
    2: 'moderada',     # Periapical Lesion
}

model = YOLO("models/weights/dentex_caries_v1_2.pt")

# Tomar cualquier imagen de validación
val_dir = "dataset/processed/images/val"
sample_img = os.path.join(val_dir, os.listdir(val_dir)[0])

results = model(sample_img, conf=0.25, verbose=False)

# Formato de respuesta que recibirá tu backend Python
detecciones = []
for box in results[0].boxes:
    cls_id = int(box.cls)
    xyxy = box.xyxy[0].tolist()
    detecciones.append({
        "clase_id":      cls_id,
        "clase_nombre":  CLASES[cls_id],
        "confianza":     round(float(box.conf), 4),
        "severidad":     SEVERIDAD_MAP[cls_id],   # → campo severidad de tu BD
        "bbox": {
            "x":     int(xyxy[0]),
            "y":     int(xyxy[1]),
            "ancho": int(xyxy[2] - xyxy[0]),
            "alto":  int(xyxy[3] - xyxy[1]),
        }
    })

import json
print(json.dumps({
    "modelo_version":    "YOLOv8s-dentex-v1.2",   # → resultados_deteccion.modelo_version
    "caries_detectada":  any(d['clase_id'] in [0,1,2] for d in detecciones),  # → resultados_deteccion.caries_detectada
    "confianza_global":  round(sum(d['confianza'] for d in detecciones) / max(len(detecciones), 1), 4),
    "detecciones":       detecciones   # → tabla detecciones_caries (una fila por item)
}, indent=2, ensure_ascii=False))
```

---

## MAPEO FINAL: Modelo → Base de Datos

| Campo JSON API              | Tabla BD                          | Campo BD                  |
|-----------------------------|-----------------------------------|---------------------------|
| `modelo_version`            | `resultados_deteccion`            | `modelo_version`          |
| `caries_detectada`          | `resultados_deteccion`            | `caries_detectada`        |
| `confianza_global`          | `resultados_deteccion`            | `confianza_global`        |
| `tiempo_ms`                 | `resultados_deteccion`            | `tiempo_proceso_ms`       |
| `detecciones[].confianza`   | `detecciones_caries`              | `confianza`               |
| `detecciones[].severidad`   | `detecciones_caries`              | `severidad`               |
| `detecciones[].bbox.x`      | `detecciones_caries`              | `bbox_x`                  |
| `detecciones[].bbox.y`      | `detecciones_caries`              | `bbox_y`                  |
| `detecciones[].bbox.ancho`  | `detecciones_caries`              | `bbox_ancho`              |
| `detecciones[].bbox.alto`   | `detecciones_caries`              | `bbox_alto`               |
| `detecciones[].clase_nombre`| `localizacion_caries`             | `nombre` (FK lookup)      |

### SQL para poblar localizacion_caries (ejecutar UNA vez en tu BD)

```sql
INSERT INTO localizacion_caries (id_localizacion, nombre, descripcion) VALUES
(1, 'Caries',            'Lesión cariosa detectada por modelo IA — estadio inicial'),
(2, 'Deep Caries',       'Caries profunda — compromiso de dentina avanzado'),
(3, 'Periapical Lesion', 'Lesión periapical — infección en el ápice radicular');
```

---

## NOTAS FINALES

- **Clases reales**: ejecuta el PASO 2 primero para confirmar los `category_id` del JSON antes de convertir.
- **Si el JSON usa category_id 0,1,2,3** en lugar de 1,2,3,4: ajusta `CATEGORY_TO_YOLO` quitando el `-1`.
- **Si no hay GPU**: cambia `device=0` por `device='cpu'` y `batch=4`. El entrenamiento tardará más (~horas).
- **Impacted Tooth**: sus anotaciones son filtradas en el PASO 4 y no afectan el entrenamiento.
- **Citar en la tesis**: Hamamci et al. (2023). DENTEX. MICCAI 2023. https://doi.org/10.5281/zenodo.7812323
