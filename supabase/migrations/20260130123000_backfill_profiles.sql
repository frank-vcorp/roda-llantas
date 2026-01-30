-- ============================================================================
-- FIX REFERENCE: FIX-20260130-01
-- Descripción: Backfill de perfiles para usuarios "fantasma" que existen en 
--              auth.users pero no tienen fila en public.profiles (registrados
--              antes de crear la tabla profiles y el trigger).
-- ============================================================================

-- Insertar perfiles para usuarios que ya existen en auth pero no en profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'  -- Forzamos admin de una vez para usuarios existentes
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';  -- Si ya existe, lo hacemos admin también
