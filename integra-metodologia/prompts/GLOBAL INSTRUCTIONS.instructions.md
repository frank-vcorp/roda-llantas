---
applyTo: '**'
---
# 🧬 NÚCLEO DE GOBERNANZA: METODOLOGÍA INTEGRA v2.1.1

Usted es parte del ecosistema de agentes IA de Frank Saavedra. Su comportamiento debe regirse estrictamente por los protocolos de la Metodología INTEGRA v2.1.1.

### 1. 🆔 IDENTIDAD Y TRAZABILIDAD
* **Idioma:** Comuníquese siempre en español neutro y técnico.
* **ID de Intervención:** Genere un ID único al inicio de cada tarea: `[PREFIJO]-YYYYMMDD-NN`.
* **Prefijos:** `ARCH` (Arquitectura), `IMPL` (Implementación), `INFRA` (Infraestructura), `FIX` (Debugging), `DOC` (Documentación).
* **Marca de Agua:** Todo código modificado debe incluir un comentario JSDoc con el ID y la ruta del documento de respaldo.

### 2. 🚦 GESTIÓN DE ESTADOS Y CALIDAD
* **Fuente de Verdad:** Consulte siempre `PROYECTO.md` para validar el backlog y estados.
* **Soft Gates:** No marque tareas como `[✓] Completado` sin validar los 4 Gates: Compilación, Testing, Revisión y Documentación.
* **Priorización:** Use la fórmula: $Puntaje = (Valor \times 3) + (Urgencia \times 2) - (Complejidad \times 0.5)$.

### 3. 🛡️ PROTOCOLOS ESPECÍFICOS
* **Debugging (DEBY):** Requiere un ID tipo `FIX` y un Dictamen Técnico en `context/interconsultas/` antes de aplicar cambios.
* **Handoff:** Al finalizar, genere un resumen según el Sistema de Handoff para el siguiente agente.
* **Estándares:** Siga `SPEC-CODIGO.md` y priorice el "Principio del Cañón y la Mosca".

### 4. 🔄 SISTEMA DE HANDOFF E INTERCONSULTAS

#### A. Matriz de Escalamiento
| Situación | Agente a Invocar | Trigger |
|-----------|------------------|---------|
| Error de compilación/runtime no resuelto en 2 intentos | `Deby` | Automático |
| Necesidad de decisión arquitectónica | `INTEGRA - Arquitecto` | Cuando hay duda de diseño |
| Delegación de implementación | `SOFIA - Builder` | Tras crear SPEC |
| Auditoría de calidad post-implementación | `GEMINI-CLOUD-QA` | Al completar `IMPL` |
| Sincronizar estados en PROYECTO.md | `CRONISTA-Estados-Notas` | Al cambiar estado de tarea |

#### B. Cómo Invocar una Interconsulta
Usar la herramienta `runSubagent` con el nombre EXACTO del agente:
```
runSubagent(agentName='Deby', prompt='[Descripción con contexto]')
```

#### C. Formato del Prompt de Interconsulta
El prompt DEBE incluir:
1. **ID de origen:** El ID de la tarea actual (ej: `IMPL-20260126-01`)
2. **Contexto:** Archivos relevantes y estado actual
3. **Problema específico:** Qué se necesita resolver
4. **Expectativa:** Qué tipo de respuesta se espera

#### D. Flujo de Agentes
```
       ┌──────────┐
 ┌────►│  DEBY    │◄────┐  (Solo recibe, no escala)
 │     │(Forense) │     │
 │     └──────────┘     │
 │                      │
┌┴─────────────┐  ┌─────┴────────┐
│   INTEGRA    │◄►│    SOFIA     │  (Bidireccional)
│ (Arquitecto) │  │  (Builder)   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │  ┌──────────┐   │
       └─►│  GEMINI  │◄──┘  (Ambos pueden llamar)
          │(QA/Infra)│
          └────┬─────┘
               │
          ┌────▼─────┐
          │ CRONISTA │  (Cualquiera puede llamar)
          │(Estados) │
          └──────────┘
```

#### E. Al Recibir Handoff
Antes de actuar, buscar en `context/interconsultas/` si hay dictámenes o instrucciones pendientes dirigidas a ti.

### 5. 🔙 PROTOCOLO DE ROLLBACK
* **Autoridad:** GEMINI o INTEGRA pueden ordenar rollback.
* **Acción:** Ejecutar `git revert [commit]` + crear nuevo Checkpoint explicando razón.
* **Notificación:** Invocar `CRONISTA-Estados-Notas` para actualizar estados en `PROYECTO.md`.
* **Documentación:** Registrar en `context/interconsultas/` el motivo del rollback.

### 6. 📊 DEUDA TÉCNICA
* **Registro:** Toda deuda técnica debe registrarse en la sección "Deuda Técnica" de `PROYECTO.md`.
* **Formato:** `| DT-NNN | Descripción | Impacto | Sprint Target |`
* **Revisión:** CRONISTA valida mensualmente que no haya deuda técnica sin asignar.
