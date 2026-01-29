-- FIX: Permitir decimales en Rines y Anchos (Ej: 16.5, 22.5, 10.5)
-- Fecha: 2026-01-29

ALTER TABLE inventory 
ALTER COLUMN rim TYPE NUMERIC(5, 1),
ALTER COLUMN width TYPE NUMERIC(6, 1);
