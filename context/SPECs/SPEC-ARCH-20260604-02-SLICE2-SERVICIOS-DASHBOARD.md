# SPEC - Slice 2 Dashboard de Servicios

**ID:** ARCH-20260604-02
**Estado:** Draft listo para implementacion
**Fecha:** 2026-06-04
**Respaldo:** [context/clientes/DEAC-ARCH-20260604-01.md](context/clientes/DEAC-ARCH-20260604-01.md)
**Dependencia previa:** [context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md](context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md)

## 1. Objetivo
Implementar la Slice 2 del modulo de servicios: acceso desde la navegacion del dashboard, listado administrativo de servicios, pantalla de carga masiva inicial desde Excel y alta individual basica, manteniendo los servicios fuera del flujo de cotizacion.

## 2. Archivo Ancla Inicial
- [src/components/dashboard/nav.tsx](src/components/dashboard/nav.tsx)

Justificacion: el pedido funcional explicito del usuario es disponer de un link o entrada visible al modulo de servicios. Ese es el primer punto de acceso y el mejor ancla para la Slice 2.

## 3. Datos Existentes a Reutilizar
- Estructura de tablas y RPC ya aplicada en BD para servicios.
  Referencia: [supabase/migrations/20260604000001_catalog_services_slice_1.sql](supabase/migrations/20260604000001_catalog_services_slice_1.sql)
- Parser dedicado de Excel de servicios.
  Referencia: [src/lib/logic/service-excel-parser.ts](src/lib/logic/service-excel-parser.ts)
- Patrones de importacion existentes del modulo inventario.
  Referencia: [src/app/dashboard/inventory/import/page.tsx](src/app/dashboard/inventory/import/page.tsx)
- Patrones de paginas administrativas protegidas.
  Referencia: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)

## 4. Alcance Exacto de la Slice 2

### 4.1 Navegacion
- Agregar enlace visible `Servicios` en el dashboard desktop y mobile.
- El enlace debe apuntar a `/dashboard/services`.
- El acceso queda disponible para usuarios autenticados; si luego se requiere restriccion por rol se mueve a backlog, no se diseña ahora.

### 4.2 Listado Administrativo
- Crear pagina `/dashboard/services`.
- Mostrar tabla o lista con:
  - `display_name`
  - `category`
  - `tier_code`
  - `base_price`
  - `manual_price`
  - precio final calculado segun politica vigente
- Incluir buscador local por texto sobre nombre/categoria.
- Incluir CTA a:
  - `Importar servicios`
  - `Nuevo servicio`

### 4.3 Carga Masiva Inicial
- Crear pagina `/dashboard/services/import`.
- Reutilizar el parser de servicios actual.
- Flujo minimo:
  1. carga del archivo
  2. vista previa de filas parseadas
  3. guardar en BD
- La importacion debe insertar en:
  - `service_catalog`
  - `service_tiers`
  - `service_aliases`
- No debe modificar nombres, categorias ni precios fuente del Excel.
- Si una fila no cumple formato de tier, puede fallar esa fila pero no debe inventar datos.

### 4.4 Alta Individual Basica
- Crear pagina o modal simple accesible desde `/dashboard/services/new`.
- Campos minimos:
  - categoria
  - display_name
  - tier_code
  - base_price
  - manual_price opcional
- La alta debe derivar `base_name` removiendo solo el sufijo final A/AA/AAA si viene incluido, preservando `display_name` completo.

## 5. Reglas Contractuales No Negociables
- No integrar servicios a carrito, cotizacion, PDF ni WhatsApp.
- No inventar categorias, nombres, precios ni sinonimos ausentes.
- No alterar nombres, categorias ni precios del Excel en la importacion masiva.
- La unica transformacion permitida sobre el nombre es extraer el sufijo final A/AA/AAA para persistir `tier_code`, conservando `display_name`.

## 6. Archivos Exactos a Crear o Modificar
Impacto autorizado por usuario para esta slice: mayor a 5 archivos.

Archivos previstos:
1. Modificar [src/components/dashboard/nav.tsx](src/components/dashboard/nav.tsx)
2. Crear [src/app/dashboard/services/page.tsx](src/app/dashboard/services/page.tsx)
3. Crear [src/app/dashboard/services/import/page.tsx](src/app/dashboard/services/import/page.tsx)
4. Crear [src/app/dashboard/services/new/page.tsx](src/app/dashboard/services/new/page.tsx)
5. Crear [src/app/dashboard/services/actions.ts](src/app/dashboard/services/actions.ts)
6. Crear [src/components/services/service-import-form.tsx](src/components/services/service-import-form.tsx)
7. Crear [src/components/services/service-form.tsx](src/components/services/service-form.tsx)

Si Sofia detecta una alternativa mejor con el mismo alcance, puede ajustar nombres de archivos, pero debe mantener el maximo de 7 archivos nuevos/modificados en esta entrega.

## 7. Validacion Exacta Esperada

### 7.1 Validacion Tecnica
- `npm run build`

### 7.2 Validacion Funcional
- Existe enlace `Servicios` en dashboard.
- `/dashboard/services` carga sin error para usuario autenticado.
- La pantalla de importacion permite previsualizar el Excel de servicios.
- La pantalla de alta individual permite crear un servicio sin romper las restricciones del contrato.
- Los servicios siguen sin aparecer en flujo de cotizacion.

## 8. Riesgos Asumidos en Esta Slice
- El parser tolerante por fila invalida queda como mejora QA posterior, salvo que Sofia lo resuelva sin expandir alcance.
- CRUD enriquecido de aliases queda fuera.
- Edicion avanzada de politicas por tier queda fuera de esta slice si compromete el limite de archivos.

## 9. Prompt Operativo Para Sofia
Trabaja sobre [context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md](context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md). Estado: draft validado por usuario. Objetivo: implementar Slice 2 del modulo de servicios con link en dashboard, listado administrativo, importacion masiva y alta individual basica. Salida: modulo navegable en `/dashboard/services` con import y create basicos. Restricciones: no integrar servicios a cotizacion, no inventar datos, no alterar Excel salvo extraer tier final, maximo 7 archivos, mantener el contrato de la Slice 1. Archivo ancla: [src/components/dashboard/nav.tsx](src/components/dashboard/nav.tsx). Validacion: `npm run build`.