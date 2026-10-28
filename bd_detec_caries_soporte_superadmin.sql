USE `bd_detec_caries`;

ALTER TABLE `odontologos`
  MODIFY COLUMN `rol` VARCHAR(20) NOT NULL DEFAULT 'odontologo';

CREATE TABLE IF NOT EXISTS `mensajes_soporte` (
  `id_mensaje` int unsigned NOT NULL AUTO_INCREMENT,
  `id_odontologo` int unsigned NOT NULL,
  `tipo` enum('error','consulta','sugerencia') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'consulta',
  `asunto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagina_origen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `respuesta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `respondido_en` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `id_odontologo` (`id_odontologo`),
  CONSTRAINT `mensajes_soporte_ibfk_1` FOREIGN KEY (`id_odontologo`) REFERENCES `odontologos` (`id_odontologo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mensajes de soporte enviados por los usuarios';

INSERT IGNORE INTO `odontologos`
  (`nombres`, `apellidos`, `correo`, `contrasena_hash`, `colegiatura`, `especialidad`, `telefono`, `foto_perfil`, `activo`, `rol`, `permisos`)
VALUES
  ('Super', 'Admin', 'admin@sonrie.com', '$2b$12$H3HTCIHCOD25pR9FU0D82euawh0QgC4B0GApRRFNPn6xUtPqpiKN.', NULL, 'Administrador del sistema', NULL, NULL, 1, 'superadmin', NULL);
