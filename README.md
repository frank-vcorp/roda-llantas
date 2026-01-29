# 🧬 Plantilla: Metodología INTEGRA v2.4.0

Plantilla de proyecto configurada con la Metodología INTEGRA para desarrollo híbrido humano-IA.

## 🚀 Uso

1. **Crear nuevo repo desde esta plantilla** (botón "Use this template" en GitHub)
2. **Clonar el nuevo repo**
3. **Editar `PROYECTO.md`** con el nombre y objetivos de tu proyecto
4. **Comenzar a trabajar** con los agentes IA

## 📁 Estructura

```
mi-proyecto/
├── PROYECTO.md                 # 📋 Fuente de verdad del proyecto
├── Checkpoints/                # 📸 Snapshots de avance
├── context/                    # 📂 Artefactos del proyecto
│   ├── decisions/              #    └── ADRs (decisiones arquitectónicas)
│   ├── interconsultas/         #    └── Dictámenes técnicos
│   ├── handoffs/               #    └── Transferencias entre agentes
│   └── infraestructura/        #    └── Configs de hosting
├── integra-metodologia/        # 📚 Documentación de la metodología
│   ├── METODOLOGIA-INTEGRA.md  #    └── Documento maestro
│   ├── AGENTS.md               #    └── Mapa de agentes
│   ├── prompts/                #    └── Prompts de cada agente
│   └── meta/                   #    └── Plantillas y estándares
├── src/                        # 💻 Código de tu aplicación (crear)
└── ...                         # 📦 Otros archivos del proyecto
```

## 🤖 Agentes Disponibles

| Agente | Rol | Modelo |
|--------|-----|--------|
| **INTEGRA - Arquitecto** | Define qué construir, prioriza backlog | Gemini 3 Pro |
| **SOFIA - Builder** | Implementa código, escribe tests | Claude Haiku 4.5 |
| **GEMINI-CLOUD-QA** | Audita calidad, configura infra | Gemini 3 Pro |
| **Deby** | Debugging forense, dictámenes técnicos | Claude Opus 4.5 |
| **CRONISTA** | Mantiene PROYECTO.md actualizado | GPT-5.1 |

## 📖 Documentación

- [Metodología INTEGRA](integra-metodologia/METODOLOGIA-INTEGRA.md) - Documento maestro
- [Mapa de Agentes](integra-metodologia/AGENTS.md) - Cómo interactúan los agentes
- [Soft Gates](integra-metodologia/meta/soft-gates.md) - Criterios de calidad
- [SPEC-CODIGO](integra-metodologia/meta/SPEC-CODIGO.md) - Convenciones de código

## ⚡ Inicio Rápido

1. Abre el proyecto en VS Code
2. Invoca al agente `INTEGRA - Arquitecto`
3. Di: "Iniciemos un nuevo proyecto de [tu descripción]"
4. INTEGRA ejecutará el **Ritual de Discovery** y creará la arquitectura inicial

---

**Versión:** 2.4.0  
**Autor:** Frank Saavedra
