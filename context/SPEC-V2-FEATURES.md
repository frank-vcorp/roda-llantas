# SPEC-V2-FEATURES: Equivalencias y Expiración

## 1. Caducidad de Cotizaciones (Quotation Expiration)

### 1.1 Objetivo
Las cotizaciones no deben ser eternas. Los precios cambian. Se requiere definir un tiempo de validez y bloquear la venta si ha expirado.

### 1.2 Base de Datos
- **Tabla:** `quotations`
- **Nuevo Campo:** `valid_until` (timestamptz, default `now() + interval '2 days'`)

### 1.3 Lógica de Negocio
- **Creación:** Al crear cotización, setear `valid_until` a 48 horas.
- **Venta (RPC `confirm_sale`):**
  - Agregar validación: `IF now() > v_quotation.valid_until THEN RAISE EXCEPTION 'Cotización expirada';`
- **UI:**
  - Mostrar "Válida hasta: DD/MM/AAAA HH:mm" en el detalle y PDF.
  - Si está vencida: Ocultar botón "Confirmar Venta" y mostrar botón "Recotizar" (que lleva al cotizador con los mismos items).
  - Badge de estado: "VENCIDA" (rojo) si `status='draft'` y fecha pasada.

---

## 2. Sugerencias Inteligentes (Rin Equivalente)

### 2.1 Objetivo
Cuando una búsqueda no arroja resultados exactos, el sistema debe "entender" qué medida buscaba el usuario y ofrecer alternativas lógicas (mismo Rin).

### 2.2 Lógica de Búsqueda
- **Hook/Ubicación:** `getInventory` o `searchInventory`.
- **Heurística de Fallback (Solo si 0 resultados):**
  1. Intentar extraer el número de Rin del texto de búsqueda (Regex: `R?(\d{2})`).
  2. Si se encuentra un número compatible con rin (13-24):
     - Ejecutar consulta secundaria: `SELECT * FROM inventory WHERE rim = DETECTED_RIM LIMIT 4`.
  3. Retornar estos items marcados como `suggestions: true`.

### 2.3 UI (Mobile & Desktop)
- Si no hay resultados exactos pero hay sugerencias:
  - Mostrar alerta: "No encontramos esa medida exacta, pero aquí hay otras opciones en Rin [XX]:"
  - Renderizar Cards/Tabla de sugerencias.

## 3. Plan de Trabajo
1. Migración DB (Expiration column & logic).
2. Update RPC `confirm_sale`.
3. Update UI Quotations.
4. Update Search Logic (`inventory.ts`).
5. Update UI Search.
