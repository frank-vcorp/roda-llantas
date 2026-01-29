# PROYECTO: LLANTERA PRO

## Historial de Sprints Autónomos
- [✓] Sprint 1: UI Base & Auth — Validado por QA. Middleware y Login funcionales. (DOC-20260129-01)
- [✓] Sprint 2: Ingesta de Excel — Completado y validado por QA. Parser de Excel y Server Action insertan correctamente en Supabase. (DOC-20260129-02)
- [✓] Sprint 3: Visualización de Inventario — Validado por QA. Server Component y DataTable funcionales. (DOC-20260129-QA-SPRINT3)
 - [✓] Hotfix: Importador Excel — Soporte para archivos con metadatos y disclaimers (Riva Palacio). Validado por usuario. (FIX-20260129-01)
- [✓] Micro-Sprint: Excelencia en Inventario — Importador Excel inteligente (Vista Híbrida), regex corregido para llantas industriales, migración NUMERIC en `rim` y `width`, search bar y tooltips mejorados, 982 items importados exitosamente. (DOC-20260129-01)
 - [✓] Micro-Sprint: Motor de Precios Dinámico — Motor de precios y columna de Precio Público operativos sobre el inventario actual. (DOC-20260129-04)
 - [✓] Micro-Sprint: Generador de Cotizaciones (Caja Registradora) — Flujo completo de creación, resumen e impresión de cotizaciones con soporte de descuentos por monto/porcentaje. (DOC-20260129-QUOTES-FINAL)
 - [✓] Feature: Historial de Cotizaciones y Eliminación (Index Page) — Listado persistente de cotizaciones con soporte de eliminación lógica desde el dashboard. (DOC-20260129-QUOTES-HISTORY)
 - [✓] Micro-Sprint: Buscador Inteligente — Búsqueda fuzzy y semántica integrada en Inventario, con threshold ajustado para tolerar errores tipográficos comunes y UI conectada a la RPC `search_inventory`. (DOC-20260129-SEARCH-FINAL, FIX-20260129-10)
 - [✓] Micro-Sprint: CRM Lite (Gestión de Clientes) — Tabla `customers`, acciones de servidor y autocompletado de clientes integrado en el Cotizador. (DOC-20260129-CRM-FINAL, IMPL-20260129-CRM-01)

## Flujo de Estados

> Estado actual del proyecto: [X] Inventario + Caja Registradora (Generador de Cotizaciones) — MVP operativo end-to-end. (DOC-20260129-QUOTES-FINAL)
> Estado actual del proyecto: [X] Micro-Sprint: Buscador Inteligente — Búsqueda fuzzy (tolerante a fallos) y semántica integrada en el inventario (UI + RPC). (DOC-20260129-SEARCH-FINAL, DOC-20260129-05, ARCH-20260129-SEARCH-DEF)
> Estado del Módulo de Cotizaciones: [X] Caja Registradora + Historial persistente de cotizaciones (Index Page con eliminación). (DOC-20260129-QUOTES-HISTORY)
> Estado actual del proyecto: [X] Inventario + Motor de Precios + Caja Registradora (Generador de Cotizaciones) + Buscador Inteligente — MVP v1.1 operativo end-to-end (Inventario, Precios, Cotizaciones y Búsqueda). (DOC-20260129-SEARCH-FINAL)
> Estado del Buscador Inteligente (Backend/Infra): [✓] Extensión `pg_trgm` y función RPC `search_inventory` operativas en Supabase, listas para consumo desde el frontend. (CHK_20260129_FINAL_SESSION)
> Nota: Se aplicó el FIX-20260129-10 para ajustar el threshold de búsqueda fuzzy (`pg_trgm.similarity_threshold = 0.1`), mejorando la tolerancia a errores tipográficos en las consultas. (DOC-20260129-SEARCH-FINAL, FIX-20260129-10)
> Estado del Micro-Sprint — Registro de Ventas Perdidas: [/] Backend completado (DB + Servicio de logging automático), UI para analytics pendiente en Backlog General. (DOC-20260129-LOST-SALES-CLOSE, IMPL-20260129-LOST-SALES-01)
> Estado del Micro-Sprint — CRM Lite (Gestión de Clientes): [X] Implementado y operativo (DB `customers`, Actions y UI de autocompletado en Cotizador). (DOC-20260129-CRM-FINAL, DOC-20260129-07, ARCH-20260129-CRM-DEF, IMPL-20260129-CRM-01)
> Estado del Micro-Sprint — Dashboard Analytics: [X] Implementado y operativo en `/dashboard` con KPIs clave (Total cotizado hoy, búsquedas sin resultado, stock crítico) y tablas de actividad reciente, según SPEC-DASHBOARD-ANALYTICS. (DOC-20260129-08, ARCH-20260129-DASH-DEF, IMPL-20260129-DASH-01, DOC-20260129-DASH-FINAL)

