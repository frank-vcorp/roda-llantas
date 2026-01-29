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

## Flujo de Estados

> Estado actual del proyecto: [X] Inventario + Caja Registradora (Generador de Cotizaciones) — MVP operativo end-to-end. (DOC-20260129-QUOTES-FINAL)
> Estado actual del proyecto: [/] Micro-Sprint: Buscador Inteligente — Implementar búsqueda fuzzy (tolerante a fallos) y semántica en el inventario. (DOC-20260129-05, ARCH-20260129-SEARCH-DEF)
> Estado del Módulo de Cotizaciones: [X] Caja Registradora + Historial persistente de cotizaciones (Index Page con eliminación). (DOC-20260129-QUOTES-HISTORY)

---
## Micro-Sprint — Motor de Precios Dinámico (Completado)

### Objetivo del Micro-Sprint
- [x] Implementar un motor de precios dinámico basado en reglas de margen y soporte de precio manual, integrado con el inventario actual.
### Alcance y Referencias
## Micro-Sprint — Buscador Inteligente (En Progreso)

### Objetivo del Micro-Sprint
- [/] Implementar búsqueda fuzzy (tolerante a fallos) y semántica en el inventario.

### Tareas del Micro-Sprint
- [ ] [DB] Migración Full Text Search / Trigrams (`pg_trgm`).
- [ ] [DB] RPC Function `search_inventory`.
- [ ] [UI] Integrar buscador en Inventario.

> Micro-Sprint definido por CRONISTA-Estados-Notas. (DOC-20260129-05, ARCH-20260129-SEARCH-DEF)

---
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

---
## Features Entregadas

- [✓] Módulo de Ingesta (The Refinery)

## Backlog General

### II. Buscador y Catálogo
- [ ] Diseñar esquema de base de datos (Inventory, Brands)
- [ ] Implementar búsqueda Fuzzy (Búsqueda flexible)
- [ ] Implementar lógica de sugerencias (Rin equivalente)
- [ ] Registro de ventas perdidas (Lost Sales Log)

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
