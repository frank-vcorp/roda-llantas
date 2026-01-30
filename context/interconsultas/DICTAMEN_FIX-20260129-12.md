# DICTAMEN TÉCNICO: FK Incorrecta en Migración Sales (auth.profiles → auth.users)

- **ID:** FIX-20260129-12
- **Fecha:** 2026-01-29
- **Solicitante:** Humano (error al ejecutar `npx supabase db push`)
- **Estado:** ✅ VALIDADO

---

## A. Análisis de Causa Raíz

### Síntoma
```
Applying migration 20260129000014_sales.sql... 
ERROR: relation "auth.profiles" does not exist
```

### Hallazgo Forense
| Archivo | Problema |
|---------|----------|
| `20260129000014_sales.sql` | Línea 12: `REFERENCES auth.profiles(id)` |
| `PROD_DEPLOY.sql` | Línea 59: Misma FK incorrecta |
| `scripts/apply-migration-sales.mjs` | Línea 22: Misma FK incorrecta |

### Causa Raíz
1. **No existe `auth.profiles`** en Supabase. El esquema `auth` solo contiene `auth.users`.
2. La tabla `public.profiles` sí existe, pero:
   - Se crea en migración `20260129_create_profiles_with_roles.sql` (sin número secuencial)
   - Se ejecuta DESPUÉS de `20260129000014_sales.sql` por orden alfabético
3. El campo `profile_id` en `sales` representa "el usuario que realizó la venta" → debe apuntar a `auth.users(id)`.

---

## B. Justificación de la Solución

### Decisión
Cambiar la FK de `auth.profiles(id)` → `auth.users(id)` en todos los archivos afectados.

### Razón
- **Supabase Best Practice**: Las tablas de negocio deben referenciar `auth.users(id)` directamente.
- **`public.profiles`** es metadata opcional (nombre, rol) y no debe ser FK obligatoria.
- **Simplicidad**: No hay que preocuparse por el orden de migraciones de profiles.

### Archivos Corregidos
1. ✅ `supabase/migrations/20260129000014_sales.sql` - Línea 12
2. ✅ `PROD_DEPLOY.sql` - Línea 59
3. ✅ `scripts/apply-migration-sales.mjs` - Línea 22

---

## C. Instrucciones de Handoff

### Acción Inmediata
```bash
# Reintentar push de migraciones
npx supabase db push
```

### Nota sobre Producción
Si la tabla `sales` ya existe en producción con la FK incorrecta, será necesario:
```sql
-- Solo si la tabla ya existe con FK errónea
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_profile_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Verificación Post-Deploy
```sql
SELECT 
  tc.constraint_name,
  ccu.table_schema || '.' || ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'sales' AND tc.constraint_type = 'FOREIGN KEY';
```

---

**Firmado:** DEBY - Lead Debugger  
**Validado contra:** SPEC-SALES.md, Supabase Auth Documentation
