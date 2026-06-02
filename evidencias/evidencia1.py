import argparse
import json
import os
import sys
import matplotlib.pyplot as plt
from collections import Counter

DEFAULT_JSON = "dataset/raw/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"

def main(json_path: str):
    if not os.path.exists(json_path):
        print(f"Error: JSON no encontrado en: {json_path}")
        print("Busca el archivo JSON en tu disco o copia el archivo al proyecto.")
        sys.exit(1)

    with open(json_path, encoding='utf-8') as f:
        coco = json.load(f)

    cat_map = {cat['id']: cat['name'] for cat in coco.get('categories', [])}
    EXCLUIR = {0}  # Impacted Tooth

    # Contar usando los IDs de categoría para luego mapearlos a nombres claros
    counts = Counter()
    for ann in coco.get('annotations', []):
        cat_id = ann.get('category_id_3')
        if cat_id is not None and cat_id not in EXCLUIR:
            counts[cat_id] += 1

    if not counts:
        print('No se encontraron anotaciones válidas en el JSON.')
        sys.exit(1)

    # Ordenar por frecuencia (mayor a menor) para que las barras sigan ese orden
    ids_ordenados = [cid for cid, _ in counts.most_common()]

    # Mapeo explícito desde ID de categoría -> etiqueta a mostrar
    id_to_label = {
        1: 'Caries\n(Incipiente)',
        3: 'Deep Caries\n(Profunda)',
        2: 'Periapical Lesion\n(Avanzada)'
    }
    etiquetas = [id_to_label.get(cid, str(cid)) for cid in ids_ordenados]
    valores   = [counts[cid] for cid in ids_ordenados]

    # Colores por ID (fallback a una paleta si hay más clases)
    id_to_color = {1: '#E74C3C', 3: '#C0392B', 2: '#8E44AD'}
    colores = [id_to_color.get(cid, '#777777') for cid in ids_ordenados]

    plt.figure(figsize=(8, 5))
    positions = list(range(len(etiquetas)))
    bars = plt.bar(positions, valores, color=colores, edgecolor='white', linewidth=0.8)
    for bar, val in zip(bars, valores):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 15,
                 str(val), ha='center', va='bottom', fontweight='bold', fontsize=11)
    plt.xticks(positions, etiquetas, fontsize=10)
    plt.title('Distribución de clases — DENTEX Challenge 2023\n(3 clases activas)', fontsize=13, fontweight='bold')
    plt.ylabel('Número de instancias', fontsize=11)
    plt.ylim(0, max(valores) * 1.15)
    plt.tight_layout()
    out_file = 'evidencia_distribucion_clases.png'
    plt.savefig(out_file, dpi=150)
    print(f'Gráfica guardada en: {out_file}')
    plt.show()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Genera la distribución de clases desde un COCO JSON')
    parser.add_argument('--json', '-j', default=DEFAULT_JSON, help='Ruta al archivo COCO JSON')
    args = parser.parse_args()
    main(args.json)