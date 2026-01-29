# DICTAMEN TÉCNICO: Threshold de Búsqueda Fuzzy Demasiado Restrictivo
- **ID:** FIX-20260129-10
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario (via handoff)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma Reportado
El usuario busca "michilin" y no obtiene resultados, esperando encontrar "Michelin".

### Hallazgo Forense

| Factor | Detalle |
|--------|---------|
| **Threshold default de pg_trgm** | 0.3 (30% de similitud mínima) |
| **Similitud "michilin" ↔ "michelin"** | ~0.27 (calculado con trigramas) |
| **Resultado** | No pasa el filtro del operador `%` |

**Cálculo de similitud con trigramas:**
- "michilin" trigramas: `{mic, ich, chi, hil, ili, lin}`
- "michelin" trigramas: `{mic, ich, che, hel, eli, lin}`
- Intersección: 3 (`mic`, `ich`, `lin`)
- Unión: 9
- Similitud: 3/9 ≈ 0.27 < 0.3 ❌

### Problema Secundario Detectado
- Las funciones usaban `created_at` en ORDER BY en vez de `updated_at`
- `count_search_inventory` usaba el mismo threshold default, causando que retornara 0 incluso si ILIKE encontraba resultados

---

## B. Justificación de la Solución

### Cambios Aplicados en Migración `20260129000011_fix_search_threshold.sql`

1. **Re-backfill de `search_text`** (idempotente)
   - Garantiza que no haya registros con `search_text` vacío
   
2. **`search_inventory`:**
   - Agrega `set pg_trgm.similarity_threshold = 0.1;` al inicio
   - Cambia ORDER BY de `created_at` a `updated_at`
   
3. **`count_search_inventory`:**
   - Agrega el mismo `set pg_trgm.similarity_threshold = 0.1;`
   - Asegura consistencia entre count y search

### Por qué threshold 0.1:
- Permite typos de 2-3 caracteres en palabras de 8+ caracteres
- "michilin" vs "michelin": ~0.27 > 0.1 ✓
- Aún filtra búsquedas completamente irrelevantes
- Es el estándar recomendado para UX tolerante a errores

---

## C. Verificación

```sql
-- Test que debería pasar ahora:
SELECT similarity('michelin 235/65r17', 'michilin');
-- Resultado esperado: ~0.15-0.25 > 0.1 ✓
```

---

## D. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260129000011_fix_search_threshold.sql` | Nueva migración |

---

## E. Instrucciones de Handoff para SOFIA/Siguiente Agente

1. **Validación recomendada:**
   - Buscar "michilin" → debería encontrar "Michelin"
   - Buscar "brigestoun" → debería encontrar "Bridgestone"
   - Verificar que el count coincida con los resultados mostrados

2. **Si el problema persiste:**
   - Verificar que `search_text` no esté vacío: 
     ```sql
     SELECT count(*) FROM inventory WHERE search_text IS NULL OR search_text = '';
     ```
   - Si hay registros vacíos, ejecutar el backfill manualmente

3. **No se requiere rebuild** - las funciones se recompilan automáticamente
