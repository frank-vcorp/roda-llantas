# SPEC-PURCHASES: Registro de Compras (Entradas de Stock)

## 1. Alcance
Permitir registrar entradas de mercancía mediante facturas de proveedores, aumentando el stock e historial de precios.

## 2. Base de Datos
### Tablas
**`purchases`**
- `id` (uuid, pk)
- `provider_name` (text) — Simplificado (sin tabla de proveedores por ahora)
- `invoice_number` (text)
- `purchase_date` (date)
- `total_amount` (numeric)
- `created_at` (timestamp, now)

**`purchase_items`**
- `id` (uuid, pk)
- `purchase_id` (uuid, fk)
- `product_id` (uuid, fk)
- `quantity` (int)
- `unit_cost` (numeric)
- `total_cost` (numeric)

### 3. Lógica Transaccional (RPC)
Función `register_purchase(json_input)`
- **Input JSON**: `{ provider, invoice, date, total, items: [{ productId, qty, cost }] }`
- **Operaciones**:
    1. Insertar `purchases`.
    2. Iterar items:
        - Insertar `purchase_items`.
        - **UPDATE products**:
            - `stock = stock + qty`
            - `cost_price = unit_cost` (Actualizar costo al último registrado)
            - `updated_at = now()`

## 4. UI
- **Ruta**: `/dashboard/inventory/purchases/new`
- **Formulario**:
    - Datos Generales (Proveedor, Factura).
    - **Grid de Items**:
        - Buscador de Producto (Reusar componente async o combobox).
        - Inputs: Cantidad, Costo Unitario.
        - Botón "Agregar Fila".
    - Resumen Total (Calculado en cliente).
    - Botón "Guardar Compra".

## 5. Menú
- Agregar link en Sidebar bajo Inventario: "Registrar Compra".
