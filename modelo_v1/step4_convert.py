import json
import os
import shutil
import random
from pathlib import Path
from tqdm import tqdm

JSON_PATH   = "api_ia_sonrie/dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"
IMAGES_DIR  = "api_ia_sonrie/dataset/raw/training_data/quadrant-enumeration-disease/xrays"
OUTPUT_DIR  = "api_ia_sonrie/dataset/processed"

VAL_SPLIT   = 0.10
SEED        = 42

# Según 'categories_3':
# 0: Impacted, 1: Caries, 2: Periapical Lesion, 3: Deep Caries
# Mapeo a YOLO (0: Caries, 1: Deep Caries, 2: Periapical Lesion, 3: Impacted Tooth)
CATEGORY_TO_YOLO = {
    1: 0, # Caries
    3: 1, # Deep Caries
    2: 2, # Periapical Lesion
    0: 3  # Impacted Tooth
}

def coco_to_yolo_bbox(bbox, img_w, img_h):
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

    from collections import defaultdict
    anns_by_img = defaultdict(list)
    skipped = 0
    for ann in coco['annotations']:
        cat_id = ann.get('category_id_3')
        if cat_id not in CATEGORY_TO_YOLO:
            skipped += 1
            continue
        anns_by_img[ann['image_id']].append(ann)

    print(f"Anotaciones validas: {sum(len(v) for v in anns_by_img.values())}")
    print(f"Anotaciones ignoradas: {skipped}")
    print(f"Imagenes con al menos 1 anotacion: {len(anns_by_img)}")

    img_ids = list(anns_by_img.keys())
    random.seed(SEED)
    random.shuffle(img_ids)
    val_n = int(len(img_ids) * VAL_SPLIT)
    val_ids   = set(img_ids[:val_n])
    train_ids = set(img_ids[val_n:])
    print(f"\nSplit -> Train: {len(train_ids)} | Val: {len(val_ids)}")

    for split in ['train', 'val']:
        Path(f"{OUTPUT_DIR}/images/{split}").mkdir(parents=True, exist_ok=True)
        Path(f"{OUTPUT_DIR}/labels/{split}").mkdir(parents=True, exist_ok=True)

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

            shutil.copy2(src, f"{OUTPUT_DIR}/images/{split_name}/{filename}")

            stem = Path(filename).stem
            with open(f"{OUTPUT_DIR}/labels/{split_name}/{stem}.txt", 'w') as lf:
                for ann in anns_by_img[img_id]:
                    yolo_cls = CATEGORY_TO_YOLO[ann['category_id_3']]
                    xc, yc, wn, hn = coco_to_yolo_bbox(ann['bbox'], img_w, img_h)
                    lf.write(f"{yolo_cls} {xc:.6f} {yc:.6f} {wn:.6f} {hn:.6f}\n")

            stats[split_name] += 1

    print(f"\nConversion completa:")
    print(f"   Train: {stats['train']} imagenes")
    print(f"   Val:   {stats['val']} imagenes")
    print(f"   No encontradas: {stats['missing']}")

if __name__ == "__main__":
    convert()
