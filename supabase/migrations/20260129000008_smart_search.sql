-- Migration: 20260129000008_smart_search.sql
-- ID: IMPL-20260129-SEARCH-01
-- Descripción: Capa de datos para Buscador Inteligente (Full-Text Search + Fuzzy)

-- 1. Habilitar extensión pg_trgm para búsqueda fuzzy (trigrams)
create extension if not exists pg_trgm;

-- 2. Agregar columna search_text a inventory
-- Esta columna contendrá la concatenación normalizada de brand, model, medida_full y sku
alter table inventory add column if not exists search_text text;

-- 3. Función trigger para actualizar search_text automáticamente
create or replace function update_inventory_search_text()
returns trigger as $$
begin
  new.search_text := lower(
    coalesce(new.brand, '') || ' ' || 
    coalesce(new.model, '') || ' ' || 
    coalesce(new.medida_full, '') || ' ' || 
    coalesce(new.sku, '')
  );
  return new;
end;
$$ language plpgsql;

-- 4. Crear trigger en insert/update
drop trigger if exists tr_inventory_search_text on inventory;
create trigger tr_inventory_search_text
before insert or update on inventory
for each row execute function update_inventory_search_text();

-- 5. Backfill: Actualizar search_text para los registros existentes
update inventory
set search_text = lower(
  coalesce(brand, '') || ' ' || 
  coalesce(model, '') || ' ' || 
  coalesce(medida_full, '') || ' ' || 
  coalesce(sku, '')
)
where search_text is null or search_text = '';

-- 6. Crear índice GIN para búsqueda rápida por trigrams
create index if not exists idx_inventory_search_text_trgm on inventory using gin (search_text gin_trgm_ops);

-- 7. RPC Function: search_inventory
-- Busca en el inventario del usuario actual utilizando pg_trgm para fuzzy matching
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
    -- Si query está vacío, ordenar por creación descendente
    case when p_query = '' then created_at end desc,
    -- Si hay query, ordenar por similitud (fuzzy match score)
    similarity(search_text, lower(p_query)) desc,
    -- Luego por creación
    created_at desc
  limit p_limit 
  offset p_offset;
end;
$$ language plpgsql security definer;

-- 8. Comentarios de documentación
comment on column inventory.search_text is 'Columna desnormalizada para búsqueda rápida: concat(brand, model, medida_full, sku) en minúsculas';
comment on function search_inventory is 'RPC para búsqueda inteligente de inventario. Utiliza pg_trgm para fuzzy matching. Requiere autenticación.';
