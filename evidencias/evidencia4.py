import argparse
import os
import sys

import cv2
import matplotlib.pyplot as plt


DEFAULT_IMG = "api_ia_sonrie/dataset/raw/training_data/quadrant-enumeration-disease/xrays/train_1.png"


def main(img_path: str, out_path: str):
	if not os.path.exists(img_path):
		print(f"Error: imagen no encontrada en: {img_path}")
		sys.exit(1)

	img_color = cv2.imread(img_path)
	if img_color is None:
		print(f"Error: OpenCV no pudo leer la imagen: {img_path}")
		sys.exit(1)

	img_gray = cv2.cvtColor(img_color, cv2.COLOR_BGR2GRAY)

	# Aplicar CLAHE para mejorar contraste local
	clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
	img_clahe = clahe.apply(img_gray)

	fig, axes = plt.subplots(1, 2, figsize=(14, 5))
	axes[0].imshow(img_gray, cmap='gray')
	axes[0].set_title('Original', fontsize=13, fontweight='bold')
	axes[0].axis('off')

	axes[1].imshow(img_clahe, cmap='gray')
	axes[1].set_title('Con CLAHE (ajuste de contraste)', fontsize=13, fontweight='bold')
	axes[1].axis('off')

	plt.suptitle('Preprocesamiento — Ajuste de Contraste CLAHE', fontsize=14, fontweight='bold')
	plt.tight_layout()

	os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
	plt.savefig(out_path, dpi=150, bbox_inches='tight')
	print(f'Gráfica guardada en: {out_path}')
	plt.show()


if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Aplica CLAHE a una radiografía y compara antes/después')
	parser.add_argument('--img', '-i', default=DEFAULT_IMG, help='Ruta de la imagen de entrada')
	parser.add_argument('--out', '-o', default='evidencias/evidencia_clahe.png', help='Ruta de salida para la figura')
	args = parser.parse_args()
	main(args.img, args.out)