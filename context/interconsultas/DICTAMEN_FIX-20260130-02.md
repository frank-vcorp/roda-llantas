# DICTAMEN TÉCNICO: Recursión Infinita en RLS de Profiles

- **ID:** FIX-20260130-02
- **Fecha:** 2026-01-30
- **Solicitante:** Frank (usuario)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma
Error en Supabase al consultar cualquier tabla que verificaba roles de usuario:
```
infinite recursion detected in policy for relation "profiles"
```

### Hallazgo Forense
En [20260129000017_create_profiles_with_roles.sql](../supabase/migrations/20260129000017_create_profiles_with_roles.sql#L84-L92):

```sql
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p  -- ❌ Auto-referencia
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
```

### Causa
La política RLS de `profiles` consulta la misma tabla `profiles` para verificar si el usuario es admin. Esto crea un ciclo:

1. Usuario intenta leer `profiles`
2. RLS evalúa política → ejecuta `SELECT FROM profiles`
3. Ese SELECT dispara RLS de nuevo → vuelve al paso 2
4. → Recursión infinita

---

## B. Justificación de la Solución

### Solución Aplicada
Crear función `is_admin()` con `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Por qué funciona
- `SECURITY DEFINER`: La función se ejecuta con permisos del **owner** (postgres), no del usuario actual
- El owner tiene permisos completos y **no está sujeto a RLS**
- Esto rompe el ciclo de recursión

### Políticas recreadas
```sql
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin());
```

---

## C. Verificación

| Test | Resultado |
|------|-----------|
| Migración aplicada | ✅ `supabase db push` exitoso |
| Query con anon key | ✅ Retorna `[]` (correcto: sin auth no hay permisos) |
| Sin error de recursión | ✅ No más "infinite recursion detected" |

---

## D. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| [20260130134000_fix_rls_recursion.sql](../supabase/migrations/20260130134000_fix_rls_recursion.sql) | Nueva migración con fix |

---

## E. Notas para Futuros Desarrolladores

⚠️ **NUNCA** crear políticas RLS que hagan auto-referencia a la misma tabla.

Patrón correcto para verificar roles:
```sql
-- ✅ Usar función SECURITY DEFINER
USING (public.is_admin())

-- ❌ NUNCA hacer esto
USING (EXISTS (SELECT 1 FROM misma_tabla WHERE ...))
```

---

**Commit:** `e646d6d9` - `fix(rls): corregir recursión infinita en políticas de profiles`
