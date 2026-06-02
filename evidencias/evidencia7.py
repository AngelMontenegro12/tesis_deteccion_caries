import argparse
import os
import sys
from pathlib import Path
from collections import Counter
import matplotlib.pyplot as plt
import numpy as np

DEFAULT_TRAIN = "api_ia_sonrie/dataset/processed/labels/train"
DEFAULT_VAL = "api_ia_sonrie/dataset/processed/labels/val"
DEFAULT_OUT = "evidencias/evidencia_split_train_val.png"

CLASES = {0: 'Caries\n(Incipiente)', 1: 'Deep Caries\n(Profunda)', 2: 'Periapical\n(Avanzada)'}

def contar_instancias(labels_dir):
    counts = Counter()
    labels_path = Path(labels_dir)
    if not labels_path.exists():
        return None

    for lf in labels_path.glob("*.txt"):
        with open(lf) as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    counts[int(parts[0])] += 1
    return counts


def main(train_dir: str, val_dir: str, out_path: str):
    train_counts = contar_instancias(train_dir)
    val_counts = contar_instancias(val_dir)

    if train_counts is None:
        print(f"Error: no existe el directorio de entrenamiento: {train_dir}")
        sys.exit(1)
    if val_counts is None:
        print(f"Error: no existe el directorio de validación: {val_dir}")
        sys.exit(1)

    n_train_imgs = len(list(Path(train_dir).glob("*.txt")))
    n_val_imgs = len(list(Path(val_dir).glob("*.txt")))

    print(f"Imágenes train: {n_train_imgs} | val: {n_val_imgs}")

    x = np.arange(len(CLASES))
    width = 0.35
    fig, ax = plt.subplots(figsize=(9, 5))

    bars1 = ax.bar(x - width / 2, [train_counts[i] for i in CLASES], width,
                   label=f'Entrenamiento ({n_train_imgs} imgs)', color='#2980B9', edgecolor='white')
    bars2 = ax.bar(x + width / 2, [val_counts[i] for i in CLASES], width,
                   label=f'Validación ({n_val_imgs} imgs)', color='#E67E22', edgecolor='white')

    for bar in list(bars1) + list(bars2):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 5,
                str(int(bar.get_height())), ha='center', va='bottom', fontsize=9, fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(list(CLASES.values()), fontsize=10)
    ax.set_ylabel('Número de instancias')
    ax.set_title('División Train/Val por clase — DENTEX Challenge 2023', fontsize=13, fontweight='bold')
    ax.legend()
    plt.tight_layout()

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    plt.savefig(out_path, dpi=150)
    print(f'Gráfica guardada en: {out_path}')
    plt.show()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Grafica la división Train/Val por clase desde etiquetas YOLO')
    parser.add_argument('--train', default=DEFAULT_TRAIN, help='Directorio de etiquetas de entrenamiento')
    parser.add_argument('--val', default=DEFAULT_VAL, help='Directorio de etiquetas de validación')
    parser.add_argument('--out', default=DEFAULT_OUT, help='Ruta de salida para la figura')
    args = parser.parse_args()
    main(args.train, args.val, args.out)