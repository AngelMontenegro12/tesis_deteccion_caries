import json
from collections import Counter
import matplotlib.pyplot as plt
import os

JSON_PATH = "api_ia_sonrie/dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"

with open(JSON_PATH, encoding='utf-8') as f:
    coco = json.load(f)

# Mapear category_id_3 -> nombre
cat_map = {cat['id']: cat['name'] for cat in coco['categories_3']}
print("Mapa de categorías:", cat_map)

# Contar instancias por categoría
counts = Counter()
for ann in coco['annotations']:
    cat_id = ann.get('category_id_3')
    if cat_id is not None:
        counts[cat_map.get(cat_id, f"id_{cat_id}")] += 1

print("\nDistribución de clases:")
for cls, n in counts.most_common():
    print(f"  {cls}: {n} instancias")

# Graficar
plt.figure(figsize=(8, 4))
labels = list(counts.keys())
values = list(counts.values())
colors = ['#E74C3C', '#C0392B', '#8E44AD', '#2980B9']
plt.bar(labels, values, color=colors[:len(labels)])
plt.title('Distribución de clases - DENTEX Diagnóstico')
plt.ylabel('Instancias')
plt.xticks(rotation=15)
plt.tight_layout()
os.makedirs('api_ia_sonrie/dataset', exist_ok=True)
plt.savefig('api_ia_sonrie/dataset/class_distribution.png', dpi=150)
print("\nGráfico guardado en api_ia_sonrie/dataset/class_distribution.png")
