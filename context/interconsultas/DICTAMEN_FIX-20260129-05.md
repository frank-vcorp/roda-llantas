# DICTAMEN TÉCNICO: Columnas faltantes en pricing_rules

- **ID:** FIX-20260129-05
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario directo
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

| Aspecto | Detalle |
|---------|---------|
| **Síntoma** | Error toast: `Could not find the 'is_active' column of 'pricing_rules' in the schema cache` |
| **Hallazgo Forense** | La migración 003 usó `CREATE TABLE IF NOT EXISTS`, pero la tabla ya existía de un intento previo SIN las columnas `is_active` y `priority` |
| **Causa** | Script anterior (001) posiblemente creó la tabla con estructura incompleta. El `IF NOT EXISTS` ignoró la nueva definición completa |
| **Evidencia** | `NOTICE (42P07): relation "pricing_rules" already exists, skipping` |

## B. Justificación de la Solución

Se creó `20260129000004_fix_pricing_columns.sql` que:

1. **`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`** - Añade las columnas faltantes de forma idempotente (seguro ejecutar múltiples veces)
2. **`NOTIFY pgrst, 'reload schema'`** - Fuerza la recarga del caché de PostgREST para que reconozca las nuevas columnas inmediatamente

### Columnas añadidas:
| Columna | Tipo | Default |
|---------|------|---------|
| `is_active` | BOOLEAN | TRUE |
| `priority` | INTEGER | 1 |

## C. Instrucciones de Ejecución

Ejecuta en la terminal:

```bash
npx supabase db push
```

**Verificación post-ejecución:**
1. Refresca la página de precios
2. Intenta guardar una regla nuevamente
3. El error de caché debería desaparecer

---

**Tiempo de resolución:** ~5 minutos
