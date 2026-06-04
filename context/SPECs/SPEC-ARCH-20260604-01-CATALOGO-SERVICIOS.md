# SPEC - Catalogo de Servicios Buscable

**ID:** ARCH-20260604-01
**Estado:** Draft listo para validacion humana
**Fecha:** 2026-06-04
**Respaldo:** [context/clientes/DEAC-ARCH-20260604-01.md](context/clientes/DEAC-ARCH-20260604-01.md)

## 1. Objetivo
Implementar un catalogo de servicios separado del inventario de llantas, visible en el buscador principal publico, con carga inicial desde [context/Inventario-servicios.xlsx](context/Inventario-servicios.xlsx), soporte de sinonimos y politica de precios por tier A, AA y AAA ajustable por porcentaje y monto fijo.

## 2. Archivo Ancla Inicial
- [src/lib/services/inventory.ts](src/lib/services/inventory.ts)

Justificacion: hoy centraliza la lectura del catalogo buscable via getInventoryItems y es la capa correcta para extender la busqueda sin tocar de inicio la UI publica.

## 3. Datos Existentes a Reutilizar
- Busqueda publica actual basada en RPC search_inventory y count_search_inventory.
  Referencias: [src/lib/services/inventory.ts](src/lib/services/inventory.ts), [src/app/page.tsx](src/app/page.tsx), [supabase/migrations/20260207000001_allow_public_inventory.sql](supabase/migrations/20260207000001_allow_public_inventory.sql)
- Mecanica existente de carga XLSX con libreria xlsx.
  Referencia: [src/lib/logic/excel-parser.ts](src/lib/logic/excel-parser.ts)
- Patrones de lectura de reglas y calculo de precio para exponer montos en UI.
  Referencias: [src/lib/services/pricing.ts](src/lib/services/pricing.ts), [src/lib/logic/pricing-engine.ts](src/lib/logic/pricing-engine.ts)

## 4. Datos Nuevos a Crear

### 4.1 Base de Datos
Crear tablas nuevas, separadas de inventory:

1. `service_catalog`
- `id uuid primary key`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `profile_id uuid null`
- `category text not null`
- `base_name text not null`
- `display_name text not null`
- `description text null`
- `is_active boolean default true`
- `search_text text not null default ''`
- `source_import_batch text null`

2. `service_tiers`
- `id uuid primary key`
- `service_id uuid references service_catalog(id) on delete cascade`
- `tier_code text not null check (tier_code in ('A','AA','AAA'))`
- `base_price numeric(10,2) not null`
- `manual_price numeric(10,2) null`
- `is_active boolean default true`
- unique `(service_id, tier_code)`

3. `service_tier_policies`
- `id uuid primary key`
- `tier_code text not null check (tier_code in ('A','AA','AAA'))`
- `adjustment_percent numeric(8,2) not null default 0`
- `adjustment_amount numeric(10,2) not null default 0`
- `is_active boolean default true`
- unique `(tier_code)`

4. `service_aliases`
- `id uuid primary key`
- `service_id uuid references service_catalog(id) on delete cascade`
- `alias text not null`
- `alias_normalized text not null`
- unique `(service_id, alias_normalized)`

### 4.2 Capa de Busqueda
Crear una funcion RPC nueva para no romper el buscador actual de llantas:

`search_catalog(p_query text default '', p_limit int default 50, p_offset int default 0)`

Debe retornar un shape normalizado con columnas:
- `result_type text` valores `product` o `service`
- `result_id uuid`
- `title text`
- `subtitle text`
- `search_text text`
- `price numeric`
- `metadata jsonb`
- `updated_at timestamptz`

La funcion debe unir:
- inventory como `product`
- service_catalog + service_tiers + service_tier_policies + service_aliases como `service`

## 5. Reglas de Normalizacion del Excel
- El archivo fuente es [context/Inventario-servicios.xlsx](context/Inventario-servicios.xlsx).
- La rutina de importacion debe asumir este mapeo de columnas confirmado por usuario:
  - `SKU` -> `service_tiers.external_sku` o, si no se crea esa columna en slice 1, se conserva dentro de `metadata` del resultado de importacion.
  - `Nombre del producto` -> fuente para separar `base_name`, `display_name` y `tier_code`.
  - `Categoría` -> `service_catalog.category`.
  - `Precio de venta` -> `service_tiers.base_price`.
- Restriccion contractual: el importador no puede cambiar, corregir, traducir, enriquecer ni reinterpretar nombres, categorias o precios del Excel.
- Restriccion contractual: el sistema no puede inventar categorias, nombres, precios ni sinonimos que no existan en el archivo o que no hayan sido capturados manualmente despues.
- La deteccion heuristica de headers sigue permitida como fallback, pero el parser debe priorizar exactamente esos encabezados.
- Si `Nombre del producto` termina en sufijo `A`, `AA` o `AAA`, ese sufijo se separa del nombre base y se guarda como `tier_code`.
- Si `Nombre del producto` no termina en `A`, `AA` o `AAA`, el registro se debe importar con `tier_code = 'A'`.
- El nombre completo original se preserva en `display_name`.
- El nombre base se obtiene removiendo el sufijo final y espacios sobrantes cuando exista. Si no existe sufijo, `base_name = display_name`.
- Ejemplo: `Cambio de Balatas delantera AA` -> `base_name = Cambio de Balatas delantera`, `tier_code = AA`, `display_name = Cambio de Balatas delantera AA`.
- Ejemplo sin clasificacion: `Vulcanizado` -> `base_name = Vulcanizado`, `tier_code = A`, `display_name = Vulcanizado`.
- El parser debe tolerar mayusculas/minusculas y espacios duplicados al final del nombre.
- El precio del Excel se normaliza eliminando simbolo `$` y separadores de miles antes de convertirlo a `numeric(10,2)`.
- Si no existe columna de sinonimos en el Excel, no se inventan sinonimos automaticamente; solo se crea un alias base identico a `base_name` normalizado.
- La gestion enriquecida de sinonimos queda para alta manual posterior en dashboard o import complementario.
- `Categoría` se persiste exactamente como venga en el Excel, salvo trim de espacios exteriores.
- `Precio de venta` se persiste exactamente como valor monetario del Excel, salvo limpieza tecnica de formato para convertirlo a numero.
- `Nombre del producto` se persiste exactamente en `display_name`, salvo trim de espacios exteriores.

