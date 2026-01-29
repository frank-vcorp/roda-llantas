# DICTAMEN TÉCNICO: Error "column created_at does not exist" en búsqueda

- **ID:** FIX-20260129-09
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario (reporte directo)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma
Al buscar en el inventario, el sistema retornaba:
```
Error: Search failed: column "created_at" does not exist
```

### Hallazgo Forense
1. La función RPC `search_inventory` (migración `20260129000008_smart_search.sql`) usaba `created_at` en el ORDER BY:
   ```sql
   order by 
     case when p_query = '' then created_at end desc,
     similarity(search_text, lower(p_query)) desc,
     created_at desc
   ```

2. La tabla `inventory` definida en `20260129000000_init_schema.sql` **NO tiene** columna `created_at`, solo tiene `updated_at`:
   ```sql
   create table inventory (
     ...
     updated_at timestamptz default now()
   );
   ```

### Causa
Inconsistencia entre el código de la función RPC y el esquema real de la tabla. El desarrollador asumió que existía `created_at` cuando en realidad la tabla solo tiene `updated_at`.

---

## B. Justificación de la Solución

### Opción evaluada pero descartada
- Agregar columna `created_at` a la tabla `inventory`: Requiere backfill de datos y más cambios en cascada.

### Solución aplicada
Se creó la migración `20260129000010_fix_search_created_at.sql` que recrea la función `search_inventory` reemplazando todas las referencias a `created_at` por `updated_at`:

```sql
order by 
  case when p_query = '' then updated_at end desc,
  similarity(search_text, lower(p_query)) desc,
  updated_at desc
```

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260129000010_fix_search_created_at.sql` | Nueva migración con función corregida |

---

## C. Validación

- [x] Migración aplicada exitosamente con `supabase db push`
- [x] Build de Next.js compila sin errores
- [x] Marca de agua `FIX-20260129-09` insertada en el comentario de la función

---

## D. Instrucciones de Handoff para SOFIA

1. **Probar manualmente** la búsqueda en `/dashboard/inventory` con queries vacíos y con texto.
2. **Confirmar** que los resultados se ordenan correctamente por `updated_at`.
3. Si se requiere una columna `created_at` real en el futuro, crear migración separada para agregarla con `DEFAULT now()`.
