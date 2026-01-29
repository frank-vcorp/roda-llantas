# SPEC-LOST-SALES-UI: Visualización de Demanda Insatisfecha

## 1. Objetivo
Visualizar los términos de búsqueda que no arrojaron resultados, agrupados por frecuencia, para que el dueño del negocio sepa qué comprar.

## 2. Datos (Existentes)
Tabla `lost_sales`:
- `id`, `query` (term), `created_at`...

## 3. Requerimiento de Base de Datos
Necesitamos una vista o función para agregar los datos:
- Agrupar por `lower(trim(query))` para unificar " 205 55 16 " con "205 55 16".
- Contar ocurrencias (`frequency`).
- Obtener fecha de última búsqueda (`last_seen`).

SQL Sugerido (View: `lost_sales_summary`):
```sql
CREATE OR REPLACE VIEW lost_sales_summary AS
SELECT 
  TRIM(LOWER(query)) as normalized_query,
  COUNT(*) as frequency,
  MAX(created_at) as last_seen
FROM lost_sales
GROUP BY TRIM(LOWER(query))
ORDER BY frequency DESC;
```

## 4. UI
- **Ruta**: `/dashboard/analytics/lost-sales`
- **Componentes**:
    - **KPIs Header**: "Total Búsquedas Fallidas" | "Término Top #1"
    - **Tabla Principal**:
        - Columnas: "Término de Búsqueda", "Frecuencia", "Última Vez", "Acción"
        - Acción: Un botón "🔍 Buscar en Google" o "📋 Copiar" para facilitar al dueño buscar el proveedor.

## 5. Implementación
1. Crear migración para la Vista.
2. Crear Server Action `getLostSalesStats()`.
3. Crear Page UI.
