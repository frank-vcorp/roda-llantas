/**
 * MIGRACIÓN: Tabla de Profiles y Roles (RBAC)
 * 
 * - Tabla profiles: Extensión de auth.users con rol y metadata
 * - Trigger: Auto-crea profile al registrarse usuario
 * - RLS: Users solo leen su perfil, admins leen/editan todo
 * 
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 */

-- 1. Crear tabla profiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Agregar columnas si la tabla ya existía sin ellas
-- FIX REFERENCE: FIX-20260129-PROFILES-ROLE
DO $$ 
BEGIN 
  -- Agregar columna 'email' si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN email TEXT; 
    -- Poblar email desde auth.users para registros existentes
    UPDATE public.profiles p SET email = u.email 
    FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;
    -- Hacer NOT NULL después de poblar
    ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
  END IF;

  -- Agregar columna 'role' si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
  ) THEN 
    ALTER TABLE public.profiles 
      ADD COLUMN role TEXT NOT NULL DEFAULT 'seller' 
      CHECK (role IN ('admin', 'seller')); 
  END IF;
  
  -- Agregar columna 'full_name' si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'full_name'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT; 
  END IF;
  
  -- Agregar columna 'updated_at' si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'updated_at'
  ) THEN 
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); 
  END IF;
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuarios pueden leer su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Política: Admins pueden leer/editar todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. Crear función que auto-genera profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role'), 'seller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para auto-crear profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seed inicial: Asignar role 'admin' al primer usuario (si existe)
-- Este es un helper para pruebas locales
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Obtener el primer usuario registrado
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = first_user_id;
  END IF;
END $$;

-- 8. Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 9. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_update_updated_at ON public.profiles;
CREATE TRIGGER profiles_update_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
