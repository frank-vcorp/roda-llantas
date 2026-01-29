# SPEC: Visualización y Búsqueda de Inventario (Sprint 3)

**ID:** ARCH-20260129-VIEW
**Ref:** Documento de Especificaciones Técnicas Llantera.md (Sección 3.B)
**Estado:** Draft

## 🎯 Objetivo
Transformar la lista plana de inventario en un catálogo navegable de alto rendimiento, permitiendo búsquedas rápidas ("Fuzzy") y filtrado por facetas (Marca, Medida) sobre los ~1,000 items ingestados.

## 📱 UI/UX (Requerimientos)
1.  **Barra de Búsqueda Global:**
    *   Debe aceptar entradas flexibles: "185 60 14", "185/60R14", "Tornel", "Camion".
    *   Debe actualizar la tabla en tiempo real (debounce 300ms) o al presionar Enter.

2.  **Filtros de Facetas (Sidebar o Dropdowns):**
    *   **Marca:** Lista de marcas disponibles con contador de stock (ej. TORNEL (150)).
    *   **Rin:** Filtro rápido por diámetro (13, 14, 15, 16, 22.5, etc.).

3.  **Tabla de Resultados:**
    *   Columnas clave: SKU (oculto en móvil?), Marca, Modelo, Medida, *Precio (Privado)*, Stock, Acciones.
    *   **Paginación:** Server-side pagination (limit 20/50) para performance.
    *   **Ordenamiento:** Por default "Más recientes" o "Mayor Stock".

## ⚙️ Arquitectura Técnica

### 1. Base de Datos (Supabase)
*   La tabla `inventory` ya existe.
*   Se requiere crear índices si la búsqueda es lenta, pero con 1,000 items un `ilike` simple funciona bien.
*   Para "Fuzzy Search" avanzado, podríamos usar `pg_trgm` en el futuro, pero por ahora un filtro `OR` en columnas clave es suficiente.

```sql
-- Query conceptual
SELECT * FROM inventory 
WHERE 
  to_tsvector(brand || ' ' || model || ' ' || medida_full) @@ to_tsquery('query')
  OR 
  brand ILIKE '%query%'
ORDER BY stock DESC
LIMIT 50 OFFSET 0;
```

### 2. Server Actions (`getInventoryItems`)
*   Refactorizar `getInventoryItems` para aceptar parámetros:
    *   `page`: number
    *   `limit`: number
    *   `search`: string (opcional)
    *   `filters`: { brand?: string[], rim?: number[] }

### 3. Componente Cliente (`InventoryTable`)
*   Mantener el estado de la búsqueda en la URL (`?q=185&page=1`) para permitir compartir links.
*   Usar `useRouter` y `useSearchParams` de Next.js para la navegación.

## 🧪 Criterios de Aceptación (Soft Gates)
1.  [ ] Buscar "175" devuelve todas las llantas ancho 175.
2.  [ ] Buscar "Tornel" devuelve solo llantas Tornel.
3.  [ ] La paginación funciona correctamente (no carga los 1,000 items de golpe).
4.  [ ] URL se actualiza al filtrar (permite F5 sin perder búsqueda).
