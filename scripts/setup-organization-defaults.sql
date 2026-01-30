/**
 * Script de Setup: Insertar registro por defecto de organization_settings
 *
 * Ejecutar desde el CLI de Supabase:
 * ```
 * supabase db execute < scripts/setup-organization-defaults.sql
 * ```
 * 
 * O desde psql:
 * ```
 * psql -h <HOST> -U postgres -d postgres -f scripts/setup-organization-defaults.sql
 * ```
 *
 * @id IMPL-20260130-WHITELABEL
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 */

-- Insertar settings por defecto para Frank (administrador principal)
-- Se asume que Frank es el usuario con email 'frank@example.com'
INSERT INTO organization_settings (
  profile_id,
  name,
  address,
  phone,
  website,
  logo_url,
  ticket_footer_message
)
SELECT 
  id,
  'Roda Llantas',
  'Bogotá, Colombia',
  '+57 (1) 1234 5678',
  'https://example.com',
  NULL,
  '¡Gracias por su compra! Esperamos volver a servirle pronto.'
FROM auth.users
WHERE email LIKE '%frank%' OR email = 'frank@rodallantaspro.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Para casos manuales, insertar con UUID conocido:
-- INSERT INTO organization_settings (profile_id, name, address, phone, ticket_footer_message)
-- VALUES ('<UUID_USER>', 'Mi Llantera', 'Mi Dirección', '+57 300 123 4567', '¡Gracias por su compra!');
