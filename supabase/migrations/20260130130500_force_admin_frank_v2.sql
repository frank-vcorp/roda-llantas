-- ============================================================
-- FIX REFERENCE: FIX-20260130-01
-- Descripción: Forzar rol admin para frank@vcorp.mx
-- Fecha: 2026-01-30
-- Motivo: Migraciones anteriores no aplicaron correctamente
-- ============================================================

-- Actualización explícita del rol
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'frank@vcorp.mx';

-- Verificación (solo para log)
DO $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE email = 'frank@vcorp.mx';
    RAISE NOTICE 'Usuario frank@vcorp.mx ahora tiene rol: %', v_role;
END $$;
