"""
PASO 1 — Preparar dataset V2: Oversample (3 clases)
=====================================================
Clases activas:
  0: Caries
  1: Deep Caries
  2: Periapical Lesion
  (Impacted Tooth eliminada)

Estrategia:
  - Filtrar todas las anotaciones de Impacted Tooth (clase 3)
  - Igualar Caries, Deep Caries y Periapical Lesion
    a la clase que tenga MÁS instancias entre las 3
  - Augmentation leve en imágenes duplicadas (brillo, flip horizontal)

Ejecutar desde la raíz de api_ia_sonrie/
"""

import os
import shutil
import random
from pathlib import Path
from collections import defaultdict
import cv2
import numpy as np
from tqdm import tqdm

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
SRC_IMAGES     = "api_ia_sonrie/dataset/processed_v1_2/images/train"
SRC_LABELS     = "api_ia_sonrie/dataset/processed_v1_2/labels/train"
SRC_VAL_IMAGES = "api_ia_sonrie/dataset/processed_v1_2/images/val"
SRC_VAL_LABELS = "api_ia_sonrie/dataset/processed_v1_2/labels/val"
DST_BASE       = "api_ia_sonrie/dataset/processed_v2_oversample"
SEED           = 42

# Solo estas 3 clases — Impacted Tooth (3) excluida
ACTIVE_CLASSES = {
    0: "Caries",
    1: "Deep Caries",
    2: "Periapical Lesion",
}
EXCLUDED_CLASS = 3  # Impacted Tooth

random.seed(SEED)
np.random.seed(SEED)


# ── HELPERS ───────────────────────────────────────────────────────────────────

def read_label_lines(label_path):
    """Lee un .txt YOLO y retorna solo las líneas de clases activas."""
    lines = []
    with open(label_path) as f:
        for line in f:
            parts = line.strip().split()
            if parts and int(parts[0]) in ACTIVE_CLASSES:
                lines.append(line.strip())
    return lines


def count_instances(labels_dir):
    """Cuenta instancias y agrupa imágenes por clase activa."""
    counts    = defaultdict(int)
    img_by_cls = defaultdict(list)
    for lf in Path(labels_dir).glob("*.txt"):
        lines = read_label_lines(lf)
        if not lines:           # imagen sin ninguna clase activa → ignorar
            continue
        for line in lines:
            cls = int(line.split()[0])
            counts[cls] += 1
        classes_in_img = {int(l.split()[0]) for l in lines}
        for cls in classes_in_img:
            img_by_cls[cls].append(lf.stem)
    return counts, img_by_cls


def write_filtered_label(lines, dst_path):
    """Escribe las líneas filtradas (sin clase excluida) en dst_path."""
    with open(dst_path, "w") as f:
        for line in lines:
            f.write(line + "\n")


def find_image(stem, images_dir):
    """Busca la imagen con cualquier extensión común."""
    for ext in [".png", ".jpg", ".jpeg"]:
        p = Path(images_dir) / (stem + ext)
        if p.exists():
            return p
    return None


def augment_image(img, do_flip):
    """Augmentation leve: brillo, contraste, ruido y flip opcional."""
    alpha = random.uniform(0.85, 1.15)
    beta  = random.randint(-15, 15)
    img   = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
    if do_flip:
        img = cv2.flip(img, 1)
    if random.random() > 0.5:
        noise = np.random.normal(0, 3, img.shape).astype(np.int16)
        img   = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img


def flip_label_lines(lines):
    """Invierte x_center para flip horizontal."""
    flipped = []
    for line in lines:
        parts = line.split()
        cls, xc, yc, w, h = parts
        xc_f = round(1.0 - float(xc), 6)
        flipped.append(f"{cls} {xc_f} {yc} {w} {h}")
    return flipped


# ── MAIN ──────────────────────────────────────────────────────────────────────