## Micro-Sprint — Motor de Precios Dinámico (Completado)

### Objetivo del Micro-Sprint
- [x] Implementar un motor de precios dinámico basado en reglas de margen y soporte de precio manual, integrado con el inventario actual.

### Alcance y Referencias
- [x] Alcance limitado al cálculo de precio público sobre inventario existente.
- Referencias:
	- context/SPEC-PRICING-ENGINE.md

### Tareas del Micro-Sprint
- [x] [DB] Tabla `pricing_rules` y campo `manual_price`.
- [x] [Logic] Servicio de cálculo (`calculatePrice`).
- [x] [UI] Panel de Configuración de Márgenes.
- [x] [UI] Columna "Precio Público" en Inventario.

> Micro-Sprint definido por CRONISTA-Estados-Notas a partir del cierre del Módulo de Inventario "perrón". (DOC-20260129-03)

---
## Micro-Sprint — Buscador Inteligente (Completado)

### Objetivo del Micro-Sprint
- [x] Implementar búsqueda fuzzy (tolerante a fallos) y semántica en el inventario.

### Tareas del Micro-Sprint
- [x] [DB] Migración Full Text Search / Trigrams (`pg_trgm`).
- [x] [DB] RPC Function `search_inventory`.
- [x] [UI] Integrar buscador en Inventario.

> Micro-Sprint definido por CRONISTA-Estados-Notas. (DOC-20260129-05, ARCH-20260129-SEARCH-DEF)
> Nota de cierre: Incluye ajuste de threshold de búsqueda fuzzy a 0.1 para `pg_trgm` (FIX-20260129-10), asegurando mayor tolerancia a errores tipográficos en el Buscador Inteligente. (DOC-20260129-SEARCH-FINAL)

---

## Micro-Sprint — Generador de Cotizaciones (Caja Registradora) (Completado)

### Objetivo del Micro-Sprint
- [x] Permitir seleccionar llantas y generar un PDF/Link para el cliente.

### Alcance y Referencias
- [x] Alcance limitado a cotizaciones simples basadas en inventario existente.
- Referencias:
	- context/SPEC-QUOTATIONS.md

### Tareas del Micro-Sprint
- [x] [DB] Migración `006_quotations.sql` (Modelo de datos).
- [x] [UI] Selección múltiple en Tabla de Inventario ("Carrito").
- [x] [State] Contexto global de "Cotización Actual".
- [x] [UI] Pantalla de Resumen de Cotización (Agregar Cliente, Ver Totales).
- [x] [Feature] Generar PDF básico.
- [x] [Feature] Soporte para Descuentos (Monto/Porcentaje) en Cotización.

> Nota: El módulo de Cotizaciones ahora incluye persistencia y gestión histórica de cotizaciones (listado, acceso al detalle e inicio de flujo de eliminación). (DOC-20260129-QUOTES-HISTORY)

> Micro-Sprint definido por CRONISTA-Estados-Notas. (DOC-20260129-04)
> Cierre del Micro-Sprint registrado por CRONISTA-Estados-Notas. (DOC-20260129-QUOTES-FINAL)

