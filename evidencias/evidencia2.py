import argparse
import json
import os
import sys
import matplotlib.pyplot as plt
import numpy as np

DEFAULT_JSON = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"


def main(json_path: str, out_path: str):
    if not os.path.exists(json_path):
        print(f"Error: JSON no encontrado en: {json_path}")
        sys.exit(1)

    with open(json_path, encoding='utf-8') as f:
        coco = json.load(f)

    images = coco.get('images', [])
    if not images:
        print('No se encontraron imágenes en el JSON.')
        sys.exit(1)

    widths = [img.get('width', 0) for img in images]
    heights = [img.get('height', 0) for img in images]
    # Evitar división por cero
    ratios = [w / h if h else 0 for w, h in zip(widths, heights)]

    fig, axes = plt.subplots(1, 3, figsize=(14, 4))

    axes[0].hist(widths, bins=20, color='#2980B9', edgecolor='white')
    axes[0].set_title('Distribución de Ancho (px)', fontweight='bold')
    axes[0].set_xlabel('Píxeles'); axes[0].set_ylabel('Frecuencia')

    axes[1].hist(heights, bins=20, color='#27AE60', edgecolor='white')
    axes[1].set_title('Distribución de Alto (px)', fontweight='bold')
    axes[1].set_xlabel('Píxeles')

    axes[2].hist(ratios, bins=20, color='#8E44AD', edgecolor='white')
    axes[2].set_title('Distribución de Ratio Ancho/Alto', fontweight='bold')
    axes[2].set_xlabel('Ratio')

    plt.suptitle('Análisis de resolución — DENTEX Challenge 2023', fontsize=13, fontweight='bold')
    plt.tight_layout()

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    plt.savefig(out_path, dpi=150)
    print(f'Gráfica guardada en: {out_path}')
    plt.show()

    print(f"Resolución mínima: {min(widths)}×{min(heights)}")
    print(f"Resolución máxima: {max(widths)}×{max(heights)}")
    print(f"Ratio promedio:    {np.mean([r for r in ratios if r>0]):.2f}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Analiza resoluciones de imágenes desde un COCO JSON')
    parser.add_argument('--json', '-j', default=DEFAULT_JSON, help='Ruta al archivo COCO JSON')
    parser.add_argument('--out', '-o', default='evidencias/evidencia_resolucion_imagenes.png', help='Ruta de salida para la imagen')
    args = parser.parse_args()
    main(args.json, args.out)