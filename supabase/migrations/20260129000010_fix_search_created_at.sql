-- Migration: 20260129000010_fix_search_created_at.sql
-- FIX REFERENCE: FIX-20260129-09
-- Descripción: Corrige error "column created_at does not exist" en search_inventory
-- Causa raíz: La tabla inventory tiene updated_at, NO created_at.
-- Solución: Reemplazar created_at por updated_at en el ORDER BY de la función RPC.

-- Recrear la función search_inventory con la columna correcta
create or replace function search_inventory(
  p_query text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns setof inventory as $$
declare
  v_user_id uuid;
begin
  -- Obtener el ID del usuario autenticado
  v_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, retornar vacío
  if v_user_id is null then
    return;
  end if;
  
  return query
  select *
  from inventory
  where 
    profile_id = v_user_id
    and (
      -- Si query está vacío, retornar todos
      p_query = ''
      -- Búsqueda fuzzy con pg_trgm (operador %)
      or search_text % lower(p_query)
      -- Fallback con ILIKE para búsquedas parciales
      or search_text ilike '%' || lower(p_query) || '%'
    )
  order by 
    -- FIX: Usar updated_at en lugar de created_at (que no existe en la tabla)
    case when p_query = '' then updated_at end desc,
    -- Si hay query, ordenar por similitud (fuzzy match score)
    similarity(search_text, lower(p_query)) desc,
    -- Luego por última actualización
    updated_at desc
  limit p_limit 
  offset p_offset;
end;
$$ language plpgsql security definer;

-- Documentación actualizada
comment on function search_inventory is 'RPC para búsqueda inteligente de inventario. Utiliza pg_trgm para fuzzy matching. Requiere autenticación. FIX-20260129-09: Corregido ORDER BY a updated_at.';