def prepare():
    print("=" * 60)
    print("  V2 OVERSAMPLE — 3 clases (sin Impacted Tooth)")
    print("=" * 60)

    # Crear carpetas destino
    for split in ["train", "val"]:
        Path(f"{DST_BASE}/images/{split}").mkdir(parents=True, exist_ok=True)
        Path(f"{DST_BASE}/labels/{split}").mkdir(parents=True, exist_ok=True)

    # ── 1. Analizar distribución original ─────────────────────────────────────
    print("\n[1/4] Analizando distribución original (3 clases)...")
    counts, img_by_cls = count_instances(SRC_LABELS)

    print("\n  Distribución original (train):")
    for cls_id, name in ACTIVE_CLASSES.items():
        n_inst = counts.get(cls_id, 0)
        n_imgs = len(img_by_cls.get(cls_id, []))
        print(f"    Clase {cls_id} — {name:20s}: {n_inst:4d} instancias | {n_imgs:3d} imágenes")

    target = max(counts[c] for c in ACTIVE_CLASSES)
    target_cls = max(ACTIVE_CLASSES, key=lambda c: counts[c])
    print(f"\n  Objetivo oversample: {target} instancias ({ACTIVE_CLASSES[target_cls]})")

    # ── 2. Copiar imágenes originales (filtrando clase excluida) ──────────────
    print("\n[2/4] Copiando imágenes originales (filtrando Impacted Tooth)...")
    copied = 0
    skipped = 0
    for lf in tqdm(list(Path(SRC_LABELS).glob("*.txt"))):
        filtered = read_label_lines(lf)
        if not filtered:
            skipped += 1
            continue   # imagen que solo tenía Impacted Tooth → descartar

        img_src = find_image(lf.stem, SRC_IMAGES)
        if img_src is None:
            print(f"  ⚠ Imagen no encontrada: {lf.stem}")
            continue

        shutil.copy2(img_src, f"{DST_BASE}/images/train/{img_src.name}")
        write_filtered_label(filtered, f"{DST_BASE}/labels/train/{lf.stem}.txt")
        copied += 1

    print(f"  ✓ {copied} imágenes copiadas | {skipped} descartadas (solo Impacted Tooth)")

    # ── 3. Oversample clases pequeñas ─────────────────────────────────────────
    print("\n[3/4] Generando imágenes aumentadas para clases pequeñas...")

    for cls_id, name in ACTIVE_CLASSES.items():
        current = counts.get(cls_id, 0)
        if current == 0:
            print(f"  ⚠ {name}: sin instancias, saltando")
            continue
        if current >= target:
            print(f"  — {name}: clase dominante, sin cambios")
            continue

        needed     = target - current
        imgs       = img_by_cls.get(cls_id, [])
        pool       = (imgs * (needed // max(len(imgs), 1) + 2))
        random.shuffle(pool)

        generated_inst = 0
        aug_idx        = 0
        print(f"  → {name}: {current} → ~{target} (necesita +{needed} instancias)")

        for stem in pool:
            if generated_inst >= needed:
                break

            lf_src  = Path(SRC_LABELS) / (stem + ".txt")
            img_src = find_image(stem, SRC_IMAGES)
            if img_src is None or not lf_src.exists():
                continue

            filtered_lines = read_label_lines(lf_src)
            if not filtered_lines:
                continue

            aug_idx += 1
            new_stem  = f"{stem}_ov{cls_id}_{aug_idx:04d}"
            do_flip   = random.random() > 0.5

            # Augmentar imagen
            img = cv2.imread(str(img_src))
            if img is None:
                continue
            img_aug = augment_image(img, do_flip)
            cv2.imwrite(f"{DST_BASE}/images/train/{new_stem}{img_src.suffix}", img_aug)

            # Ajustar labels
            out_lines = flip_label_lines(filtered_lines) if do_flip else filtered_lines
            write_filtered_label(out_lines, f"{DST_BASE}/labels/train/{new_stem}.txt")

            # Contar instancias de esta clase añadidas
            inst_added = sum(1 for l in filtered_lines if int(l.split()[0]) == cls_id)
            generated_inst += inst_added

        print(f"     ✓ {aug_idx} imágenes generadas para {name}")

    # ── 4. Copiar validación filtrada ─────────────────────────────────────────
    print("\n[4/4] Copiando validación (filtrando Impacted Tooth)...")
    val_copied  = 0
    val_skipped = 0
    for lf in Path(SRC_VAL_LABELS).glob("*.txt"):
        filtered = read_label_lines(lf)
        if not filtered:
            val_skipped += 1
            continue
        img_src = find_image(lf.stem, SRC_VAL_IMAGES)
        if img_src is None:
            continue
        shutil.copy2(img_src, f"{DST_BASE}/images/val/{img_src.name}")
        write_filtered_label(filtered, f"{DST_BASE}/labels/val/{lf.stem}.txt")
        val_copied += 1

    print(f"  ✓ {val_copied} imágenes de val copiadas | {val_skipped} descartadas")

    # ── Resultado final ────────────────────────────────────────────────────────
    final_counts, _ = count_instances(f"{DST_BASE}/labels/train")
    total_imgs = len(list(Path(f"{DST_BASE}/images/train").glob("*")))

    print("\n" + "=" * 60)
    print("  RESULTADO FINAL")
    print("=" * 60)
    print(f"\n  Total imágenes train: {total_imgs}")
    print("\n  Distribución final (train):")
    for cls_id, name in ACTIVE_CLASSES.items():
        orig  = counts.get(cls_id, 0)
        final = final_counts.get(cls_id, 0)
        print(f"    {name:20s}: {orig:4d} → {final:4d} (+{final - orig})")

    # ── Crear YAML ────────────────────────────────────────────────────────────
    yaml_path = f"{DST_BASE}/dentex_v2_oversample.yaml"
    with open(yaml_path, "w") as f:
        f.write(f"""# DENTEX V2 — Oversample (3 clases, sin Impacted Tooth)
path: {os.path.abspath(DST_BASE).replace(os.sep, '/')}
train: images/train
val:   images/val

nc: 3

names:
  0: Caries
  1: Deep Caries
  2: Periapical Lesion
""")

    print(f"\n✅ Dataset listo en:  {DST_BASE}/")
    print(f"✅ YAML generado en:  {yaml_path}")
    print("\n▶  Siguiente paso: python v2_train_oversample.py")


if __name__ == "__main__":
    prepare()
