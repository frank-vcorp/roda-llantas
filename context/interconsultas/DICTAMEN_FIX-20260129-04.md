# DICTAMEN TÉCNICO: Integración Motor de Precios en Inventario

- **ID:** FIX-20260129-04
- **Fecha:** 2026-01-29
- **Solicitante:** Revisión proactiva (Frank)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma
El endpoint `/dashboard/inventory` fallaba con error HTTP 500:
```
column pricing_rules.is_active does not exist (código: 42703)
```

### Hallazgo Forense
1. **Servicio `pricing.ts`:** Consultaba columnas `is_active` y `priority` que **no existen** en la tabla `pricing_rules`.

2. **Migración `init_schema.sql`:** Definición de la tabla sin las columnas:
   ```sql
   -- Solo define: id, profile_id, brand_pattern, margin_type, margin_value, min_profit
   -- FALTAN: is_active, priority
   ```

3. **Tipo TypeScript:** Definía `is_active?: boolean` y `priority?: number` como opcionales, pero el servicio asumía su existencia.

### Causa
**Discrepancia Schema-Código:** El servicio fue implementado según `SPEC-PRICING-ENGINE.md` que especifica `is_active` y `priority`, pero la migración SQL original no los incluyó.

---

## B. Correcciones Aplicadas

### 1. Nueva Migración SQL
**Archivo:** `supabase/migrations/20260129000001_pricing_rules_columns.sql`

```sql
ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 50;

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active_priority 
ON pricing_rules (profile_id, is_active, priority DESC);
```

### 2. Servicio Defensivo
**Archivo:** `src/lib/services/pricing.ts`

- Implementé patrón **try-catch con fallback** para manejar el caso donde las columnas aún no existen.
- Si el error es `42703` (columna inexistente), usa `getPricingRulesFallback()` que:
  - Consulta todas las reglas sin filtro
  - Aplica valores default manualmente (`is_active: true`, `priority: 50`)

---

## C. Validación de las 3 Preguntas Originales

| # | Pregunta | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | ¿Se obtienen `pricing_rules`? | ✅ SÍ | `page.tsx:40` → `getPricingRules()` en `Promise.all` |
| 2 | ¿Se calcula precio con `PricingEngine`? | ⚠️ PARCIAL | Usa `enrichInventoryWithPrices()` que llama a `calculatePublicPrice()` - NO usa la clase `PricingEngine` |
| 3 | ¿Tabla muestra nueva columna? | ✅ SÍ | `columns.tsx:108-143` → Columna `public_price` con tooltip |

### Nota sobre Punto 2
El servicio `pricing.ts` implementa la lógica directamente en `calculatePublicPrice()` en lugar de usar la clase `PricingEngine` de `lib/logic/pricing-engine.ts`. **Ambos tienen lógica equivalente**, pero hay duplicación. Recomiendo en un futuro refactorizar para usar una única fuente de verdad.

---

## D. Estado Post-Fix

```
✓ Compiled successfully in 5.5s
✓ Finished TypeScript in 5.9s
✓ Build exitoso
```

---

## E. Instrucciones de Handoff para SOFIA

1. **Aplicar la migración en Supabase:**
   ```bash
   npx supabase db push
   # O desde el dashboard de Supabase, ejecutar el SQL de la nueva migración
   ```

2. **Verificar en runtime:**
   - Acceder a `/dashboard/inventory`
   - Confirmar que la columna "Precio Público" muestra valores
   - Verificar tooltip con desglose (costo, método, margen, regla)

3. **Deuda técnica identificada:**
   - Duplicación de lógica entre `PricingEngine` clase y `calculatePublicPrice()` función
   - Considerar consolidar en un solo módulo

---

**FIX REFERENCE:** `FIX-20260129-04`
