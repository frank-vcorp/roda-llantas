# 📉 SPEC-LOST-SALES: Registro de Ventas Perdidas

**ID:** ARCH-20260129-LOST-SALES
**Estado:** [Draft]
**Autor:** INTEGRA - Arquitecto

## 1. 🎯 Objetivo
Capturar la demanda insatisfecha. Cuando un usuario busca un producto en el inventario y no obtiene resultados, debemos registrar esa búsqueda para entender qué productos están pidiendo los clientes que no tenemos en stock.

## 2. 💾 Modelo de Datos (Supabase)

### Tabla: `lost_sales`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `profile_id` | uuid | FK -> auth.users (dueño del negocio) |
| `query` | text | El texto que buscó el usuario (ej: "agricola 22") |
| `results_count` | int | Cuántos resultados obtuvo (generalmente 0, pero útil si son pocos) |
| `created_at` | timestamptz | Fecha y hora del evento |
| `ip_address` | text | Opcional (para auditoría) |

## 3. 🧠 Lógica de Negocio

### 3.1 Momento del Registro
La captura debe ocurrir en el servidor, dentro de `src/lib/services/inventory.ts`, inmediatamente después de obtener los resultados de la búsqueda.

**Regla de Negocio:**
- SI `query` no está vacío
- Y `count` == 0
- ENTONCES llamar `logLostSale(query)`

### 3.2 Debounce / Throttling (Optimización)
Para evitar spam si el usuario escribe "m", "mi", "mic", "mich"...
- Idealmente el frontend ya hace debounce.
- El servidor registrará lo que reciba. Si el frontend manda 3 requests, guardamos 3 logs.
- *Fase 1*: Registrar todo. Luego podemos agrupar en SQL.

## 4. 📋 Plan de Implementación (Sofia)

### 4.1 Base de Datos
- Migración `012_lost_sales.sql`.
- Crear tabla.
- RLS: Insert (propio), Select (propio).

### 4.2 Backend (Service)
- Crear `src/lib/services/analytics.ts`.
    - Function `logLostSale(query: string)`.
- Integrar en `src/lib/services/inventory.ts`.
    - Detectar `count === 0`.
    - Ejecutar `logLostSale` de forma "fire and forget" (sin await blocking, o con catch para no romper la búsqueda).

### 4.3 UI (Visualización)
- *Opcional por ahora*: Página simple `/dashboard/analytics` o `/dashboard/inventory/lost-sales`.
- Tabla simple: "Búsqueda" | "Fecha".

## 5. 🦶 Pasos
1.  **DB**: Migración.
2.  **Back**: Servicio de Analytics e integración en Inventory Service.
3.  **UI**: (Opcional) Botón en inventario para "Ver búsquedas fallidas".
