# SPEC - Edición Individual de Servicios

**ID:** ARCH-20260608-01
**Estado:** Aprobado para implementación
**Fecha:** 2026-06-08
**Respaldo:** [context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md](context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md)

## 1. Objetivo
Agregar edición individual de servicios desde el dashboard, permitiendo modificar categoria, nombre, tier y precios desde cada registro del listado.

## 2. Archivo Ancla
- `src/app/dashboard/services/page.tsx`

## 3. Alcance
- Agregar columna de acciones en el listado con botón "Editar"
- Crear ruta dinámica `/dashboard/services/[tierId]/edit`
- Implementar formulario de edición con campos:
  - categoria (string)
  - displayName (string) 
  - tierCode (A/AA/AAA)
  - basePrice (numeric)
  - manualPrice (numeric opcional)
- Server action `updateService` en `actions.ts`
- Recalcular precio final automáticamente al guardar

## 4. Reglas Contractuales
- No tocar flujo de cotización
- Mantener derivación automática de base_name desde displayName
- La edición debe preservar display_name original como en importación

## 5. Archivos a Crear/Modificar (máximo 4)
1. `src/app/dashboard/services/[tierId]/page.tsx` (editar)
2. Modificar `src/app/dashboard/services/page.tsx` (agregar botón Editar)
3. Modificar `src/components/services/service-form.tsx` (soportar modo edición)
4. Modificar `src/app/dashboard/services/actions.ts` (agregar updateService)

## 6. Validación
- `npm run build` sin errores
- Desde dashboard → Servicios → Editar servicio → Guardar → cambios persisten

## 7. Prompt Operativo para Sofia
Trabaja sobre esta SPEC. Objetivo: permitir edición individual de cada servicio desde el listado del dashboard. Restricciones: no más de 4 archivos, no tocar cotización, validar con `npm run build`.