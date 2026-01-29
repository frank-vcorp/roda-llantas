# 🧬 SPEC-DATA-MODEL: Diccionario de Datos y Entidades (v1.0)

> **ID:** ARCH-20260129-01
> **Estado:** Aprobado
> **Referencia:** Documento de Especificaciones Técnicas

Este documento actúa como la **Fuente de Verdad Única** para el modelo de datos, nombres de variables y tipos en todo el proyecto (Frontend, Backend, DB).

---

## 1. 🗄️ Modelo de Base de Datos (Supabase / PostgreSQL)

### 1.1 `profiles` (Configuración de Negocio)
Extensión de la tabla `auth.users`. Un registro por llantera (SaaS Tenant).

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | UUID (PK) | Fk a `auth.users.id`. | `550e8400...` |
| `business_name` | TEXT | Nombre comercial visible. | "Llantera El Rayo" |
| `slug` | TEXT | Identificador único URL-friendly. | "llantera-el-rayo" |
| `logo_url` | TEXT | URL del logo en Storage. | `https://.../logo.png` |
| `whatsapp_number` | TEXT | Número para recibir pedidos (formato E.164). | "+525512345678" |
| `brand_colors` | JSONB | Paleta de colores. | `{"primary": "#FF0000", "secondary": "#000000"}` |
| `warranty_text` | TEXT | Texto legal default para cotizaciones. | "3 meses contra defectos..." |
| `inbound_email` | TEXT | Slug para recibir correos. | "elrayo" (para elrayo@inbound...) |
| `tier` | TEXT | Nivel de suscripción. | "free", "pro" |
| `created_at` | TIMESTAMPTZ | Fecha de registro. | |

### 1.2 `inventory` (Inventario de Productos)
Catálogo unificado de llantas.

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | UUID (PK) | Identificador único del producto. | |
| `profile_id` | UUID (FK) | Dueño del inventario. | |
| `sku` | TEXT | Identificador interno o del proveedor (opcional). | "MICH-2055516" |
| `brand` | TEXT | Marca normalizada (Uppercased). | "MICHELIN" |
| `model` | TEXT | Modelo de la llanta. | "PRIMACY 4" |
| `medida_full` | TEXT | String completo de la medida. | "205/55 R16" |
| `width` | INTEGER | Ancho en mm. | `205` |
| `aspect_ratio` | INTEGER | Perfil (%). | `55` |
| `rim` | INTEGER | Rin (pulgadas). | `16` |
| `load_index` | TEXT | Índice de carga/velocidad. | "91V" |
| `cost_price` | NUMERIC | Precio de costo (sin IVA). | `1500.00` |
| `stock` | INTEGER | Cantidad disponible. | `4` |
| `stock_location` | TEXT | Ubicación física (opcional). | "Bodega A" |
| `updated_at` | TIMESTAMPTZ | Última sincronización. | |

### 1.3 `pricing_rules` (Reglas de Margen)
Motor de precios dinámico.

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | UUID (PK) | | |
| `profile_id` | UUID (FK) | Configuración del usuario. | |
| `brand_pattern` | TEXT | Marca a la que aplica ("*" para default). | "PIRELLI" |
| `margin_type` | TEXT | "percentage" o "fixed". | "percentage" |
| `margin_value` | NUMERIC | Valor del margen. | `1.30` (30% ganancia) |
| `min_profit` | NUMERIC | Ganancia mínima asegurada (opcional). | `200.00` |

### 1.4 `quotes` (Cotizaciones)
Historial de "carritos" generados.

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | UUID (PK) | Public ID para compartir. | |
| `profile_id` | UUID (FK) | Emisor. | |
| `client_name` | TEXT | Nombre del cliente prospecto. | "Juan Pérez" |
| `items_snapshot` | JSONB | Copia de productos y precios al momento. | `[{ "id": "...", "price": 1950, "qty": 2 }]` |
| `total_amount` | NUMERIC | Total cotizado. | `3900.00` |
| `expires_at` | TIMESTAMPTZ | Fecha expiración (Próximo Domingo). | |

### 1.5 `lost_sales` (Ventas Perdidas / Logs)
Inteligencia de negocio sobre demanda no atendida.

| Columna | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `id` | UUID (PK) | | |
| `profile_id` | UUID (FK) | | |
| `search_term` | TEXT | Lo que buscó el usuario. | "295/35 R20" |
| `filters` | JSONB | Filtros aplicados. | `{"brand": "TOYO"}` |
| `result_count` | INTEGER | Cuántos resultados obtuvo (generalmente 0). | `0` |
| `created_at` | TIMESTAMPTZ | | |

---

## 2. 🔢 Variables Globales y Constantes

### Lógica de Negocio
```typescript
export const CONSTANTS = {
  // Configuración de expiración de cotizaciones
  QUOTE_EXPIRATION_DAYS: 7, // Días default si no es "próximo domingo"
  QUOTE_EXPIRATION_STRATEGY: 'NEXT_SUNDAY', 

  // Márgenes por defecto
  DEFAULT_MARGIN_PERCENTAGE: 1.25, // 25%
  
  // Paginación
  ITEMS_PER_PAGE: 20,
};
```

### Expresiones Regulares (Regex)
```typescript
export const REGEX = {
  // Parsea: 205/55R16, 205-55-16, 205 55 16
  TIRE_MEASURE: /^(\d{3})[\/\-\s]*(\d{2})[\/\-\s]*[RZr]?\s*(\d{2})$/i,
  
  // Validación de Email simple
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
```

---

## 3. 🏷️ Tipos TypeScript Principales (Interfaces)

```typescript
// Base Types
export type UUID = string;

// Entidad: Producto
export interface Product {
  id: UUID;
  profile_id: UUID;
  brand: string;
  model: string;
  measure: {
    full: string;
    width: number;
    aspect_ratio: number;
    rim: number;
  };
  price: {
    cost: number;        // Solo visible para admin
    retail: number;      // Calculado (cost * margin)
    currency: 'MXN' | 'USD';
  };
  stock: number;
}

// Entidad: Perfil de Negocio
export interface UserProfile {
  id: UUID;
  businessName: string;
  settings: {
    colors: { primary: string; secondary: string };
    whatsapp: string;
    logo?: string;
  };
}
```
