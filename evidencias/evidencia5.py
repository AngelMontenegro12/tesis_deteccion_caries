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
	img_gauss = cv2.GaussianBlur(img_gray, (3, 3), 0)

	fig, axes = plt.subplots(1, 2, figsize=(14, 5))
	axes[0].imshow(img_gray, cmap='gray')
	axes[0].set_title('Original', fontsize=13, fontweight='bold')
	axes[0].axis('off')

	axes[1].imshow(img_gauss, cmap='gray')
	axes[1].set_title('Filtro Gaussiano 3×3 (reducción de ruido)', fontsize=13, fontweight='bold')
	axes[1].axis('off')

	plt.suptitle('Preprocesamiento — Eliminación de Ruido', fontsize=14, fontweight='bold')
	plt.tight_layout()

	os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
	plt.savefig(out_path, dpi=150, bbox_inches='tight')
	print(f'Gráfica guardada en: {out_path}')
	plt.show()


if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Aplica filtro gaussiano a una radiografía y compara antes/después')
	parser.add_argument('--img', '-i', default=DEFAULT_IMG, help='Ruta de la imagen de entrada')
	parser.add_argument('--out', '-o', default='evidencias/evidencia_filtro_gaussiano.png', help='Ruta de salida para la figura')
	args = parser.parse_args()
	main(args.img, args.out)