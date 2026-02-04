-- Migration: 20260204000001_fix_search_sorting.sql
-- ID: FIX-20260204-SEARCH-SORTING-V2
-- Descripción: Mejora el ordenamiento de búsqueda con coincidencia numérica exacta.
-- Problema: "175/70/R13" se confunde con "175/70/R14" por similitud de texto.
-- Solución: Priorizar registros que contengan la misma secuencia de números que el query.

-- 1. Actualizar search_inventory
create or replace function search_inventory(
  p_query text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns setof inventory as $$
declare
  v_user_id uuid;
  v_query_nums text;
begin
  -- Mantener threshold bajo para tolerancia a typos
  set pg_trgm.similarity_threshold = 0.1;
  
  -- Obtener ID de usuario
  v_user_id := auth.uid();
  if v_user_id is null then return; end if;

  -- Extraer solo números del query (para matching exacto de medidas)
  -- Ej: "175/70/R13" -> "1757013"
  v_query_nums := regexp_replace(p_query, '[^0-9]', '', 'g');
  
  return query
  select *
  from inventory
  where 
    profile_id = v_user_id
    and (
      p_query = ''
      or search_text % lower(p_query)
      or description % lower(p_query)
      or search_text ilike '%' || lower(p_query) || '%'
      or description ilike '%' || lower(p_query) || '%'
    )
  order by 
    case when p_query = '' then updated_at end desc,
    
    -- NIVEL 1: COINCIDENCIA NUMÉRICA EXACTA (PRIORIDAD MÁXIMA)
    -- Si el query tiene números, verificamos si la descripción contiene esa secuencia exacta.
    -- Esto separa efectivamente "R13" (contiene 13) de "R14" (contiene 14).
    case 
      when v_query_nums <> '' 
           and regexp_replace(description, '[^0-9]', '', 'g') like '%' || v_query_nums || '%' 
      then 1 
      else 0 
    end desc,
    
    -- NIVEL 2: MEJOR CANDIDATO DE TEXTO
    GREATEST(
      similarity(search_text, lower(p_query)),
      similarity(coalesce(description, ''), lower(p_query))
    ) desc,
    
    updated_at desc
  limit p_limit 
  offset p_offset;
end;
$$ language plpgsql security definer;

-- 2. Actualizar count_search_inventory (Igual que V1)
create or replace function count_search_inventory(
  p_query text default ''
)
returns bigint as $$
declare
  v_user_id uuid;
  v_count bigint;
begin
  set pg_trgm.similarity_threshold = 0.1;
  v_user_id := auth.uid();
  if v_user_id is null then return 0; end if;
  
  select count(*)
  into v_count
  from inventory
  where 
    profile_id = v_user_id
    and (
      p_query = ''
      or search_text % lower(p_query)
      or description % lower(p_query)
      or search_text ilike '%' || lower(p_query) || '%'
      or description ilike '%' || lower(p_query) || '%'
    );
  
  return v_count;
end;
$$ language plpgsql security definer;
