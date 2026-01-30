/**
 * Migración: Crear tabla organization_settings
 * 
 * @id IMPL-20260130-WHITELABEL
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 * 
 * Crea tabla singleton para almacenar configuración global de la organización:
 * - Nombre del negocio
 * - Dirección y contacto
 * - Logo (URL de Supabase Storage)
 * - Mensaje de pie de página para tickets
 */

-- Crear tabla organization_settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Llantera',
  address TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  ticket_footer_message TEXT DEFAULT '¡Gracias por su compra!',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_organization_settings_profile_id 
  ON organization_settings(profile_id);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Permitir lectura pública (cualquiera puede leer)
CREATE POLICY "Allow public read" 
  ON organization_settings 
  FOR SELECT 
  USING (true);

-- Permitir escritura solo al propietario (admin)
CREATE POLICY "Allow owner update" 
  ON organization_settings 
  FOR UPDATE 
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Permitir inserción solo al propietario (admin)
CREATE POLICY "Allow owner insert" 
  ON organization_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = profile_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_organization_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_settings_timestamp();

-- Insertar registro por defecto para el usuario (Frank - si está disponible)
-- Nota: Se insertará durante el setup inicial
