-- Migration: 20260207000001_allow_public_inventory.sql
-- ID: FIX-20260207-PUBLIC-ACCESS
-- Descripción: Permitir lectura pública de la tabla inventory para el buscador.
-- La seguridad de precios (ocultar costos) se maneja en el backend/frontend, 
-- ya que RLS es a nivel de fila.

-- 1. Eliminar política restrictiva anterior si existe (opcional, pero seguro)
drop policy if exists "Inventory items are viewable by owner" on inventory;

-- 2. Crear nueva política permisiva para SELECT
-- Permitimos que cualquiera (anon y authenticated) pueda ver el inventario.
-- El filtrado por 'profile_id' se hará en el WHERE de la consulta si es necesario, 
-- pero para el buscador público queremos ver todo el catálogo global 
-- (o ajustar según modelo de negocio, asumo catálogo global para ventas).

create policy "Inventory is public"
  on inventory for select
  using ( true );

-- 3. Mantener políticas de escritura restrictivas (solo dueños)
-- (Estas ya existen en init_schema.sql, pero las reafirmamos mentalmente)
-- insert/update/delete siguen restringidos a auth.uid() = profile_id

-- 4. Actualizar funciones RPC para búsqueda pública (si auth.uid() es null)
-- (Esto requiere modificar las funciones search_inventory y count_search_inventory 
-- para no retornar vacío si user_id es null, sino buscar globalmente).

create or replace function search_inventory(
  p_query text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns setof inventory as $$
declare
  v_query_nums text;
begin
  -- Mantener threshold bajo
  set pg_trgm.similarity_threshold = 0.1;
  
  -- Nota: Eliminamos la restricción de v_user_id. Buscamos en todo el inventario público.
  
  -- Extraer números
  v_query_nums := regexp_replace(p_query, '[^0-9]', '', 'g');
  
  return query
  select *
  from inventory
  where 
    (
      p_query = ''
      or search_text % lower(p_query)
      or description % lower(p_query)
      or search_text ilike '%' || lower(p_query) || '%'
      or description ilike '%' || lower(p_query) || '%'
    )
  order by 
    case when p_query = '' then updated_at end desc,
    case 
      when v_query_nums <> '' 
           and regexp_replace(description, '[^0-9]', '', 'g') like '%' || v_query_nums || '%' 
      then 1 
      else 0 
    end desc,
    GREATEST(
      similarity(search_text, lower(p_query)),
      similarity(coalesce(description, ''), lower(p_query))
    ) desc,
    updated_at desc
  limit p_limit 
  offset p_offset;
end;
$$ language plpgsql security definer;

create or replace function count_search_inventory(
  p_query text default ''
)
returns bigint as $$
declare
  v_count bigint;
begin
  set pg_trgm.similarity_threshold = 0.1;
  
  select count(*)
  into v_count
  from inventory
  where 
    (
      p_query = ''
      or search_text % lower(p_query)
      or description % lower(p_query)
      or search_text ilike '%' || lower(p_query) || '%'
      or description ilike '%' || lower(p_query) || '%'
    );
  
  return v_count;
end;
$$ language plpgsql security definer;