## 6. Formula de Precio de Servicio
Precio visible final por tier:

`precio_final = coalesce(manual_price, base_price + (base_price * adjustment_percent / 100) + adjustment_amount)`

Reglas:
- `manual_price` domina sobre toda politica.
- `adjustment_percent` y `adjustment_amount` son acumulativos.
- Si no existe politica para un tier, ambos ajustes se consideran cero.

## 6.1 Regla de Presentacion Comercial
- En la UI, el nombre visible del servicio debe salir de `base_name`, no de `display_name`.
- `display_name` queda solo como respaldo interno para trazabilidad e importacion.
- El campo visible ya no debe mostrar los sufijos `A`, `AA` o `AAA` como parte del nombre.
- El atributo comercial visible deja de llamarse `Tier`; en UI debe llamarse `Gama`.
- Mapeo obligatorio de presentacion:
  - `A` -> `Basica`
  - `AA` -> `Media`
  - `AAA` -> `Premium`
- En formularios y listados, solo deben mostrarse las opciones `Basica`, `Media` y `Premium`.

## 7. Logica de Busqueda

### 7.1 Matching
Para servicios, la coincidencia debe usar:
- `service_catalog.search_text`
- aliases normalizados de `service_aliases`
- `ILIKE` como fallback
- `pg_trgm` con threshold bajo, consistente con el buscador actual

### 7.2 Construccion de search_text
Concatenar en minusculas:
- categoria
- base_name
- display_name
- tier_code
- aliases del servicio

### 7.3 Ordenamiento
Prioridad sugerida:
1. Coincidencia exacta o substring directo
2. Coincidencia sobre alias
3. Similaridad trigram
4. updated_at desc

## 8. UI y Operacion

### 8.1 Buscador Principal Publico
- Extender [src/app/page.tsx](src/app/page.tsx) para consumir `search_catalog` en lugar de `getInventoryItems` cuando haya query.
- Los resultados deben renderizar servicios junto con llantas sin habilitar agregar a cotizacion.
- Un servicio debe mostrar: nombre, categoria, tier y precio final.

### 8.2 Dashboard
- Crear pantalla nueva de administracion de servicios.
- Debe permitir:
  - carga masiva inicial desde Excel
  - alta individual
  - edicion individual de precio base y manual_price
  - gestion de aliases
  - ajuste por tier A, AA y AAA por porcentaje y monto

## 9. Archivos Exactos a Crear o Modificar
Implementacion autorizada maxima: 5 archivos en una primera entrega tecnica.

Slice 1 recomendada:
1. Crear migracion SQL nueva en supabase/migrations/
2. Crear servicio nuevo [src/lib/services/catalog-search.ts](src/lib/services/catalog-search.ts)
3. Crear parser nuevo [src/lib/logic/service-excel-parser.ts](src/lib/logic/service-excel-parser.ts)
4. Modificar [src/app/page.tsx](src/app/page.tsx)
5. Modificar [PROYECTO.md](PROYECTO.md) solo si se cierra el sprint

Queda explicitamente fuera de la primera entrega:
- pantalla administrativa completa del dashboard
- CRUD visual completo de aliases
- importador UI final

## 10. Validacion Exacta Esperada

### 10.1 Validacion Tecnica Minima
- Ejecutar `npm run lint`

### 10.2 Validacion Funcional Minima
- Buscar un servicio por nombre exacto desde la home publica y obtener resultado.
- Buscar un servicio por sinonimo y obtener resultado.
- Buscar un servicio con typo leve y obtener resultado por fuzzy.
- Confirmar que el servicio no ofrece accion de agregar a cotizacion.
- Confirmar que el precio mostrado cambia al modificar la politica del tier correspondiente.

## 11. Riesgos Controlados
- No reutilizar inventory evita contaminar el dominio de llantas.
- Una RPC nueva reduce riesgo de regresion sobre la busqueda productiva existente.
- El importador se hace dedicado porque el parser actual esta acoplado a medidas de llanta.

## 12. Prompt Operativo Para Sofia
Trabaja sobre [context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md](context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md). Estado: draft validado por usuario. Objetivo: implementar slice 1 del catalogo de servicios buscable. Salida: migracion SQL, servicio de busqueda catalogada, parser de Excel de servicios y extension de la home publica para mostrar servicios sin habilitar cotizacion. Restricciones: maximo 5 archivos, no tocar flujo de cotizacion, no mezclar servicios en inventory. Archivo ancla: [src/lib/services/inventory.ts](src/lib/services/inventory.ts). Validacion: `npm run lint`.