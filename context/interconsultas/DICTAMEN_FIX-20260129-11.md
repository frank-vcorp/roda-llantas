# DICTAMEN TÉCNICO: Scripts de Debug No Ven Datos por RLS

- **ID:** FIX-20260129-11
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario (Debug de búsqueda)
- **Estado:** ✅ VALIDADO - Causa raíz identificada

---

## A. Análisis de Causa Raíz

### Síntoma
- Scripts en `scripts/` (ej: `list_brands.ts`) retornan arrays vacíos
- La UI del dashboard muestra datos correctamente
- El usuario puede hacer cotizaciones y ver inventario sin problemas

### Hallazgo Forense
```
SERVICE_ROLE_KEY: ❌ No encontrada en .env.local
ANON_KEY: ✅ Presente (script usa esta por fallback)
```

### Causa
1. Supabase tiene **Row Level Security (RLS)** habilitado en `inventory`
2. Las políticas RLS requieren `auth.uid() = profile_id` para ver filas
3. Los scripts CLI no tienen sesión de usuario autenticado
4. Sin `SERVICE_ROLE_KEY`, el script usa `ANON_KEY` que está sujeto a RLS
5. Como `auth.uid()` es `NULL` en scripts sin sesión → 0 filas retornadas

### Por qué la UI funciona
- El usuario hace login en la app
- La sesión de Supabase tiene un `auth.uid()` válido
- Las políticas RLS permiten ver las filas donde `profile_id` coincide

---

## B. Justificación de la Solución

### Cambios Realizados
1. **`.env.local`**: Agregado placeholder para `SUPABASE_SERVICE_ROLE_KEY` con instrucciones
2. **`scripts/list_brands.ts`**: Mejorado con diagnóstico explícito de qué key usa

### Acción Requerida del Usuario
Obtener la `service_role` key desde Supabase Dashboard:
1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto `xcprrxhituqnrzsjxrof`
3. Settings → API → `service_role` (NOT the anon key)
4. Copiar y pegar en `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

### ⚠️ Seguridad
- La `service_role` key **NUNCA** debe exponerse al frontend
- Solo usar en scripts de backend/admin/debug
- Ya está en `.gitignore` (archivos `.env*` no se commitean)

---

## C. Instrucciones de Handoff

### Para SOFIA/INTEGRA (si continúan debugging)
1. Confirmar que el usuario agregó la `SERVICE_ROLE_KEY`
2. Re-ejecutar: `npx tsx scripts/list_brands.ts`
3. Debería mostrar: `SERVICE_ROLE_KEY: ✅ Usando (bypass RLS)`
4. Y las marcas deberían aparecer en `Brands found: [...]`

### Validación
```bash
npx tsx scripts/list_brands.ts
# Esperado con SERVICE_ROLE_KEY:
# SERVICE_ROLE_KEY: ✅ Usando (bypass RLS)
# Brands found: ['TORNEL', 'HANKOOK', 'MICHELIN', ...]
```

---

## Archivos Modificados
- [.env.local](.env.local) - Placeholder para service key
- [scripts/list_brands.ts](scripts/list_brands.ts) - Diagnóstico mejorado
