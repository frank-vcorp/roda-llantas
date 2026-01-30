# SPEC: Micro-Sprint V2.1 — UX Móvil y Personalización (Marca Blanca)

## 1. Contexto y Objetivo
El usuario ha validado el sistema en producción (Vercel) pero reporta dos necesidades críticas para la adopción final:
1. **UX Móvil Deficiente:** La visualización de inventario en móviles es "fea", con tarjetas poco pulidas y jerarquía visual confusa.
2. **Personalización (Marca Blanca):** Falta la capacidad de personalizar el logo y el texto del ticket/cotización, lo cual es vital para la identidad del negocio.

## 2. Alcance (Scope)

### A. UX Mobile Refinada (`MobileSearch`)
Mejorar el atractivo visual y la usabilidad de las tarjetas de inventario en dispositivos móviles.

**Cambios en UI:**
- **Diseño de Tarjeta:**
  - Estilo "Card" más limpio (`bg-white pattern-slate-50`, `rounded-xl`, `shadow-sm`).
  - **Jerarquía Tipográfica:**
    - Medida (Main): `text-xl font-extrabold text-slate-900` (Ej. 195/50R16).
    - Marca (Sub): `text-xs font-semibold text-slate-400 uppercase tracking-widest` (Ej. TORNEL REAL).
  - **Layout de Información:**
    - Cabecera: Medida a la izquierda, Badge de Stock a la derecha.
    - Pie: Precio destacado (`text-lg font-bold text-emerald-600`) alineado con el Botón de Acción.
  - **Manejo de Precio Cero:** Si precio es 0, mostrar "Consultar" o "--" en lugar de "$0".
  - **Botón de Acción:**
    - Botón primario de ancho completo o flotante pero con mejor diseño (`h-10`, `rounded-lg`).
    - Icono `ShoppingCart` más visible.

### B. Personalización de Negocio (Settings)
Permitir al administrador actualizar la información básica que aparece en los tickets y la interfaz.

**1. Base de Datos (`organization_settings`)**
Nueva tabla para almacenar configuración global (Singleton pattern).
```sql
create table organization_settings (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Mi Llantera',
  address text,
  phone text,
  website text,
  logo_url text, -- URL pública (Supabase Storage)
  ticket_footer_message text default '¡Gracias por su compra!',
  updated_at timestamptz default now()
);

-- RLS: Read public, Write admin only.
```

**2. Panel de Configuración (`/dashboard/settings`)**
- Formulario simple con:
  - Nombre del Negocio.
  - Dirección, Teléfono.
  - Subida de Logo (Bucket `branding`).
  - Mensaje de pie de página para tickets.
- Actions: `getOrganizationSettings`, `updateOrganizationSettings`.

**3. Integración en Tickets**
- Actualizar la vista de PDF/Impresión de Cotización para leer de `organization_settings` en lugar de textos hardcodeados.

## 3. Plan de Implementación

1. **DB Setup**: Migración SQL para `organization_settings` y bucket de Storage.
2. **Backend**: Server Actions para leer/escribir settings.
3. **Frontend (Settings)**: Página `/dashboard/settings`.
4. **Frontend (Mobile)**: Refactorizar `src/components/inventory/mobile-search.tsx`.
5. **Frontend (Tickets)**: Conectar `QuotationViewPage` con settings.

## 4. Criterios de Aceptación
- [ ] La tarjeta móvil se ve profesional, con jerarquía clara y precio formateado.
- [ ] Se puede subir un logo y cambiar el nombre del negocio desde `/dashboard/settings`.
- [ ] El ticket de cotización muestra el nuevo logo y datos del negocio automáticamente.
