/**
 * MIGRACIÓN: Fix recursión infinita en RLS de profiles
 * 
 * PROBLEMA: Las políticas de profiles auto-referencian la tabla profiles
 * para verificar si el usuario es admin, causando recursión infinita.
 * 
 * SOLUCIÓN: Crear función is_admin() con SECURITY DEFINER que se ejecuta
 * con permisos del creador (saltando RLS), y usar esa función en las políticas.
 * 
 * @id FIX-20260130-01
 * @author DEBY - Lead Debugger
 * @causa-raiz Políticas RLS con auto-referencia a profiles
 */

-- 1. Crear función is_admin() con SECURITY DEFINER
-- SECURITY DEFINER: Se ejecuta con permisos del OWNER (postgres), saltando RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Comentario para documentación
COMMENT ON FUNCTION public.is_admin() IS 
  'Verifica si el usuario actual es admin. Usa SECURITY DEFINER para evitar recursión RLS. FIX-20260130-01';

-- 3. Dropear políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- 4. También dropear cualquier política vieja del init_schema
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 5. Recrear políticas usando is_admin()
-- Política: Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Política: Admins pueden actualizar perfiles
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Política: Admins pueden insertar perfiles (para edge cases)
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin());

-- 6. Asegurar que "Users can view own profile" sigue existiendo
-- (Esta NO causa recursión porque solo chequea auth.uid() = id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 7. Grant execute a authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
