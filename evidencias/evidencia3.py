import argparse
import json
import os
import sys
from collections import defaultdict


DEFAULT_JSON = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"


def main(json_path: str):
    if not os.path.exists(json_path):
        print(f"Error: JSON no encontrado en: {json_path}")
        sys.exit(1)

    with open(json_path, encoding='utf-8') as f:
        coco = json.load(f)

    categories = coco.get('categories', [])
    # Construir mapa id -> nombre si las categorías existen
    cat_map = {cat['id']: cat.get('name', str(cat['id'])) for cat in categories}
    EXCLUIR = {0}

    total_anns = 0
    imgs_con_ann = set()
    anns_x_cls = defaultdict(int)

    for ann in coco.get('annotations', []):
        cat_id = ann.get('category_id_3')
        if cat_id is not None and cat_id not in EXCLUIR:
            total_anns += 1
            imgs_con_ann.add(ann.get('image_id'))
            anns_x_cls[cat_id] += 1

    # Mapeo explícito si cat_map está vacío o los nombres no son los esperados
    id_to_label = {
        1: 'Caries (Incipiente)',
        3: 'Deep Caries (Profunda)',
        2: 'Periapical Lesion (Avanzada)'
    }

    print("=" * 50)
    print("  RESUMEN DE ANOTACIONES — DENTEX 2023")
    print("=" * 50)
    print(f"  Total imágenes en dataset:     {len(coco.get('images', []))}")
    print(f"  Imágenes con anotación válida: {len(imgs_con_ann)}")
    print(f"  Total anotaciones (3 clases):  {total_anns}")
    print(f"  Anotaciones por clase:")
    for cid, n in sorted(anns_x_cls.items(), key=lambda x: -x[1]):
        label = cat_map.get(cid) or id_to_label.get(cid) or str(cid)
        print(f"    {label:35s}: {n}")
    print("=" * 50)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Resumen de anotaciones desde COCO JSON')
    parser.add_argument('--json', '-j', default=DEFAULT_JSON, help='Ruta al archivo COCO JSON')
    args = parser.parse_args()
    main(args.json)