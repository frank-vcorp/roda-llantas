-- ============================================================
-- MIGRACIÓN: Otorgar rol admin a todas las cuentas (Demo)
-- FIX REFERENCE: FIX-20260130-01
-- Fecha: 2026-01-30
-- Propósito: Permitir que todos los usuarios vean todas las
--            funcionalidades del sistema para demostración.
-- ============================================================

UPDATE public.profiles SET role = 'admin';

-- NOTA: Esta migración es para propósitos de demo únicamente.
-- En producción, los roles deben asignarse individualmente.
