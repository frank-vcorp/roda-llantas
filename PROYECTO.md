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
 - [✓] Micro-Sprint: Gestión de Ventas e Inventario — Conversión atómica de Cotización a Venta, visualización de Ventas Perdidas en Analytics y flujo de Compras con registro de facturas y entradas de stock vía RPC. (DOC-20260129-FULL-END, FIX-20260129-SALES-02, IMPL-20260129-LOST-SALES-02, IMPL-20260129-PURCHASES-01)
 - [✓] Micro-Sprint: Seguridad y Mobile UX — Roles y perfiles (tabla `profiles` con RLS, roles `admin`/`seller`) y UX móvil adaptativa con vista exclusiva de búsqueda y tarjetas en Inventario. (IMPL-20260129-ROLES-MOBILE, DOC-20260129-PHASE2-START)

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

> Estado actual del proyecto: [X] Sistema Operativo Completo: Inventario + Cotizador + Ventas + Compras + CRM + Analytics — Operativo end-to-end en entorno de demo. (DOC-20260129-FULL-END, FIX-20260129-SALES-02, IMPL-20260129-LOST-SALES-02, IMPL-20260129-PURCHASES-01)
> Estado actual del proyecto: [X] Sistema Consolidado: Roles implementados (RLS en `profiles` con roles `admin`/`seller`) y UX móvil optimizada. (IMPL-20260129-ROLES-MOBILE, DOC-20260129-PHASE2-START)
> Estado del Micro-Sprint — Buscador Inteligente: [✓] MEJORA CRÍTICA: Implementado ordenamiento por "Coincidencia Numérica Exacta" (V2) para diferenciar medidas similares (ej. R13 vs R14). (FIX-20260204-SEARCH-V2)
> Estado del Módulo de Precios: [✓] Implementado soporte para Kits de Descuento (Escalas por Volumen) y corrección de visibilidad global de reglas. (FIX-20260204-PRICING-VOL)

## Nota de Cierre Histórica

- [✓] Al 2026-01-29, se declara completado el Sistema Operativo de Llantera Pro (Inventario, Motor de Precios, Cotizador, Ventas, Compras, CRM y Analytics) en entorno de demostración, listo para validación extendida con usuario final.
- Referencia de cierre: DOC-20260129-FULL-END.

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
## Micro-Sprint — Gestión de Ventas e Inventario (Completado)

### Objetivo del Micro-Sprint
- [x] Consolidar el flujo end-to-end de Ventas, Compras y Analytics de Inventario para operar como sistema integral.

### Tareas del Micro-Sprint
- [x] [Ventas] Módulo de Ventas: Conversión Cotización -> Venta mediante RPC atómica, garantizando consistencia de inventario y registro de venta. (FIX-20260129-SALES-02)
- [x] [Analytics] Módulo de Analytics: Visualización de Ventas Perdidas en el dashboard, basada en la vista resumida de `lost_sales`. (IMPL-20260129-LOST-SALES-02)
- [x] [Compras] Módulo de Compras: Registro de facturas y entradas de stock mediante RPC, integrando compras con el inventario existente. (IMPL-20260129-PURCHASES-01)

> Micro-Sprint definido y cerrado por CRONISTA-Estados-Notas como consolidación de la Gestión de Ventas e Inventario. (DOC-20260129-FULL-END)

---
## Features Entregadas

- [✓] Módulo de Ingesta (The Refinery)

## Backlog General

### Histórico de Features V1.0 (Cerradas)
- [✓] Diseñar esquema de base de datos (Inventory, Brands) — Consolidado en el modelo actual y migraciones de inventario. (DOC-20260129-FULL-END)
- [✓] Implementar búsqueda Fuzzy (Búsqueda flexible) — Buscador Inteligente con `pg_trgm` y RPC `search_inventory`. (DOC-20260129-SEARCH-FINAL, CHK_20260129_SEARCH)
- [✓] Visualización/Analytics de ventas perdidas (Lost Sales Log UI) — Vista de analytics integrada en el Dashboard. (IMPL-20260129-LOST-SALES-02, IMPL-20260129-DASH-01)
- [✓] Tabla de reglas de margen por marca — Tabla `pricing_rules` operativa según SPEC-PRICING-ENGINE. (IMPL-20260129-PRICING-01, CHK_20260129_PRICING-PUBLIC)
- [✓] Lógica de cálculo de precio final — Motor de precios dinámico y columna "Precio Público" en Inventario. (IMPL-20260129-PRICING-01)
- [✓] Panel de administración de márgenes — Pantalla de configuración de márgenes en settings de pricing. (IMPL-20260129-PRICING-01)
- [✓] Diseño de tarjeta de cotización (UI) — Vista resumen/imprimible de cotización y layout tipo hoja membretada. (IMPL-20260129-QUOTES-04, DOC-20260129-QUOTES-FINAL)
 - [✓] Integración directa con WhatsApp (botón "Compartir cotización") reutilizando la hoja imprimible actual — Botón WhatsApp operativo en el flujo de cotización. (IMPL-20260129-QUOTES-06, DOC-20260130-WHATSAPP-FIX)

