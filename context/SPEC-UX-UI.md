# SPEC-UX-UI

## Objetivo
Definir cómo se diseñan, documentan e implementan las interfaces de usuario (UI) y la experiencia de usuario (UX) del proyecto, integrando herramientas externas como Stitch, Figma u otras, y alineándolas con la Metodología INTEGRA.

---

## Fuentes de Diseño

Las pantallas, flujos y componentes pueden venir de distintas herramientas:

- Stitch (u otras herramientas de prototipado)
- Figma / FigJam
- Diagramas y mockups en Docs, Slides u otras

### Principio

> Siempre usar la herramienta más adecuada para el contexto (Stitch, Figma, Tailwind UI, componentes propios, etc.), aplicando el “principio del cañón y la mosca”: la solución más simple que resuelva el problema sin sobre‑diseñar.

---

## Integración con PROYECTO.md

Cada tarea de UI/UX en `PROYECTO.md` debe:

- Tener un enlace explícito al diseño origen (Stitch, Figma, etc.).
- Indicar claramente qué parte del diseño cubre (screen, flow, componente).
- Seguir el flujo de estados Integra (`[ ] [~] [/] [V] [R] [✓] [X]`).

Ejemplo:

```markdown
### [UI-01] Pantalla de Login

- [~] Diseño y especificación de pantalla de login
  **Meta:**
  - Prioridad: 🔴 Alta
  - Estimación: 4h
  - Asignado: CODEX
  - Diseño origen: [Stitch - Flow Auth v1](https://stitch.example.com/flow-auth)
  - Notas: Seguir SPEC-UX-UI para validaciones y estados de error
```

---

## Criterios de Diseño UX/UI

Antes de marcar una tarea de UI como `[✓]`:

- Cumple criterios básicos de:
  - Consistencia visual (colores, tipografía, espaciados)
  - Accesibilidad mínima (contraste, navegación por teclado, labels claros)
  - Responsividad (desktop/tablet/móvil según alcance del proyecto)
- Los componentes clave están alineados con:
  - Tailwind / sistema de diseño elegido
  - Patrones de interacción definidos en el proyecto

Gemini Code Assist puede sugerir:

- Ajustar estilos usando Tailwind (u otra librería) donde tenga más sentido.
- Refactorizar componentes para reuse si ve patrones repetidos.

---

## HandOff entre Diseño y Código

1. Diseño inicial en Stitch/Figma (Frank + diseñador + CODEX, según proyecto).
2. CODEX traduce ese diseño en tareas concretas en `PROYECTO.md`.
3. CODEX o Gemini implementan la UI:
   - Estructura de componentes
   - Integración con lógica y datos
   - Estados de carga y error
4. Gemini revisa la implementación:
   - UX coherente con diseño
   - Código limpio y mantenible
   - Cumplimiento de `meta/SPEC-CODIGO.md` y `meta/criterios_calidad.md`.

---

## Notas

- Esta SPEC es intencionalmente genérica para que puedas cambiar de herramienta (Stitch, Figma, etc.) sin modificar la metodología.
- En proyectos concretos puedes extender este archivo con:
  - Guidelines de marca (paleta de colores, tipografía, componentes base).
  - Enlaces a librerías específicas (design system propio, Tailwind config, etc.).

