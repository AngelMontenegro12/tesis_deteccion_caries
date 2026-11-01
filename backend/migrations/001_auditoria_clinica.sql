-- Aplicación MANUAL, previa revisión y copia de seguridad. No altera registros existentes.
CREATE TABLE auditoria_clinica (
    id_evento INTEGER NOT NULL AUTO_INCREMENT,
    id_actor INTEGER NOT NULL,
    recurso VARCHAR(30) NOT NULL,
    id_recurso INTEGER NOT NULL,
    accion VARCHAR(40) NOT NULL,
    campos JSON NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_evento),
    INDEX ix_auditoria_clinica_id_actor (id_actor),
    INDEX ix_auditoria_clinica_id_recurso (id_recurso)
);
