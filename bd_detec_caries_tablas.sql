-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.0.39 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para bd_detec_caries
CREATE DATABASE IF NOT EXISTS `bd_detec_caries` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bd_detec_caries`;

-- Volcando estructura para tabla bd_detec_caries.detecciones_caries
CREATE TABLE IF NOT EXISTS `detecciones_caries` (
  `id_deteccion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_resultado` int unsigned NOT NULL,
  `id_localizacion` tinyint unsigned NOT NULL,
  `numero_diente` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Notación FDI del diente afectado, ej: 36, 47',
  `confianza` decimal(5,4) NOT NULL COMMENT 'Score de confianza de esta detección específica',
  `bbox_x` int DEFAULT NULL COMMENT 'Coordenada X del bounding box en la imagen',
  `bbox_y` int DEFAULT NULL COMMENT 'Coordenada Y del bounding box en la imagen',
  `bbox_ancho` int DEFAULT NULL COMMENT 'Ancho del bounding box en píxeles',
  `bbox_alto` int DEFAULT NULL COMMENT 'Alto del bounding box en píxeles',
  `severidad` enum('incipiente','moderada','avanzada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Severidad estimada de la lesión',
  `class_probabilities` json DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_deteccion`),
  KEY `id_resultado` (`id_resultado`),
  KEY `id_localizacion` (`id_localizacion`),
  CONSTRAINT `detecciones_caries_ibfk_1` FOREIGN KEY (`id_resultado`) REFERENCES `resultados_deteccion` (`id_resultado`) ON DELETE CASCADE,
  CONSTRAINT `detecciones_caries_ibfk_2` FOREIGN KEY (`id_localizacion`) REFERENCES `localizacion_caries` (`id_localizacion`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=389 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cada lesión de caries detectada por el modelo con su localización y coordenadas';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.diagnosticos_odontologo
CREATE TABLE IF NOT EXISTS `diagnosticos_odontologo` (
  `id_diagnostico` int unsigned NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int unsigned NOT NULL,
  `id_odontologo` int unsigned NOT NULL,
  `diagnostico_texto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Diagnóstico clínico redactado por el odontólogo',
  `plan_tratamiento` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `confirma_ia` tinyint(1) DEFAULT NULL COMMENT '1=confirma resultado IA, 0=difiere, NULL=no evaluado',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_diagnostico` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_diagnostico`),
  KEY `id_evaluacion` (`id_evaluacion`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `diagnosticos_odontologo_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones_diagnosticas` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `diagnosticos_odontologo_ibfk_2` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Diagnóstico clínico final emitido por el odontólogo tras revisar los resultados del modelo';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.evaluaciones_diagnosticas
CREATE TABLE IF NOT EXISTS `evaluaciones_diagnosticas` (
  `id_evaluacion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_paciente` int unsigned NOT NULL,
  `id_odontologo` int unsigned NOT NULL,
  `fecha_evaluacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_visita` enum('Primera vez','Control rutina','Urgencia','Seguimiento') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Control rutina',
  `motivo_consulta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Notas clínicas del odontólogo para esta evaluación',
  `estado` enum('pendiente','en_proceso','completada','anulada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion`),
  KEY `id_paciente` (`id_paciente`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `evaluaciones_diagnosticas_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id_paciente`) ON DELETE RESTRICT,
  CONSTRAINT `evaluaciones_diagnosticas_ibfk_2` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones de diagnóstico asociadas a un paciente y odontólogo';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.historial_accesos
CREATE TABLE IF NOT EXISTS `historial_accesos` (
  `id_acceso` int unsigned NOT NULL AUTO_INCREMENT,
  `id_odontologo` int unsigned NOT NULL,
  `tipo_evento` enum('login','logout','login_fallido','recuperacion_pass') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_acceso` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_acceso`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `historial_accesos_ibfk_1` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de auditoría de accesos y eventos de seguridad';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.localizacion_caries
CREATE TABLE IF NOT EXISTS `localizacion_caries` (
  `id_localizacion` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Corona, Raíz, Interdental, Fisura',
  `descripcion` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_localizacion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de tipos/localizaciones de caries detectables';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.odontologos
CREATE TABLE IF NOT EXISTS `odontologos` (
  `id_odontologo` int unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `colegiatura` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número de colegiatura del odontólogo',
  `especialidad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ruta o URL de la foto de perfil',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=activo, 0=inactivo',
  `token_recuperacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Token para restablecer contraseña',
  `token_expiracion` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_odontologo`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Odontólogos registrados y autorizados para usar el sistema';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.pacientes
CREATE TABLE IF NOT EXISTS `pacientes` (
  `id_paciente` int unsigned NOT NULL AUTO_INCREMENT,
  `id_odontologo` int unsigned NOT NULL COMMENT 'Odontólogo que registró al paciente',
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `edad` tinyint unsigned NOT NULL COMMENT 'Edad calculada al momento del registro',
  `genero` enum('M','F','Otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dni` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apoderado` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del apoderado (si es menor de edad)',
  `telefono_apoderado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones_generales` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Antecedentes o notas clínicas generales',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_paciente`),
  UNIQUE KEY `dni` (`dni`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pacientes adolescentes registrados en el sistema (12-20 años)';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.radiografias
CREATE TABLE IF NOT EXISTS `radiografias` (
  `id_radiografia` int unsigned NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int unsigned NOT NULL,
  `id_tipo` tinyint unsigned NOT NULL,
  `nombre_archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre original del archivo',
  `ruta_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta o URL de almacenamiento en la nube',
  `formato` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: JPG, PNG, DICOM',
  `tamanio_kb` int unsigned DEFAULT NULL COMMENT 'Tamaño del archivo en KB',
  `resolucion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ej: 1024x768',
  `estado_procesado` enum('pendiente','procesando','completado','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_radiografia`),
  KEY `id_evaluacion` (`id_evaluacion`),
  KEY `id_tipo` (`id_tipo`),
  CONSTRAINT `radiografias_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones_diagnosticas` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `radiografias_ibfk_2` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_radiografia` (`id_tipo`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Imágenes radiográficas cargadas por evaluación diagnóstica';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.reportes
CREATE TABLE IF NOT EXISTS `reportes` (
  `id_reporte` int unsigned NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int unsigned NOT NULL,
  `id_odontologo` int unsigned NOT NULL COMMENT 'Odontólogo que generó el reporte',
  `nombre_archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta o URL del PDF generado',
  `tamanio_kb` int unsigned DEFAULT NULL,
  `generado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reporte`),
  KEY `id_evaluacion` (`id_evaluacion`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones_diagnosticas` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reportes PDF generados por evaluación diagnóstica';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.resultados_deteccion
CREATE TABLE IF NOT EXISTS `resultados_deteccion` (
  `id_resultado` int unsigned NOT NULL AUTO_INCREMENT,
  `id_radiografia` int unsigned NOT NULL,
  `modelo_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Versión del modelo utilizado, ej: YOLOv8-v1.0',
  `caries_detectada` tinyint(1) NOT NULL COMMENT '1=caries detectada, 0=sin caries',
  `confianza_global` decimal(5,4) DEFAULT NULL COMMENT 'Score de confianza global del modelo (0.0000 a 1.0000)',
  `imagen_resultado` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ruta de la imagen con anotaciones del modelo',
  `tiempo_proceso_ms` int unsigned DEFAULT NULL COMMENT 'Tiempo de inferencia en milisegundos',
  `error_descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Detalle del error si el procesamiento falló',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resultado`),
  KEY `id_radiografia` (`id_radiografia`),
  CONSTRAINT `resultados_deteccion_ibfk_1` FOREIGN KEY (`id_radiografia`) REFERENCES `radiografias` (`id_radiografia`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=168 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Resultado general del modelo de IA por cada radiografía procesada';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.sesiones
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id_sesion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_odontologo` int unsigned NOT NULL,
  `token_sesion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_acceso` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expira_en` datetime NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sesion`),
  UNIQUE KEY `token_sesion` (`token_sesion`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones activas de los odontólogos en el sistema';

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla bd_detec_caries.tipo_radiografia
CREATE TABLE IF NOT EXISTS `tipo_radiografia` (
  `id_tipo` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Interproximal, Periapical, Panorámica',
  `descripcion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de tipos de radiografías dentales';

-- La exportación de datos fue deseleccionada.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
