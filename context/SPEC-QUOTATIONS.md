# 🏗️ SPEC-QUOTATIONS: Módulo de Cotizaciones ("Caja Registradora")

**ID:** ARCH-20260129-QUOTES
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Permitir al usuario seleccionar llantas del inventario y generar una cotización PDF simple para compartir con un cliente. Flujo similar a un "Carrito de Compras" o POS ligero.

## 2. 🚫 Límites (Protocolo Anti-Alucinación)
- **NO** implementar módulo de Clientes (CRM). El cliente es solo un campo de texto en la cotización.
- **NO** implementar procesamiento de pagos.
- **NO** implementar envío de correos. Solo generar PDF/Link.
- **NO** agregar campos extras como dirección, RFC, ciudad, etc.

## 3. 💾 Modelo de Datos (Supabase)

### Tabla: `quotations` (Cabecera)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `profile_id` | uuid | FK -> auth.users |
| `customer_name` | text | Nombre del cliente (ej. "Juan Pérez") |
| `customer_phone` | text | Opcional (ej. "555-1234") |
| `discount_type` | text | 'percentage' o 'amount' |
| `discount_value` | numeric | Valor del descuento |
| `total_amount` | numeric | Suma total (Subtotal - Descuento) |
| `status` | text | 'draft' (borrador), 'completed' (generada) |
| `created_at` | timestamptz | Fecha |

### Tabla: `quotation_items` (Detalle)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `quotation_id` | uuid | FK -> quotations |
| `inventory_id` | uuid | FK -> inventory |
| `quantity` | int | Cantidad cotizada |
| `unit_price` | numeric | Precio al momento de cotizar (Snapshot) |
| `subtotal` | numeric | quantity * unit_price |

## 4. 🧠 Lógica de Estado (Frontend)

### Contexto Global: `QuoteContext`
Necesitamos persistir la selección mientras navega.
- `items`: Map<inventory_id, quantity>
- `addItem(item)`
- `removeItem(itemId)`
- `clearQuote()`

## 5. 🖥️ Interfaz de Usuario (UI)

### 5.1 Selección en Inventario (`/dashboard/inventory`)
- Agregar **Checkboxes** a la izquierda de la tabla.
- **Barra Flotante (Sticky Bottom)**:
    - Aparece cuando `selectedCount > 0`.
    - Texto: "3 productos seleccionados".
    - Total estimado: "$15,400".
    - Botón: **"Ir a Cotizar"** (Navega a `/dashboard/quotes/new`).

### 5.2 Pantalla de Resumen (`/dashboard/quotes/new`)
- **Lista de items**:
    - Muestra descripción, precio unitario.
    - **Input de Cantidad**: Para ajustar si quiere 4 llantas en vez de 1.
    - Botón "Eliminar".
- **Formulario Cliente**:
    - Input: Nombre del Cliente.
    - Input: Teléfono (Opcional).
- **Totales**: Subtotal, Total (Simple, sin impuestos complejos por ahora).
- **Botón Principal**: "Generar Cotización" (Guarda en DB -> Redirige a Vista PDF).

### 5.3 Vista de Cotización (`/dashboard/quotes/[id]`)
- Renderiza el documento final.
- **Botón**: "Descargar PDF" (Usar `react-to-print` o librería ligera).
- **Botón**: "Nueva Cotización" (Limpia estado y va al inicio).

### 5.4 Historial de Cotizaciones (`/dashboard/quotes/page.tsx`)
- **Tabla Simple**:
    - Columnas: Folio (últimos 8 chars del ID), Fecha (dd/MM/yyyy HH:mm), Cliente, Total (COP).
    - Acciones:
        - "Ver" (Icono Ojo) -> Va a `/dashboard/quotes/[id]`.
        - "Eliminar" (Icono Basura) -> Server Action `deleteQuotation`.
- **KPIs (Header)**:
    - Tarjeta simple: "Cotizaciones Hoy" (Count).
    - Tarjeta simple: "Monto Cotizado Hoy" (Sum).
- **Empty State**: Si no hay cotizaciones, mostrar mensaje amigable y botón "Nueva Cotización".

## 6. 📋 Plan de Implementación (Sofia)

1.  **DB**: Migración `006_quotations.sql`.
2.  **State**: Crear `QuoteProvider` y envolver el Dashboard.
3.  **UI Inventario**: Modificar `columns.tsx` para agregar checkbox y conectar al Provider.
4.  **UI Resumen**: Crear página `quotes/new`.
5.  **UI Final**: Crear página `quotes/[id]` con diseño imprimible.
6.  **UI Historial**: Crear página `quotes/page.tsx` con tabla de historial y acción de eliminar.
