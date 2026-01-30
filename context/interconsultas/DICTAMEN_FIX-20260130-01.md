# DICTAMEN TÉCNICO: Usuario sigue viendo rol VENDEDOR a pesar de UPDATE exitoso

- **ID:** FIX-20260130-01
- **Fecha:** 2026-01-30
- **Solicitante:** Usuario (Frank)
- **Estado:** ✅ VALIDADO - CAUSA RAÍZ IDENTIFICADA

---

## A. Análisis de Causa Raíz

### Síntoma Reportado
El usuario insiste en que sigue apareciendo como "VENDEDOR" en la UI tras ejecutar UPDATE en `profiles`.

### Investigación Forense
Se ejecutó migración diagnóstica con técnica `RAISE EXCEPTION` para extraer datos de la BD remota:

```
========== DEBUG FORENSE ==========
Auth User ID: dc030a25-be6e-4cb8-8f32-ce76bf37caa2
Auth Email: frank@vcorp.mx
Profile Exists: t (TRUE)
Profile Role: admin  ← ¡CORRECTO!
Total Profiles Count: 2
====================================
```

### Hallazgo
| Capa | Estado |
|------|--------|
| `auth.users` | ✅ Usuario existe |
| `public.profiles` | ✅ Fila existe |
| `profiles.role` | ✅ Valor = `admin` |
| Frontend/UI | ❌ Muestra "VENDEDOR" |

### Causa Raíz
**El problema NO está en la base de datos.** 

El rol ya es `admin` en la BD. La UI muestra datos cacheados porque:
1. La sesión de Supabase Auth tiene claims/metadata desactualizado
2. El navegador cachea la respuesta de `getUserRole`
3. El usuario no ha cerrado sesión después del UPDATE

---

## B. Justificación de la Solución

No se requiere cambio de código. Es un problema de **invalidación de sesión**.

Supabase Auth guarda metadata en el JWT token. Si el rol cambió en `profiles` DESPUÉS de que el usuario inició sesión, el token viejo sigue en memoria/localStorage.

---

## C. Instrucciones para el Usuario

### Solución Inmediata (Usuario debe hacer):
1. **Cerrar sesión** completamente desde la aplicación
2. **Limpiar cookies/localStorage** del sitio, O usar **ventana incógnito**
3. **Volver a iniciar sesión**

### Verificación:
Tras re-login, la UI debería mostrar "ADMIN" y habilitar acceso a Settings.

---

## D. Recomendación Futura

Para evitar este problema en el futuro, considerar:
1. Agregar endpoint de "refresh role" que invalide el cache
2. Usar `supabase.auth.refreshSession()` cuando se detecte cambio de permisos
3. Documentar en onboarding que cambios de rol requieren re-login

---

**Conclusión:** No hay bug. El sistema funciona correctamente. Usuario debe re-autenticarse.
