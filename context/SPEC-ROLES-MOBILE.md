# SPEC-ROLES-MOBILE: Seguridad y Experiencia Móvil

## 1. Seguridad y Roles (RBAC)

### 1.1 Modelo de Datos
Necesitamos persistir el rol del usuario fuera del token de sesión para poder cambiarlo administrativamente.
- **Tabla**: `profiles` (extensión de `auth.users`).
- **Campos**:
  - `id` (uuid, fk -> auth.users, pk)
  - `email` (text)
  - `role` (text: 'admin', 'seller' - default 'seller')
  - `full_name` (text)
- **Policies (RLS)**:
  - Users can read their own profile.
  - Admins can read/edit all profiles.

### 1.2 Reglas de Negocio
- **Admin**: Acceso Total.
- **Seller**:
  - PROHIBIDO:
    - Ver `cost_price` en queries de inventario.
    - Acceder a `/dashboard/settings/*`.
    - Acceder a `/dashboard/inventory/purchases`.
    - Acceder a `/dashboard/analytics`.
    - Botón "Eliminar" en Cotizaciones/Ventas definidas.

### 1.3 Implementación
- **Middleware/Utility**: `verifyRole(required: 'admin')` en Server Actions sensibles.
- **UI**: Componente `<RoleGate role="admin">` para ocultar botones o Links del Sidebar.

---

## 2. Inventario Móvil (Mobile UX)

### 2.1 Concepto
Transformar la vista de carga inicial (Lista completa) en una vista orientada a la búsqueda ("Google Style").

### 2.2 Requerimientos UI (Mobile Only)
Detectar viewport (CSS `md:hidden`).
1.  **Estado Inicial**:
    - Header con Logo.
    - SearchBar gigante y autofocus (si posible).
    - Texto: "🔍 Escribe una medida (ej. 205 55 16)..."
2.  **Resultados**:
    - Grid de Tarjetas (Cards).
    - **Contenido Card**:
        - Medida (Grande)
        - Marca/Modelo
        - 🟢 Stock: X
        - 💰 Precio: $X,XXX
        - Botón: "Agregar" (Abre modal/drawer para cantidad).

### 2.3 Refactoring Page
- `src/app/dashboard/inventory/page.tsx`:
    - Renderizar `<InventoryTable>` (Desktop) O `<InventoryMobileSearch>` (Mobile) según CSS display (ambos presentes en DOM o condicional por User Agent si optimizamos server-side, CSS es más rápido para implementar ahora).
    - *Mejor opción*: CSS utility classes. `<div class="hidden md:block"><DataTable /></div>` y `<div class="md:hidden"><MobileSearch /></div>`.

## 3. Entregables
1. Migración `profiles`.
2. HOC/Utility para check de roles.
3. Sidebar filtrado.
4. Vista Móvil de Inventario.