### Backlog V2.0 (Pendiente)
- [✓] Implementar lógica de sugerencias (Rin equivalente) en buscador/catálogo. (IMPL-20260130-V2-FEATURES, DOC-20260130-01, CHK_20260130_V2_FEATURES_QA, CHK_20260130_V2_FEATURES_CLOSE)
- [✓] Lógica de expiración de cotizaciones (marcado de vencidas y reglas de negocio asociadas). (IMPL-20260130-V2-FEATURES, DOC-20260130-01, CHK_20260130_V2_FEATURES_QA, CHK_20260130_V2_FEATURES_CLOSE)

---

## Decisiones Arquitectónicas
- **ADR-001:** Uso de Next.js como PWA.
- **ADR-002:** Supabase como Backend-as-a-Service.

## Micro-Sprint — UX Móvil y Personalización (Completado)

### Objetivo del Micro-Sprint
- [x] Mejorar drásticamente la UX móvil de las tarjetas de inventario y permitir personalización de marca (Logo/Datos) en tickets.

### Tareas del Micro-Sprint
- [x] [DB] Tabla `organization_settings` y Storage Bucket `branding`.
- [x] [UI] Pantalla de Configuración Global (`/dashboard/settings`).
- [x] [UI/Mobile] Rediseño profesional de `MobileSearch` (Tarjetas de Inventario).
- [x] [Feature] Integración de logo/datos dinámicos en PDF de Cotización.

> Micro-Sprint definido a solicitud del usuario para pulir la experiencia antes del despliegue final. (ARCH-20260130-V2.1)
> Cierre del Micro-Sprint registrado tras implementación de White Label y UX Móvil. (IMPL-20260130-WHITELABEL)

---
## Micro-Sprint — Optimización y Limpieza (Completado)

### Objetivo del Micro-Sprint
- [x] Preparar el código para entrega final: limpieza de logs, archivos temporales y optimización de assets.

### Tareas del Micro-Sprint
- [x] [Clean] Eliminar archivos temporales (`create-test-xlsx.mjs`, `user_pasted_data.txt`).
- [x] [Refactor] Eliminar `console.log` de depuración en componentes de UI y lógica NO crítica.
- [x] [Doc] Actualizar `README.md` con instrucciones finales.
- [x] [QA] Verificación final de build.

> Sprint de cierre técnico. (ARCH-20260131-OPTIMIZATION)

---
## Nota de Versionado Final

- V2.1 RELEASE - 2026-01-31 (DOC-20260131-FINAL-HANDOFF)

---
## Micro-Sprint — Llantera Pro PWA Edition (COMPLETADO)

### Objetivo del Micro-Sprint
- [x] Convertir la aplicación en una PWA instalable con soporte para iconos y visualización standalone.

### Tareas del Micro-Sprint
- [x] [ARCH] Definir SPEC-PWA (Manifest, Icons, SW).
- [x] [UI] Crear `manifest.ts` y configurar Metadatos de Next.js.
- [x] [UI] Generar iconos adaptativos (192x192, 512x512, Apple Touch).
- [x] [INFRA] Implementar Service Worker básico para instalabilidad.
- [x] [QA] Certificación de PWA "Ready for Install".

> Micro-Sprint completado bajo la metodología INTEGRA v2.2. (DOC-20260131-08)

---
## Micro-Sprint — Hotfix Service Worker (Completado)

### Objetivo del Micro-Sprint
- [x] Corregir error de "Pantalla Blanca" en producción causado por bloqueo de redirecciones en el Service Worker.

### Tareas del Micro-Sprint
- [x] [INFRA] Ajustar `sw.js` para ignorar peticiones de navegación (`mode: navigate`).
- [x] [QA] Validación forense del error de redirección 307.

> Hotfix de emergencia aplicado por DEBY. (FIX-20260201-01, CHK_20260201_FIX_SW)

---
## Micro-Sprint — Refinamiento de Búsqueda y Precios (Completado)

### Objetivo
- [x] Corregir ordenamiento de búsqueda para priorizar coincidencias numéricas exactas (R13 vs R14).
- [x] Implementar Kits de Descuento por Volumen (Escalas de precios) y asegurar visibilidad global de reglas.

### Tareas
- [x] [DB] Migración `search_inventory` V2 (Coincidencia Numérica + GREATEST similarity).
- [x] [DB] Migración `pricing_rules` (Columna JSON `volume_rules` + RLS Fix).
- [x] [Logic] Actualizar `pricing.ts` para cálculo de precios por volumen.
- [x] [UI] Actualizar `PricingRuleDialog` y `PricingRulesList` para gestión de escalas.

> Sprint completado. Implementación de busqueda V2 y Kits de Descuento. (DOC-20260204-SEARCH-PRICING)
