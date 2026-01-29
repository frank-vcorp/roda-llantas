-- Migration: 20260129000009_search_count.sql
-- ID: IMPL-20260129-SEARCH-02
-- Descripción: Función RPC para contar resultados de búsqueda sin paginación

-- RPC Function: count_search_inventory
-- Cuenta el total de resultados que coinciden con un query de búsqueda
-- Utiliza la misma lógica que search_inventory para consistencia
create or replace function count_search_inventory(
  p_query text default ''
)
returns bigint as $$
declare
  v_user_id uuid;
  v_count bigint;
begin
  -- Obtener el ID del usuario autenticado
  v_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, retornar 0
  if v_user_id is null then
    return 0;
  end if;
  
  -- Contar registros que coinciden con el query
  select count(*)
  into v_count
  from inventory
  where 
    profile_id = v_user_id
    and (
      -- Si query está vacío, contar todos
      p_query = ''
      -- Búsqueda fuzzy con pg_trgm (operador %)
      or search_text % lower(p_query)
      -- Fallback con ILIKE para búsquedas parciales
      or search_text ilike '%' || lower(p_query) || '%'
    );
  
  return v_count;
end;
$$ language plpgsql security definer;

-- Comentario de documentación
comment on function count_search_inventory is 'RPC para contar resultados de búsqueda inteligente de inventario. Utiliza la misma lógica que search_inventory. Requiere autenticación.';
