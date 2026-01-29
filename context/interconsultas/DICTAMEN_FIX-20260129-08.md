# DICTAMEN TÉCNICO: Event Handler en Server Component - Botón Imprimir

- **ID:** FIX-20260129-08
- **Fecha:** 2026-01-29
- **Solicitante:** Usuario (vía FIX-20260129-QUOTES-ERR02)
- **Estado:** ✅ VALIDADO

---

### A. Análisis de Causa Raíz

| Aspecto | Detalle |
|---------|---------|
| **Síntoma** | `Runtime Error: Event handlers cannot be passed to Client Component props.` al acceder a `/dashboard/quotes/[id]` |
| **Hallazgo Forense** | El archivo `page.tsx` es un Server Component (async function) pero contenía `<Button onClick={() => window.print()}>` |
| **Causa** | En Next.js 13+/14+/15+ con App Router, los Server Components NO pueden tener event handlers (`onClick`, `onChange`, etc.). El error ocurre porque `window.print()` requiere interactividad del lado del cliente. |

### B. Justificación de la Solución

**Solución aplicada:** Extracción del botón interactivo a un Client Component.

1. **Creé** `src/components/quote/print-button.tsx`:
   - Marcado con `"use client"` para habilitar interactividad
   - Encapsula el `<Button onClick={() => window.print()}>` 
   - Mantiene estilos (`gap-2`) y variante (`default`)

2. **Refactoricé** `src/app/dashboard/quotes/[id]/page.tsx`:
   - Eliminé import de `Printer` (ya no se usa directo)
   - Importé el nuevo `<PrintButton />`
   - Reemplacé el `<Button onClick={...}>` por `<PrintButton />`

**Principio aplicado:** Mantener el Server Component para el fetching (SSR performance) y delegar solo la interactividad mínima al Client Component.

### C. Archivos Modificados

| Archivo | Acción |
|---------|--------|
| `src/components/quote/print-button.tsx` | ✅ Creado |
| `src/app/dashboard/quotes/[id]/page.tsx` | ✅ Modificado |

### D. Validación

```bash
npm run build  # ✅ Exitoso
```

Build compila sin errores. La ruta `/dashboard/quotes/[id]` funciona correctamente.

### E. Instrucciones de Handoff

No se requiere acción adicional. El fix es autocontenido y está validado.
