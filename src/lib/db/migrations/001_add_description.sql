-- Activar la extensión pg_trgm necesaria para índices GIN de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Migración para agregar columna 'description' a la tabla 'inventory'
-- Esto permite guardar la descripción original del Excel sin procesar
-- Fecha: 2026-01-29

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Crear índice para búsquedas de texto en la descripción original
CREATE INDEX IF NOT EXISTS idx_inventory_description ON inventory USING gin(description gin_trgm_ops);
