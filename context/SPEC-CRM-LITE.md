# 📇 SPEC-CRM-LITE: Gestión de Clientes

**ID:** ARCH-20260129-CRM
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Centralizar la información de los clientes para agilizar el proceso de cotización y sentar las bases para un historial de ventas por cliente. Evitar la re-escritura manual de nombres y teléfonos.

## 2. 💾 Modelo de Datos (Supabase)

### Tabla: `customers`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `profile_id` | uuid | FK -> auth.users |
| `full_name` | text | Nombre completo (Buscable) |
| `phone` | text | Teléfono de contacto |
| `email` | text | Opcional |
| `tax_id` | text | Opcional (RFC/NIT) |
| `created_at` | timestamptz | Fecha de registro |

### Modificación a: `quotations`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `customer_id` | uuid | FK -> customers (Opcional/Nullable) |

> **Nota de Migración**: Las cotizaciones antiguas tendrán `customer_id` NULL, pero conservan `customer_name` (texto). Las nuevas intentarán linkear al ID.

## 3. 🧠 Lógica de Negocio

### 3.1 Creación desde Cotización (Inline)
El usuario no quiere salir de la pantalla de cotización para crear un cliente.
- El input de cliente será un **Combobox** (Autocomplete).
- Si el cliente no existe, opción: *"Crear 'Juan Perez'"*.
- Al guardar, se inserta en `customers` y se usa ese ID para la cotización.

## 4. 📋 Plan de Implementación (Sofia)

### 4.1 Base de Datos
- Migración `013_crm_customers.sql`.
    - Create table `customers`.
    - Add column `customer_id` to `quotations`.
    - Enable RLS for `customers`.

### 4.2 Backend Actions
- `searchCustomers(query)`: Para el autocomplete.
- `createCustomer(data)`: Server action.

### 4.3 UI Component (`Quotations/New`)
- Reemplazar el input simple de nombre por un componente `CustomerCombobox`.
- Propuesta de UX: `shadcn/ui` Command + Popover.