## Micro-Sprint — Registro de Ventas Perdidas

### Objetivo del Micro-Sprint
- [ ] Capturar queries de búsqueda sin resultados para identificar demanda insatisfecha.

### Tareas del Micro-Sprint
- [x] [DB] Tabla `lost_sales`.
- [x] [Logic] Triggers/servicio para logging automático de búsquedas sin resultados.
- [ ] [UI] Visualización básica de ventas perdidas (fuera de alcance del Micro-Sprint actual, movida al Backlog General como parte de Analytics).

> Micro-Sprint definido por CRONISTA-Estados-Notas a partir de SPEC-LOST-SALES. (DOC-20260129-06, ARCH-20260129-LOST-SALES-DEF)
> Cierre del Micro-Sprint registrado por CRONISTA-Estados-Notas como "Backend Only" (solo DB + Servicio). (DOC-20260129-LOST-SALES-CLOSE, IMPL-20260129-LOST-SALES-01)

## Micro-Sprint — CRM Lite (Gestión de Clientes)

### Objetivo del Micro-Sprint
- [x] Gestionar cartera de clientes y agilizar cotizaciones con autocompletado.

### Tareas del Micro-Sprint
- [x] [DB] Tabla `customers` y FK en `quotations`.
- [x] [Action] `searchCustomers` y `createCustomer`.
- [x] [UI] Componente `CustomerCombobox` en Cotizador.

- [x] [UI] Directorio de Clientes y Edición.
- [x] [Nav] Link en Sidebar a `/dashboard/customers`.

> Micro-Sprint definido por CRONISTA-Estados-Notas a partir de SPEC-CRM-LITE. (DOC-20260129-07, ARCH-20260129-CRM-DEF)
> Cierre del Micro-Sprint registrado por CRONISTA-Estados-Notas. (DOC-20260129-CRM-FINAL, IMPL-20260129-CRM-01)

> Nota: El módulo CRM Lite ahora incluye gestión completa de clientes (CRUD básico: alta, consulta, edición y eliminación) desde el dashboard. (DOC-20260129-CRM-DIR)

---
## Micro-Sprint — Dashboard Analytics

### Objetivo del Micro-Sprint
- [x] Visualizar KPIs clave (Cotizaciones, Demanda Insatisfecha, Stock) en la pantalla de inicio.

### Tareas del Micro-Sprint
- [x] [Logic] Servicio `getDashboardMetrics`.
- [x] [UI] Cards de KPIs y Accesos Rápidos.
- [x] [UI] Tablas de Actividad Reciente.

> Micro-Sprint definido por CRONISTA-Estados-Notas a partir de SPEC-DASHBOARD-ANALYTICS. (DOC-20260129-08, ARCH-20260129-DASH-DEF)
> Cierre del Micro-Sprint registrado por CRONISTA-Estados-Notas. (IMPL-20260129-DASH-01, DOC-20260129-DASH-FINAL)

---
## Features Entregadas

- [✓] Módulo de Ingesta (The Refinery)

## Backlog General

### II. Buscador y Catálogo
- [ ] Diseñar esquema de base de datos (Inventory, Brands)
- [x] Implementar búsqueda Fuzzy (Búsqueda flexible)
- [ ] Implementar lógica de sugerencias (Rin equivalente)
- [ ] Visualización/Analytics de ventas perdidas (Lost Sales Log UI)

### III. Motor de Precios
- [ ] Tabla de reglas de margen por marca
- [ ] Lógica de cálculo de precio final
- [ ] Panel de administración de márgenes

### IV. Generador de Cotizaciones
- [ ] Diseño de tarjeta de cotización (UI)
- [ ] Generación de imagen/PDF para WhatsApp
- [ ] Lógica de expiración de cotizaciones

---

## Decisiones Arquitectónicas
- **ADR-001:** Uso de Next.js como PWA.
- **ADR-002:** Supabase como Backend-as-a-Service.
