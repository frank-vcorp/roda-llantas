# SPEC-009: Conversión de Cotización a Venta (Salida de Stock)

## 1. Resumen
Implementar la funcionalidad para convertir una Cotización aprobada en una Venta en firme. Esto implica registrar la transacción financiera, descontar el inventario (stock) de manera atómica y cerrar la cotización.

## 2. Modelo de Datos
### 2.1 Tablas Nuevas
**`sales`**
- `id` (uuid, pk)
- `quotation_id` (uuid, fk -> quotations, nullable)
- `customer_id` (uuid, fk -> customers, nullable)
- `total_amount` (numeric)
- `status` (text: 'completed', 'cancelled')
- `created_at` (timestamp, default now)

**`sale_items`**
- `id` (uuid, pk)
- `sale_id` (uuid, fk -> sales)
- `product_id` (uuid, fk -> products)
- `quantity` (int)
- `unit_price` (numeric) — Snapshot del precio al momento de la venta
- `total_price` (numeric)

### 2.2 Modificaciones
- **`quotations`**: Agregar estado status='sold' si no existe.
- **`products`**: El campo `stock` ya existe, se debe decrementar.

## 3. Lógica de Negocio (Server Actions)
### Acción: `convertQuotationToSale(quotationId)`
1. **Validación**:
   - Obtener cotización e items.
   - Verificar si ya fue vendida.
   - **Check de Stock**: Verificar si hay suficiente stock para TODOS los items. Si no, lanzar error.
2. **Transacción (Atomic)**:
   - Crear registro en `sales`.
   - Copiar items de `quotation_items` a `sale_items`.
   - Decrementar `products.stock` por cada item.
   - Actualizar `quotations.status` = 'sold'.
3. **Revalidación**:
   - `revalidatePath('/dashboard/quotations')`
   - `revalidatePath('/dashboard/inventory')`

## 4. UI / UX
- **Ubicación**: Página de Detalle de Cotización (`/dashboard/quotations/[id]`).
- **Componente**: Botón "✅ Confirmar Venta".
- **Interacción**:
   - Click -> Confirm dialog ("¿Confirmar venta y descontar inventario?").
   - Loading state.
   - Success -> Redirect to `/dashboard/sales/[id]` (o mostrar toast y reload).
   - Error -> Mostrar alerta (ej: "Stock insuficiente para el producto X").

## 5. Criterios de Aceptación
- [ ] Al confirmar venta, se crea registro en `sales`.
- [ ] El stock de los productos disminuye correctamente.
- [ ] La cotización cambia de estado y no se puede editar/vender de nuevo.
- [ ] Si falta stock, la venta falla y no se hacen cambios.
