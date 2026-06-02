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
	img_norm = img_gray.astype('float32') / 255.0

	fig, axes = plt.subplots(1, 2, figsize=(12, 4))
	axes[0].hist(img_gray.flatten(), bins=50, color='#2980B9', edgecolor='white')
	axes[0].set_title('Histograma original (0–255)', fontweight='bold')
	axes[0].set_xlabel('Intensidad')
	axes[0].set_ylabel('Frecuencia')

	axes[1].hist(img_norm.flatten(), bins=50, color='#27AE60', edgecolor='white')
	axes[1].set_title('Histograma normalizado (0–1)', fontweight='bold')
	axes[1].set_xlabel('Intensidad normalizada')

	plt.suptitle('Preprocesamiento — Normalización de Intensidades', fontsize=13, fontweight='bold')
	plt.tight_layout()

	os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
	plt.savefig(out_path, dpi=150)
	print(f'Gráfica guardada en: {out_path}')
	plt.show()


if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Muestra histogramas antes y después de normalizar intensidades')
	parser.add_argument('--img', '-i', default=DEFAULT_IMG, help='Ruta de la imagen de entrada')
	parser.add_argument('--out', '-o', default='evidencias/evidencia_normalizacion.png', help='Ruta de salida para la figura')
	args = parser.parse_args()
	main(args.img, args.out)