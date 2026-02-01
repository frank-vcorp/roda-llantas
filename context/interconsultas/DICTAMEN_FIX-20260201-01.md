---
id: FIX-20260201-01
date: 2026-02-01
agent: DEBY
status: RESUELTO
severity: ALTA
---

# 🚨 DICTAMEN DE CORRECCIÓN DE ERROR

## 1. Descripción del Incidente
El usuario reportó múltiples errores en consola relacionados con el Service Worker (SW) en producción (`https://roda-llantas.vercel.app/`):
> *The FetchEvent for "<URL>" resulted in a network error response: a redirected response was used for a request whose redirect mode is not "follow".*

**Impacto:** Los usuarios experimentan pantallas en blanco o fallos de red al intentar cargar la aplicación, especialmente cuando hay redirecciones (ej. `/` -> `/login`).

## 2. Análisis Forense
- **Causa Raíz:** El archivo `public/sw.js` interceptaba todas las peticiones `fetch`, incluidas las de navegación (`mode: 'navigate'`).
- **Mecanismo de Fallo:** 
    1. El navegador solicita la página principal `/`.
    2. El SW intercepta y hace `fetch('/')`.
    3. El Middleware (`src/middleware.ts`) redirige (307) a `/login` si no hay sesión.
    4. El `fetch` dentro del SW recibe una respuesta opaca de redirección.
    5. El SW intenta devolver esa respuesta opaca al navegador para una petición de navegación.
    6. **Error:** El navegador bloquea esto por seguridad/especificación si la petición original no tenía modo `follow` explícito manejado por el SW.

## 3. Solución Implementada
Se modificó `public/sw.js` para:
1. **Ignorar Navegación:** El SW ahora retorna inmediatamente (no llama a `respondWith`) si `event.request.mode === 'navigate'`. Esto permite que el navegador maneje la carga de la página y las redirecciones de forma nativa.
2. **Eliminar Caché de HTML:** Se eliminaron `/` y `/login` de la lista de precaché. En aplicaciones Next.js dinámicas, cachear HTML estáticamente en un SW básico causa problemas de autenticación y contenido obsoleto.

## 4. Verificación
- El Service Worker se actualizará automáticamente en los navegadores de los usuarios tras el despliegue.
- Las redirecciones de autenticación funcionarán correctamente sin intervención del SW.

---
**Firmado,**
`@DEBY` - Agente de Infraestructura y QA
