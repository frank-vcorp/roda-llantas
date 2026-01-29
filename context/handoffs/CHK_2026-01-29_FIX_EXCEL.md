# Checkpoint de Reparación: Importador Excel (Riva Palacio)

**ID:** FIX-20260129-01
**Fecha:** 2026-01-29
**Estado:** [✓] Completado

## 📋 Resumen
Se ajustó la lógica de parsing de archivos Excel para soportar formatos con filas de metadatos/disclaimers antes de la cabecera real. El usuario confirmó la carga exitosa.

## 🛠 Cambios Técnicos
1. **Algoritmo de Detección de Headers (`excel-parser.ts`):**
   - Se reemplazó la búsqueda lineal simple por un sistema de puntuación (Scoring).
   - Ahora se escanean las primeras 25 filas.
   - La fila con más coincidencias de palabras clave (`MARCA`, `MODELO`, `PRECIO`, etc.) es seleccionada como header.
   - Se penalizan explícitamente filas con menos de 2 celdas distintas para evitar falsos positivos con disclaimers o títulos.
   
2. **Normalización:**
   - Se aplica `trim()` y `toUpperCase()` a los headers detectados para evitar errores por espacios invisibles.

## 🧪 Validación
- **Prueba:** Carga de archivo "Riva Palacio" con disclaimer en fila 5 y headers en fila 7.
- **Resultado:** El parser ignoró la fila 5 y mapeó correctamente las columnas de la fila 7. Confirmado por el usuario.
