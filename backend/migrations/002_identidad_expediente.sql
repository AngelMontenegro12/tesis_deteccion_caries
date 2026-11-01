-- MANUAL: aplicar después de 001_auditoria_clinica.sql. No ejecutar en producción sin revisión.
-- Sin backfill: los cierres legados se capturan ANTES de rectificar su ficha.
-- No se usa FK en SQL por posibles diferencias signed/unsigned de instalaciones existentes.
CREATE TABLE identidades_expediente (
    id_evaluacion INTEGER NOT NULL,
    identidad JSON NOT NULL,
    origen VARCHAR(40) NOT NULL,
    id_actor INTEGER NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_evaluacion)
);

ALTER TABLE auditoria_clinica ADD COLUMN motivo VARCHAR(500) NULL;
