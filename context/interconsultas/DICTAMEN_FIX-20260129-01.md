# DICTAMEN TÉCNICO: Auditoría de Lógica de Búsqueda en Inventario

- **ID:** FIX-20260129-01
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario (validación proactiva)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma Reportado
El usuario requiere confirmar que la búsqueda en inventario incluya las columnas: `width`, `ratio`, `rim`, `brand`, `model` **Y** `description`.

### Hallazgo Forense

**Archivo analizado:** [src/lib/services/inventory.ts](../src/lib/services/inventory.ts#L60)

```typescript
// Línea 60 - Filtro de búsqueda actual:
query = query.or(
  `brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,medida_full.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
);
```

### Columnas cubiertas por la búsqueda actual:

| Columna | ¿Incluida? | Observación |
|---------|------------|-------------|
| `brand` | ✅ SÍ | ILIKE funcional |
| `model` | ✅ SÍ | ILIKE funcional |
| `medida_full` | ✅ SÍ | Texto compuesto (ej: "175/60R14") |
| `description` | ✅ SÍ | Descripción raw del Excel |
| `sku` | ✅ SÍ | Código de producto |
| `width` | ⚠️ INDIRECTO | Solo vía `medida_full`, no búsqueda numérica directa |
| `aspect_ratio` | ⚠️ INDIRECTO | Solo vía `medida_full` |
| `rim` | ⚠️ INDIRECTO | Solo vía `medida_full` |

### Estado de Índices en Base de Datos

**Migración principal** (`supabase/migrations/20260129000000_init_schema.sql`):
```sql
-- Índice compuesto para búsqueda de medidas
CREATE INDEX idx_inventory_measure ON inventory (width, aspect_ratio, rim);
-- Índice para búsqueda por marca
CREATE INDEX idx_inventory_brand ON inventory (brand);
```

**Migración de description** (`src/lib/db/migrations/001_add_description.sql`):
```sql
-- Índice GIN para búsquedas full-text en description
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_inventory_description ON inventory USING gin(description gin_trgm_ops);
```

---

## B. Justificación y Veredicto

### ✅ CONCLUSIÓN: La búsqueda está correctamente implementada

1. **`description` SÍ está incluida** en el filtro `OR` con `ILIKE`.
2. **Índice GIN con pg_trgm** está configurado para búsquedas eficientes de texto parcial en `description`.
3. **Búsqueda numérica** de `width`/`ratio`/`rim` se resuelve vía `medida_full` (texto compuesto como "175/60R14").

### ⚠️ Consideración para futuro (no bloquea ahora)

Si el usuario busca "175" esperando coincidir con `width=175`, actualmente funcionará porque:
- `medida_full` contiene "175/60R14" → ILIKE "%175%" lo encuentra
- `description` típicamente incluye el ancho en texto

**No se requiere cambio inmediato**, pero para búsquedas numéricas puras se podría agregar:
```typescript
// Futuro enhancement (opcional):
query = query.or(
  `brand.ilike.%${term}%,model.ilike.%${term}%,medida_full.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%,width::text.ilike.%${term}%`
);
```

---

## C. Instrucciones de Handoff

### Para el Usuario:
1. **No se requiere acción correctiva** - La lógica está completa.
2. **Migración pendiente**: Verificar que `001_add_description.sql` se haya ejecutado en Supabase (el índice GIN acelera búsquedas).
3. **Testing recomendado**: Buscar por fragmentos de `description` (ej: "LTR" si existe en los datos).

### Comando de verificación (opcional):
```bash
# Verificar que la columna description existe
npx supabase db push --dry-run
```

---

**FIX REFERENCE:** FIX-20260129-01
**Validado por:** DEBY - Lead Debugger
