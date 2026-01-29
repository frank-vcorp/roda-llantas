# 🏗️ SPEC-SEARCH: Buscador Inteligente

**ID:** ARCH-20260129-SEARCH
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Implementar un sistema de búsqueda flexible y robusto ("Fuzzy Search") que permita al usuario encontrar productos en el inventario escribiendo querys naturales, tolerando errores tipográficos y desorden de palabras.

**Ejemplos de éxito:**
- Query: "michelin" -> Encuentra Brand="Michelin"
- Query: "llanta 13" -> Encuentra items con Rim=13
- Query: "205 55 16" -> Encuentra items con Width=205, Aspect=55, Rim=16 (en cualquier orden)
- Query: "michilin" -> Encuentra Brand="Michelin" (Fuzzy)

## 2. 🏗️ Arquitectura Técnica (Supabase/PostgreSQL)

### 2.1 Extensión `pg_trgm`
Usaremos la extensión oficial de PostgreSQL `pg_trgm` (trigrams) que es excelente para comparaciones de similitud de texto.

### 2.2 Columna Generada `search_text`
Para evitar joins costosos o lógica compleja en el tiempo de consulta, crearemos una columna generada (o mantenida por trigger si Supabase Generated Columns tiene limitaciones en version vieja, pero usaremos generated always as si es PG12+) que concatene toda la info relevante.

`search_text` = `brand` + ' ' + `model` + ' ' + `medida_full` + ' ' + `sku`

### 2.3 RPC Function `search_inventory`
Crearemos una función almacenada (Remote Procedure Call) que reciba el `query` y el `profile_id`.

**Lógica de Búsqueda:**
1.  Limpiar el query.
2.  Dividir el query en "tokens" (palabras).
3.  Para cada token, requerir que coincida (AND logic) con el `search_text` usando el operador `%` (similaridad) o `ILIKE` robusto.
    *   *Estrategia MVP*: Usar `websearch_to_tsquery` para búsqueda full-text O `pg_trgm` con operador de similaridad.
    *   *Decisión*: Usaremos `pg_trgm` sobre un índice GIN en `search_text` para máxima flexibilidad con errores de dedo.

## 3. 💾 Plan de Base de Datos

### Migración `008_smart_search.sql`

```sql
-- 1. Habilitar extensión
create extension if not exists pg_trgm;

-- 2. Agregar columna de búsqueda (Concatenación)
-- Nota: Usamos una columna normal y un trigger para mantenerla actualizada, 
-- para asegurar compatibilidad y performance.
alter table inventory add column search_text text;

-- 3. Trigger para actualizar search_text
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

create trigger tr_inventory_search_text
before insert or update on inventory
for each row execute function update_inventory_search_text();

-- 4. Índice GIN para velocidad extrema
create index idx_inventory_search_text_trgm on inventory using gin (search_text gin_trgm_ops);

-- 5. Función RPC para llamar desde el Frontend
create or replace function search_inventory(
  p_query text,
  p_limit int default 50,
  p_offset int default 0
)
returns setof inventory as $$
begin
  return query
  select *
  from inventory
  where 
    profile_id = auth.uid() -- Seguridad RLS manual dentro de la función o confiar en RLS
    and (
      p_query = '' 
      or search_text % lower(p_query) -- Operador de similaridad estricta
      or search_text ilike '%' || lower(p_query) || '%' -- Fallback simple
    )
  order by 
    case when p_query = '' then created_at end desc,
    similarity(search_text, lower(p_query)) desc
  limit p_limit offset p_offset;
end;
$$ language plpgsql;
```

*Refinamiento*: La función `search_inventory` puede ser compleja. Para el MVP, quizás es mejor solo exponer la columna `search_text` y dejar que el cliente use filtros `ilike`.
**Mejor opción**: Usaremos la columna `search_text` y haremos las consultas usando el cliente de Supabase con `.textSearch()` o filtros `.or()` si es posible, PERO `RPC` es lo más potente para ordenar por relevancia.
**Decisión Final**: Implementar la RPC `search_inventory` simplificada que acepte un string y busque coincidencia.

## 4. 💻 Frontend (Dashboard)

### 4.1 Input de Búsqueda
Reemplazar el input actual en `src/app/dashboard/inventory/columns.tsx` (o donde esté la barra de búsqueda superior) para usar un hook de *debounce*.

### 4.2 Integración
Modificar el fetching de datos en `src/app/dashboard/inventory/page.tsx` para usar la RPC si hay un query de búsqueda, o el select normal si está vacío.

---

## 5. 🦶 Pasos para Sofia

1.  **DB**: Crear migración `008_smart_search.sql` con la extensión y columna generada.
2.  **Backfill**: Asegurar que la migración actualice los rows existentes.
3.  **Frontend**: Conectar la nueva lógica de búsqueda en la Tabla de Inventario.

