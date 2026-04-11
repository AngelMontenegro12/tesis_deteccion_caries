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
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_deteccion`),
  KEY `id_resultado` (`id_resultado`),
  KEY `id_localizacion` (`id_localizacion`),
  CONSTRAINT `detecciones_caries_ibfk_1` FOREIGN KEY (`id_resultado`) REFERENCES `resultados_deteccion` (`id_resultado`) ON DELETE CASCADE,
  CONSTRAINT `detecciones_caries_ibfk_2` FOREIGN KEY (`id_localizacion`) REFERENCES `localizacion_caries` (`id_localizacion`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cada lesión de caries detectada por el modelo con su localización y coordenadas';

-- Volcando datos para la tabla bd_detec_caries.detecciones_caries: ~7 rows (aproximadamente)
INSERT INTO `detecciones_caries` (`id_deteccion`, `id_resultado`, `id_localizacion`, `numero_diente`, `confianza`, `bbox_x`, `bbox_y`, `bbox_ancho`, `bbox_alto`, `severidad`, `creado_en`) VALUES
	(1, 1, 1, '46', 0.9210, 120, 85, 95, 110, 'moderada', '2026-04-07 14:01:35'),
	(2, 1, 4, '47', 0.8640, 230, 90, 80, 95, 'incipiente', '2026-04-07 14:01:35'),
	(3, 3, 1, '24', 0.8830, 145, 75, 100, 115, 'moderada', '2026-04-07 14:01:35'),
	(4, 4, 3, '35', 0.7640, 200, 110, 75, 90, 'incipiente', '2026-04-07 14:01:35'),
	(5, 5, 1, '16', 0.9450, 400, 130, 105, 120, 'avanzada', '2026-04-07 14:01:35'),
	(6, 5, 4, '26', 0.8920, 610, 125, 95, 110, 'moderada', '2026-04-07 14:01:35'),
	(7, 5, 3, '36', 0.8610, 520, 200, 80, 95, 'incipiente', '2026-04-07 14:01:35');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Diagnóstico clínico final emitido por el odontólogo tras revisar los resultados del modelo';

-- Volcando datos para la tabla bd_detec_caries.diagnosticos_odontologo: ~6 rows (aproximadamente)
INSERT INTO `diagnosticos_odontologo` (`id_diagnostico`, `id_evaluacion`, `id_odontologo`, `diagnostico_texto`, `plan_tratamiento`, `confirma_ia`, `observaciones`, `fecha_diagnostico`, `actualizado_en`) VALUES
	(1, 1, 1, 'Se detectan dos lesiones cariosas en radiografía panorámica: caries de corona en diente 46 con avance moderado y caries de fisura incipiente en diente 47.', 'Obturación en diente 46 con resina compuesta. Sellante preventivo en diente 47. Control en 30 días.', 1, 'El modelo identificó correctamente ambas lesiones. Se procede con el tratamiento indicado.', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(2, 2, 1, 'Radiografía panorámica sin evidencia de caries activas. Dentición en buen estado general.', 'Profilaxis dental y aplicación de flúor tópico. Control semestral.', 1, 'Resultado del modelo coincide con la evaluación clínica.', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(3, 3, 2, 'Se observa lesión cariosa de tipo corona en diente 24 con avance moderado.', 'Obturación con resina en diente 24. Refuerzo de instrucciones de higiene.', 1, 'La lesión detectada por el modelo es consistente con la evaluación clínica previa.', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(4, 4, 2, 'Caries interdental incipiente en diente 35. Resto de la dentición sin lesiones activas.', 'Remineralización con barniz de flúor. Control en 45 días.', 1, 'El modelo detectó correctamente la lesión interproximal. Se opta por tratamiento no invasivo dado el estadío incipiente.', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(5, 5, 3, 'Paciente con tres lesiones cariosas: caries de corona avanzada en diente 16, moderada en diente 26, e incipiente interdental en diente 36.', 'Urgente: endodoncia preventiva en diente 16. Obturación en diente 26. Sellante en diente 36. Refuerzo de técnica de cepillado.', 1, 'Primera evaluación del paciente. Alto índice de caries para su edad. Se cita a los padres para informar y coordinar tratamiento.', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(6, 6, 3, 'Control post-obturación en diente 36 satisfactorio. No se evidencian nuevas lesiones en la radiografía panorámica.', 'Continuar con controles trimestrales. Mantener protocolo de higiene actual.', 1, 'Evolución favorable. El modelo no detectó caries activas, coincidiendo con la evaluación clínica.', '2026-04-07 14:01:35', '2026-04-07 14:01:35');

-- Volcando estructura para tabla bd_detec_caries.evaluaciones_diagnosticas
CREATE TABLE IF NOT EXISTS `evaluaciones_diagnosticas` (
  `id_evaluacion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_paciente` int unsigned NOT NULL,
  `id_odontologo` int unsigned NOT NULL,
  `fecha_evaluacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_visita` enum('Primera vez','Control rutina','Urgencia','Seguimiento') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Primera vez',
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones de diagnóstico asociadas a un paciente y odontólogo';

-- Volcando datos para la tabla bd_detec_caries.evaluaciones_diagnosticas: ~7 rows (aproximadamente)
INSERT INTO `evaluaciones_diagnosticas` (`id_evaluacion`, `id_paciente`, `id_odontologo`, `fecha_evaluacion`, `tipo_visita`, `motivo_consulta`, `observaciones`, `estado`, `creado_en`, `actualizado_en`) VALUES
	(1, 1, 1, '2025-06-10 09:00:00', 'Urgencia', 'Dolor en molar inferior derecho', 'Paciente refiere dolor al masticar desde hace 2 semanas', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(2, 2, 1, '2025-06-11 10:30:00', 'Control rutina', 'Control rutinario semestral', 'Sin molestias aparentes, se solicita radiografía preventiva', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(3, 3, 2, '2025-06-12 08:00:00', 'Seguimiento', 'Revisión por caries detectada anteriormente', 'Seguimiento de lesión en premolar superior izquierdo', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(4, 4, 2, '2025-06-13 11:00:00', 'Urgencia', 'Dolor leve en zona interproximal', 'Paciente refiere sensibilidad al frío', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(5, 5, 3, '2025-06-14 09:30:00', 'Primera vez', 'Primera evaluación odontológica', 'Paciente nunca ha tenido tratamiento previo', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(6, 6, 3, '2025-06-15 14:00:00', 'Seguimiento', 'Seguimiento post-tratamiento', 'Control a los 3 meses tras obturación en diente 36', 'completada', '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(7, 1, 1, '2025-07-20 09:00:00', 'Control rutina', 'Control mensual', 'Evaluación de evolución luego de primera consulta', 'pendiente', '2026-04-07 14:01:35', '2026-04-07 14:01:35');

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

-- Volcando datos para la tabla bd_detec_caries.historial_accesos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla bd_detec_caries.localizacion_caries
CREATE TABLE IF NOT EXISTS `localizacion_caries` (
  `id_localizacion` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Corona, Raíz, Interdental, Fisura',
  `descripcion` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_localizacion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de tipos/localizaciones de caries detectables';

-- Volcando datos para la tabla bd_detec_caries.localizacion_caries: ~4 rows (aproximadamente)
INSERT INTO `localizacion_caries` (`id_localizacion`, `nombre`, `descripcion`) VALUES
	(1, 'Corona', 'Caries en la zona superior del diente, principalmente en molares y premolares'),
	(2, 'Raíz', 'Caries que comprometen la raíz del diente'),
	(3, 'Interdental', 'Caries entre los dientes, zona de difícil acceso con cepillo'),
	(4, 'Fisura', 'Caries en las hendiduras de las superficies masticatorias');

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

-- Volcando datos para la tabla bd_detec_caries.odontologos: ~3 rows (aproximadamente)
INSERT INTO `odontologos` (`id_odontologo`, `nombres`, `apellidos`, `correo`, `contrasena_hash`, `colegiatura`, `especialidad`, `telefono`, `foto_perfil`, `activo`, `token_recuperacion`, `token_expiracion`, `creado_en`, `actualizado_en`) VALUES
	(1, 'Aldo', 'Montenegro Delgado', 'aldo.montenegro@sonrie.pe', '$2b$12$KIXuABYsRNWK1HfGLNVXneHzXB3Y9.klrEzIHdbS/rW7n18pSK7Xy', 'COP-12345', 'Odontología General', '979123456', NULL, 1, NULL, NULL, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(2, 'María', 'Quispe Salazar', 'maria.quispe@sonrie.pe', '$2b$12$KIXuABYsRNWK1HfGLNVXneHzXB3Y9.klrEzIHdbS/rW7n18pSK7Xy', 'COP-23456', 'Ortodoncia', '945678901', NULL, 1, NULL, NULL, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(3, 'Carlos', 'Fernández Llontop', 'carlos.fernandez@sonrie.pe', '$2b$12$KIXuABYsRNWK1HfGLNVXneHzXB3Y9.klrEzIHdbS/rW7n18pSK7Xy', 'COP-34567', 'Odontopediatría', '912345678', NULL, 1, NULL, NULL, '2026-04-07 14:01:35', '2026-04-07 14:01:35');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pacientes adolescentes registrados en el sistema (12-20 años)';

-- Volcando datos para la tabla bd_detec_caries.pacientes: ~6 rows (aproximadamente)
INSERT INTO `pacientes` (`id_paciente`, `id_odontologo`, `nombres`, `apellidos`, `fecha_nacimiento`, `edad`, `genero`, `dni`, `telefono`, `correo`, `direccion`, `apoderado`, `telefono_apoderado`, `observaciones_generales`, `activo`, `creado_en`, `actualizado_en`) VALUES
	(1, 1, 'Ángel', 'Montenegro Lucumí', '2008-03-15', 17, 'M', '76543210', '979111222', 'angel.montenegro@gmail.com', 'Av. Balta 123, Chiclayo', 'Rosa Lucumí', '945321987', 'Sin alergias conocidas', 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(2, 1, 'Sofía', 'Ramos Torres', '2007-11-20', 17, 'F', '76543211', '945222333', 'sofia.ramos@gmail.com', 'Jr. Colón 456, Chiclayo', 'Pedro Ramos', '912456789', 'Paciente con sensibilidad dental', 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(3, 2, 'Diego', 'Sánchez Pérez', '2009-06-05', 15, 'M', '76543212', NULL, NULL, 'Calle Los Álamos 789, Chiclayo', 'Carmen Pérez', '979333444', NULL, 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(4, 2, 'Valentina', 'Flores Díaz', '2006-01-30', 19, 'F', '76543213', '76543213', 'valentina.flores@gmail.com', 'Av. Salaverry 321, Chiclayo', NULL, NULL, 'Bruxismo leve reportado', 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(5, 3, 'Rodrigo', 'Vásquez Carrasco', '2010-09-12', 14, 'M', '76543214', NULL, NULL, 'Urb. Santa Victoria, Chiclayo', 'Luis Vásquez', '945555666', 'Primera visita al odontólogo', 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35'),
	(6, 3, 'Camila', 'Herrera Bustamante', '2005-04-22', 20, 'F', '76543215', '76543215', 'camila.herrera@gmail.com', 'Jr. Unión 654, Chiclayo', NULL, NULL, 'Control de tratamiento previo de caries', 1, '2026-04-07 14:01:35', '2026-04-07 14:01:35');

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Imágenes radiográficas cargadas por evaluación diagnóstica';

-- Volcando datos para la tabla bd_detec_caries.radiografias: ~7 rows (aproximadamente)
INSERT INTO `radiografias` (`id_radiografia`, `id_evaluacion`, `id_tipo`, `nombre_archivo`, `ruta_archivo`, `formato`, `tamanio_kb`, `resolucion`, `estado_procesado`, `creado_en`) VALUES
	(1, 1, 1, 'rx_angel_panoramica_20250610.jpg', 'uploads/radiografias/2025/06/rx_angel_panoramica_20250610.jpg', 'JPG', 1580, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(2, 2, 1, 'rx_sofia_panoramica_20250611.jpg', 'uploads/radiografias/2025/06/rx_sofia_panoramica_20250611.jpg', 'JPG', 1540, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(3, 3, 1, 'rx_diego_panoramica_20250612.jpg', 'uploads/radiografias/2025/06/rx_diego_panoramica_20250612.jpg', 'JPG', 1610, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(4, 4, 1, 'rx_valentina_panoramica_20250613.jpg', 'uploads/radiografias/2025/06/rx_valentina_panoramica_20250613.jpg', 'JPG', 1490, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(5, 5, 1, 'rx_rodrigo_panoramica_20250614.jpg', 'uploads/radiografias/2025/06/rx_rodrigo_panoramica_20250614.jpg', 'JPG', 1620, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(6, 6, 1, 'rx_camila_panoramica_20250615.jpg', 'uploads/radiografias/2025/06/rx_camila_panoramica_20250615.jpg', 'JPG', 1555, '2048x1024', 'completado', '2026-04-07 14:01:35'),
	(7, 7, 1, 'rx_angel_panoramica_20250720.jpg', 'uploads/radiografias/2025/07/rx_angel_panoramica_20250720.jpg', 'JPG', 1600, '2048x1024', 'pendiente', '2026-04-07 14:01:35');

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

-- Volcando datos para la tabla bd_detec_caries.reportes: ~0 rows (aproximadamente)

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Resultado general del modelo de IA por cada radiografía procesada';

-- Volcando datos para la tabla bd_detec_caries.resultados_deteccion: ~6 rows (aproximadamente)
INSERT INTO `resultados_deteccion` (`id_resultado`, `id_radiografia`, `modelo_version`, `caries_detectada`, `confianza_global`, `imagen_resultado`, `tiempo_proceso_ms`, `error_descripcion`, `creado_en`) VALUES
	(1, 1, 'YOLOv8-v1.0', 1, 0.9210, 'uploads/resultados/2025/06/res_angel_panoramica_20250610.jpg', 3980, NULL, '2026-04-07 14:01:35'),
	(2, 2, 'YOLOv8-v1.0', 0, 0.1200, 'uploads/resultados/2025/06/res_sofia_panoramica_20250611.jpg', 3870, NULL, '2026-04-07 14:01:35'),
	(3, 3, 'YOLOv8-v1.0', 1, 0.8830, 'uploads/resultados/2025/06/res_diego_panoramica_20250612.jpg', 4010, NULL, '2026-04-07 14:01:35'),
	(4, 4, 'YOLOv8-v1.0', 1, 0.7640, 'uploads/resultados/2025/06/res_valentina_panoramica_20250613.jpg', 3760, NULL, '2026-04-07 14:01:35'),
	(5, 5, 'YOLOv8-v1.0', 1, 0.9450, 'uploads/resultados/2025/06/res_rodrigo_panoramica_20250614.jpg', 4120, NULL, '2026-04-07 14:01:35'),
	(6, 6, 'YOLOv8-v1.0', 0, 0.0650, 'uploads/resultados/2025/06/res_camila_panoramica_20250615.jpg', 3890, NULL, '2026-04-07 14:01:35');

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

-- Volcando datos para la tabla bd_detec_caries.sesiones: ~0 rows (aproximadamente)

-- Volcando estructura para tabla bd_detec_caries.tipo_radiografia
CREATE TABLE IF NOT EXISTS `tipo_radiografia` (
  `id_tipo` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: Interproximal, Periapical, Panorámica',
  `descripcion` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de tipos de radiografías dentales';

-- Volcando datos para la tabla bd_detec_caries.tipo_radiografia: ~1 rows (aproximadamente)
INSERT INTO `tipo_radiografia` (`id_tipo`, `nombre`, `descripcion`) VALUES
	(1, 'Panoramicas', 'Descripcion prueba');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
