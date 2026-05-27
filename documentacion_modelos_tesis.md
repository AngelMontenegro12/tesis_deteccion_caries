# Documentación de Modelos de IA - Sistema Sonríe (Tesis)

Este documento registra las iteraciones, características y métricas de validación de los modelos YOLOv8 entrenados con el dataset DENTEX Challenge 2023.

---

## 1. Modelo v1 (Aproximación Inicial)
- **Fecha de entrenamiento**: 19 de mayo de 2026 (Mañana)
- **Arquitectura**: YOLOv8s
- **Clases (4)**: `Caries`, `Deep Caries`, `Periapical Lesion`, `Impacted Tooth`
- **Motivo de la iteración**: Primer intento de entrenamiento exploratorio en el que aún se consideraban dientes impactados entre los diagnósticos objetivo. El dataset tenía un desbalance fuerte.

### Resultados de Evaluación (Globales)
* **Precision (P)**: 25.5 % (0.255)
* **Recall (R)**: 41.4 % (0.414)
* **mAP50**: 30.4 % (0.304)
* **mAP50-95**: 17.5 % (0.175)

> *Nota*: El bajo rendimiento en precisión motivó la decisión de simplificar el modelo, excluir la clase `Impacted Tooth` (que no forma parte del alcance primario de detección de caries de la tesis) y optimizar hiperparámetros.

---

## 2. Modelo v1.2 (Modelo de Producción - 3 Clases)
- **Fecha de entrenamiento**: 19 de mayo de 2026 (Tarde)
- **Arquitectura**: YOLOv8s
- **Batch Size**: 4 (Optimizado para 4GB VRAM GPU)
- **Clases (3)**: `Caries`, `Deep Caries`, `Periapical Lesion`
- **Técnica**: Base sin alterar (solo filtrado eliminando *Impacted Tooth*).
- **Directorio Dataset YAML**: `api_ia_sonrie/dataset/dentex_v1_2.yaml`
- **Ubicación Pesos Finales**: `api_ia_sonrie/models/dentex_caries_v1_2.pt` y `backend/ia_models/modelo_caries_v1_2.pt`

### Resultados de Evaluación (Métricas de Validación)
* **Precision (P)**: 47.5 % (0.4753)
* **Recall (R)**: 43.8 % (0.4385)
* **mAP50**: 42.9 % (0.4291)
* **mAP50-95**: 30.2 % (0.3020)

### Desglose por Clase (AP50)
1. **Caries (Incipiente)**: 44.16 % (0.4416)
2. **Deep Caries (Avanzada)**: 44.89 % (0.4489)
3. **Periapical Lesion (Moderada)**: 39.67 % (0.3967)

---

## 3. Modelo v2 (Balanceo por Oversampling - 3 Clases)
- **Fecha de preparación**: 20 de mayo de 2026
- **Arquitectura**: YOLOv8s
- **Estrategia**: Se tomaron las clases minoritarias (*Deep Caries* y *Periapical Lesion*) y se les aplicó clonación y data augmentation manual (brillo/contraste, ruido, flip horizontal) hasta igualar las 1963 instancias que tenía la clase mayoritaria (*Caries*).
- **Impacto Total de Imágenes**: Subió de 596 a 2721 imágenes para entrenamiento.
- **Directorio Dataset YAML**: `api_ia_sonrie/dataset/processed_v2_oversample/dentex_v2_oversample.yaml`
- **Ubicación Pesos Finales**: `api_ia_sonrie/models/dentex_caries_v2_oversample.pt`

### Resultados de Evaluación (Métricas de Validación)
* **Precision (P)**: 50.25 % (0.5025)
* **Recall (R)**: 42.98 % (0.4298)
* **mAP50**: 43.35 % (0.4335)
* **mAP50-95**: 28.87 % (0.2887)

### Desglose por Clase (AP50)
1. **Caries**: 35.68 % (0.3568)
2. **Deep Caries**: 47.82 % (0.4782)
3. **Periapical Lesion**: 46.56 % (0.4656)

### Análisis Comparativo v1.2 Base vs v2 Oversampling
- El **mAP50 global aumentó ligeramente** (de 0.4291 a 0.4335).
- Se logró el objetivo principal del oversampling: mejorar la precisión de las clases minoritarias. **Periapical Lesion subió drásticamente de 39.67% a 46.56%** (+6.89%), y **Deep Caries mejoró de 44.89% a 47.82%** (+2.93%).
- A cambio, la clase **Caries bajó un poco su AP50 de 44.16% a 35.68%** debido a la alta cantidad de variaciones en las otras imágenes, lo que introduce "ruido" o falsos positivos en el detector para la clase principal, un compromiso que suele ser aceptable si se prima la detección de enfermedades pulpares avanzadas (Deep y Periapical).
- El **mAP50-95 bajó levemente** (de 30.2% a 28.87%), lo que indica que el cuadro delimitador (bounding box) no es tan estrictamente exacto en píxeles como antes, pero sí se acierta más la clase correcta.

---

## 4. Modelo v1.3 Mejorado (Hiperparámetros Optimizados para Radiografías)
- **Fecha de entrenamiento**: 21 de mayo de 2026
- **Arquitectura**: YOLOv8s
- **Estrategia**: Se partió del dataset original de 3 clases (sin oversampling) aplicando ajustes drásticos en los hiperparámetros con un enfoque estrictamente clínico anatómico:
  - `imgsz=800` (mayor resolución para poder ver lesiones pequeñas).
  - `mosaic=0.0` (desactivado para no destruir el contexto estructural de la mandíbula al no combinar 4 imágenes).
  - `copy_paste=0.3` (activado para copiar caries verdaderas en distintos dientes).
  - Entrenamiento largo de 150 épocas con `patience=50`.
- **Directorio Dataset YAML**: `api_ia_sonrie/dataset/dentex_v1_2.yaml`
- **Ubicación Pesos Finales**: `api_ia_sonrie/models/dentex_caries_v1_3_mejorado.pt` y `backend/ia_models/dentex_caries_v1_3_mejorado.pt`

### Resultados de Evaluación (Métricas de Validación)
* **Precision (P)**: 64.17 % (0.6417)
* **Recall (R)**: 38.08 % (0.3808)
* **mAP50**: 45.78 % (0.4578)
* **mAP50-95**: 31.10 % (0.3110)

### Desglose por Clase (AP50)
1. **Caries**: 43.22 % (0.4322)
2. **Deep Caries**: 44.08 % (0.4408)
3. **Periapical Lesion**: 50.04 % (0.5004)

### Análisis Comparativo (V1.3 Mejorado vs Iteraciones Previas)
- **Precisión Disparada**: La precisión global alcanzó **64.17%** (frente al 47.53% de V1.2 y 50.25% de V2). El modelo es muchísimo menos propenso a arrojar "falsos positivos" o confundir sombras sanas con caries.
- **Victoria en Clase Crítica (Periapical)**: Logró un AP50 de **50.04%** para la lesión periapical, superando incluso los esfuerzos de clonado/balanceo del modelo V2 (46.56%).
- **Rendimiento General Top**: Se posiciona con el mejor `mAP50` (45.78%) y el mejor delineado de cuadros `mAP50-95` (31.10%) de toda la serie documentada.
- **Nivel de Recall**: El trade-off de volverse un modelo tan "seguro" y preciso es que el *recall* bajó por debajo del 40% (38.08%); ignorará regiones levemente dudosas en lugar de arriesgarse a pintarlas.

---

