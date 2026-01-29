# 🏗️ SPEC-PRICING-ENGINE: Motor de Precios y Reglas de Negocio

**ID:** ARCH-20260129-PRICING
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Implementar un sistema flexible para calcular el **Precio de Venta al Público** basado en el **Costo** del inventario, aplicando reglas de margen dinámicas configuables por el usuario.

## 2. 🧠 Lógica de Negocio (The Brain)

### Fórmula Maestra
$$
PrecioVenta = (Costo \times (1 + \frac{Margen}{100})) + Impuestos
$$

### Jerarquía de Reglas (Orden de prioridad)
1.  **Precio Manual (`manual_price`)**: Si existe en el producto, GANA. (Para ofertas o liquidaciones).
2.  **Regla por Marca (`brand`)**: Ejemplo: "Michelin" tiene 15% de margen.
3.  **Regla Global (Default)**: Si no coincide nada, se usa el margen general (ej. 30%).

### Redondeo "Psicológico" (Opcional - Fase 2)
- Ajustar precios a terminar en `.00` o `.90`.

## 3. 💾 Modelo de Datos (Supabase)

### Nueva Tabla: `pricing_rules`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `name` | text | Nombre de la regla (ej. "Margen Michelin") |
| `brand_pattern` | text | Patrón de marca (ILIKE). Null = Todas. |
| `margin_percentage`| numeric | Porcentaje de ganancia (ej. 30.0) |
| `priority` | int | 1 (Baja) a 100 (Alta). Mayor gana. |
| `is_active` | bool | Para apagar reglas sin borrarlas. |

### Modificación Tabla: `inventory`
- `manual_price` (numeric, nullable): Precio fijo que ignora reglas.

## 4. 🔌 API / Services Layer

### `PricingService`
- `calculatePrice(item: InventoryItem, rules: PricingRule[]): number`
- `getEffectivePrice(item: InventoryItem): { price: number, is_manual: boolean, rule_applied: string }`

## 5. 🖥️ Interfaz de Usuario (UI)

### 5.1 Panel de Configuración (`/dashboard/settings/pricing`)
- Tabla CRUD de reglas.
- Input para "Margen Global por Defecto".

### 5.2 Inventario (`/dashboard/inventory`)
- Nueva columna: **Precio Público**
- Visualización:
    - Si es calculado: Texto normal.
    - Si es manual: Badge "OFERTA" o color distintivo.
    - Tooltip mostrando el desglose: "Costo $100 + 30% (Regla General)".

## 6. 📋 Plan de Implementación (Sofia)

1.  **DB**: Crear tabla `pricing_rules` y policies RLS.
2.  **DB**: Agregar columna `manual_price` a `inventory`.
3.  **Backend**: Crear `PricingService` con lógica de cálculo.
4.  **Frontend**: Crear página de Settings para editar reglas.
5.  **Frontend**: Actualizar `columns.tsx` en inventario para mostrar precio calculado.
