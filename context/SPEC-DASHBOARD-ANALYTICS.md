# 📊 SPEC-DASHBOARD: Panel de Control (Analytics)

**ID:** ARCH-20260129-DASHBOARD
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Transformar la pantalla principal (`/dashboard`) en un **Tablero de Mando** que ofrezca al usuario una visión inmediata del estado de su negocio (ventas potenciales, demanda insatisfecha y alertas de inventario).

## 2. 🧠 Métricas y KPIs

### 2.1 Resumen Diario (Cards Superiores)
*   **Cotizaciones del Día**: Cantidad (N) y Monto ($).
    *   *Fuente*: Tabla `quotations`.
    *   *Valor*: Permite saber si el día está "movido".
*   **Demanda Insatisfecha (Hoy)**: Cantidad de búsquedas sin resultados.
    *   *Fuente*: Tabla `lost_sales`.
    *   *Valor*: Alerta inmediata de clientes que no encuentran lo que buscan.
*   **Alertas de Stock**: Cantidad de productos con Stock Bajo (<= 4).
    *   *Fuente*: Tabla `inventory`.

### 2.2 Listas de Actividad (Secciones Inferiores)
*   **Búsquedas Fallidas Recientes**: Top 5 cosas que buscaron hoy y no encontraron.
    *   *Actionable*: Si veo "Pirelli" 5 veces, llamo al proveedor.
*   **Últimas Cotizaciones**: Lista rápida de las últimas 5 generadas.
    *   *Shortcut*: Botón "Ver" para ir rápido.

## 3. 📋 Plan de Implementación (Sofia)

### 3.1 Backend (`src/lib/services/dashboard.ts`)
function `getDashboardMetrics()`:
*   Debe ejecutarse en paralelo (`Promise.all`).
*   Queries eficientes (usando `count` y `sum`).
*   Rango de tiempo: `startOfDay` a `endOfDay` (hora local o UTC según config, asumimos UTC por ahora para simplificar).

### 3.2 UI (`src/app/dashboard/page.tsx`)
Reemplazar el diseño actual de "Link Cards" por:
1.  **Header**: "Panel de Control".
2.  **Grid de KPIs**: 3 tarjetas (Cotizado, Ventas Perdidas, Stock Bajo).
3.  **Grid de Accesos Rápidos**: Botones grandes para "Nueva Cotización", "Ver Inventario", "Importar".
4.  **Grid de Tablas**:
    *   Columna Izq: Últimas Cotizaciones.
    *   Columna Der: Ventas Perdidas (Top Queries).

Tech Stack:
- `lucide-react` para iconos.
- `tremor` (opcional, pero para MVP usamos standard shadcn Cards).
