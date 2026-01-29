-- Migration: 20260129000011_fix_search_threshold.sql
-- FIX REFERENCE: FIX-20260129-10
-- Descripción: Corrige threshold de búsqueda fuzzy (0.3 → 0.1) para mejorar tolerancia a typos
-- Problema: "michilin" no encuentra "Michelin" con threshold default de 0.3

-- 1. Re-ejecutar Backfill de search_text (idempotente, no daña si ya está lleno)
update inventory
set search_text = lower(
  coalesce(brand, '') || ' ' || 
  coalesce(model, '') || ' ' || 
  coalesce(medida_full, '') || ' ' || 
  coalesce(sku, '')
)
where search_text is null or search_text = '';

-- 2. Recrear función search_inventory con threshold explícito de 0.1
create or replace function search_inventory(
  p_query text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns setof inventory as $$
declare
  v_user_id uuid;
begin
  -- FIX REFERENCE: FIX-20260129-10
  -- Establecer threshold bajo para tolerar errores tipográficos (ej: "michilin" → "Michelin")
  set pg_trgm.similarity_threshold = 0.1;
  
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
      -- Búsqueda fuzzy con pg_trgm (operador %) - usa threshold 0.1
      or search_text % lower(p_query)
      -- Fallback con ILIKE para búsquedas parciales
      or search_text ilike '%' || lower(p_query) || '%'
    )
  order by 
    -- Si query está vacío, ordenar por actualización descendente
    case when p_query = '' then updated_at end desc,
    -- Si hay query, ordenar por similitud (fuzzy match score)
    similarity(search_text, lower(p_query)) desc,
    -- Luego por actualización (no created_at)
    updated_at desc
  limit p_limit 
  offset p_offset;
end;
$$ language plpgsql security definer;

-- 3. Recrear función count_search_inventory con threshold explícito de 0.1
create or replace function count_search_inventory(
  p_query text default ''
)
returns bigint as $$
declare
  v_user_id uuid;
  v_count bigint;
begin
  -- FIX REFERENCE: FIX-20260129-10
  -- Establecer threshold bajo para consistencia con search_inventory
  set pg_trgm.similarity_threshold = 0.1;
  
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
      -- Búsqueda fuzzy con pg_trgm (operador %) - usa threshold 0.1
      or search_text % lower(p_query)
      -- Fallback con ILIKE para búsquedas parciales
      or search_text ilike '%' || lower(p_query) || '%'
    );
  
  return v_count;
end;
$$ language plpgsql security definer;

-- 4. Comentarios actualizados
comment on function search_inventory is 'RPC para búsqueda inteligente de inventario. Utiliza pg_trgm con threshold=0.1 para fuzzy matching tolerante a typos. FIX-20260129-10';
comment on function count_search_inventory is 'RPC para contar resultados de búsqueda. Utiliza threshold=0.1 para consistencia con search_inventory. FIX-20260129-10';
