import * as XLSX from 'xlsx';

/**
 * @fileoverview Excel Parser - Lógica de parsing y normalización de medidas
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 * Implementa normalización según SPEC-DATA-MODEL y Soporte para formato "Riva Palacio"
 */

// Regex para parsear medidas de llantas.
// Prioridad: 
// 1. Flotación (31X10.50R15)
// 2. Estándar (205/55R16)
// 3. Camión/Industrial (11R22.5, 7.50-16)

const REGEX_FLOTATION = /\b(\d{2}x\d{1,2}(?:\.\d+)?)[R\-\s]*(\d{2})\b/i;
const REGEX_STANDARD = /\b(\d{3})[\/\-\s]+(\d{2})[RZr\-\s]*(\d{2}(?:\.\d)?)\b/i;
// Se actualiza REGEX_TRUCK para soportar formatos industriales con sufijos como "11-L 16" o "19.5-L 24"
const REGEX_TRUCK = /\b(\d{1,4}(?:\.\d+)?)[R\-\sL]+(\d{2}(?:\.\d)?)\b/i;
// Nuevo regex para ATV/Agricola (ej: 10x15, 26x9-14) que no encaja en flotation estricto
const REGEX_ATV_AGRO = /\b(\d{1,2}(?:\.\d+)?)x(\d{1,2}(?:\.\d+)?)[\-\s]*(\d{1,2})\b/i;
// Regex simple para 10x15 (Diameter x Rim) sin width explicito
const REGEX_SIMPLE_AGRO = /\b(\d{1,2}(?:\.\d+)?)x(\d{1,2}(?:\.\d+)?)\b/i;

export interface InventoryItem {
  description: string; // Columna "DESCRIPCION" original
  brand: string;
  model: string;
  medida_full: string;
  width: number;
  aspect_ratio: number;
  rim: number;
  cost_price: number;
  stock: number;
  load_index?: string;
  sku?: string;
  stock_location?: string;
}

interface ParsedRow {
  [key: string]: unknown;
}

/**
 * Parsea un archivo Excel/CSV y retorna un array de InventoryItem
 * Soporta headers estándar y el formato "Riva Palacio" detectando la fila de headers real.
 */
export async function parseInventoryExcel(
  file: File
): Promise<InventoryItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }

        // Leer todo como array de arrays para buscar headers
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawRows.length === 0) {
          reject(new Error('El archivo está vacío'));
          return;
        }

        // Buscar fila de headers usando un sistema de puntuación
        let bestHeaderRowIndex = 0;
        let maxScore = 0;

        // Palabras clave que esperamos encontrar en la fila de cabecera
        const targetHeaders = [
          'DESCRIPCION', 'DESCRIPTION', // Muy probable
          'MARCA', 'BRAND',
          'CLAVE', 'CODIGO', 'CODE', 'ID', 'SKU',
          'PRECIO', 'COSTO', 'COST', 'PRICE',
          'EXISTENCIA', 'STOCK', 'CANTIDAD', 'QTY',
          'MEDIDA', 'MEASURE', 'SIZE',
          'MODELO', 'MODEL', 'PATTERN'
        ];

        // Escanear las primeras 20 filas
        const rowsToScan = Math.min(rawRows.length, 25);

        for (let i = 0; i < rowsToScan; i++) {
          const row = rawRows[i];
          let score = 0;

          // Convertir fila a string para búsqueda rápida pero verificar celdas individuales
          // para evitar falsos positivos como "LOS PRECIOS..."
          if (!Array.isArray(row)) continue;

          const rowCells = row.map(cell => String(cell).toUpperCase().trim());

          targetHeaders.forEach(header => {
            // Buscamos coincidencia exacta o "contiene" pero celda por celda
            if (rowCells.some(cell => cell.includes(header))) {
              score++;
            }
          });

          // Penalizar filas que tienen un solo string muy largo (probablemente títulos o disclaimers)
          const distinctCells = rowCells.filter(c => c.length > 0).length;
          if (distinctCells < 2 && score > 0) {
            score = 0; // Descartar falsos positivos de una sola celda
          }

          if (score > maxScore) {
            maxScore = score;
            bestHeaderRowIndex = i;
          }
        }

        // Si no encontramos nada con buen score, nos quedamos con 0 o el mejor intento
        // Re-parsear usando la fila correcta como header
        const rows: ParsedRow[] = XLSX.utils.sheet_to_json(worksheet, {
          range: bestHeaderRowIndex
        });

        // Mapear y normalizar cada fila
        const items: InventoryItem[] = rows
          .map((row, index) => {
            try {
              // Validar si es una fila vacia (a veces quedan al final)
              if (Object.keys(row).length === 0) return null;
              return normalizeRow(row, index);
            } catch (err) {
              // Este bloque catch ahora debería ser inalcanzable dado el try/catch interno de normalizeRow,
              // pero lo mantenemos por seguridad extrema.
              console.warn(
                `⚠️ Fila ${index + bestHeaderRowIndex + 2} omitida por error crítico:`,
                err instanceof Error ? err.message : String(err)
              );
              // Fallback extremo
              return {
                brand: 'ERROR CRITICO',
                model: 'ERROR',
                medida_full: 'ROW ERROR',
                width: 0,
                aspect_ratio: 0,
                rim: 0,
                cost_price: 0,
                stock: 0
              };
            }
          })
          .filter((item): item is InventoryItem => item !== null);

        if (items.length === 0) {
          reject(
            new Error('No se pudieron procesar filas válidas. Verifique que el archivo tenga datos y columnas reconocibles.')
          );
          return;
        }

        resolve(items);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error desconocido'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normaliza una fila del Excel a la estructura de InventoryItem
 * ESTRATEGIA DE RESCATE: NUNCA descarta una fila, intenta rescatar el máximo de datos
 */
function normalizeRow(row: ParsedRow, rowIndex: number): InventoryItem {
  try {
    // 1. Detectar Formato "Riva Palacio" (Columna DESCRIPCION compuesta)
    const description = extractField(row, ['DESCRIPCION', 'DESCRIPTION']);

    if (description) {
      try {
        // Formato compuesto: "LLANTA 155-R 12 HIFLY SUPER2000"
        const parsedDesc = parseCompositeDescription(description);

        // Extraer otros campos de este formato
        // CLAVE -> SKU, EXISTENCIA -> Stock, PRECIO -> Costo
        const sku = extractField(row, ['CLAVE', 'CODE', 'ID'], false);
        let stock = 0;
        let costo = 0;

        try {
          stock = extractNumberField(row, ['EXISTENCIA', 'STOCK', 'QTY'], false);
        } catch (e) {
          console.warn(`⚠️ Stock parsing failed for row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
          stock = 0;
        }

        try {
          costo = extractNumberField(row, ['PRECIO', 'COST', 'PRICE'], false);
        } catch (e) {
          console.warn(`⚠️ Cost parsing failed for row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
          costo = 0;
        }

        // Si parsedDesc tiene medida_full válida, usarlo; si no, rescatar
        if (parsedDesc.medida_full && parsedDesc.width > 0) {
          return {
            description: description, // Guardar texto original
            brand: parsedDesc.brand || 'SIN CLASIFICAR',
            model: parsedDesc.model,
            medida_full: parsedDesc.medida_full,
            width: parsedDesc.width,
            aspect_ratio: parsedDesc.aspect_ratio,
            rim: parsedDesc.rim,
            cost_price: costo,
            stock: Math.max(0, stock),
            sku: sku,
          };
        } else {
          // Rescate: usar el valor raw de description
          return {
            description: description, // Guardar texto original
            brand: parsedDesc.brand || 'SIN CLASIFICAR',
            model: 'REVISAR MANUALMENTE',
            medida_full: description, // Valor crudo para que usuario vea qué falló
            width: 0,
            aspect_ratio: 0,
            rim: 0,
            cost_price: costo,
            stock: Math.max(0, stock),
            sku: sku,
          };
        }
      } catch (descError) {
        // Rescate para formato compuesto que falló
        console.warn(
          `⚠️ Composite description parsing failed for row ${rowIndex}: ${descError instanceof Error ? descError.message : String(descError)}`
        );
        let stock = 0;
        let costo = 0;

        try {
          stock = extractNumberField(row, ['EXISTENCIA', 'STOCK', 'QTY'], false);
        } catch (e) {
          stock = 0;
        }

        try {
          costo = extractNumberField(row, ['PRECIO', 'COST', 'PRICE'], false);
        } catch (e) {
          costo = 0;
        }

        return {
          description: description, // Guardar texto original
          brand: 'SIN CLASIFICAR',
          model: 'REVISAR MANUALMENTE',
          medida_full: description, // Valor crudo
          width: 0,
          aspect_ratio: 0,
          rim: 0,
          cost_price: costo,
          stock: Math.max(0, stock),
        };
      }
    }

    // 2. Formato Estándar (Columnas separadas)
    let brand = 'SIN CLASIFICAR';
    let medida = '';
    let model = 'REVISAR MANUALMENTE';
    let costo = 0;
    let stock = 0;

    // Intento de extracción de Brand
    try {
      brand = extractField(row, ['Marca', 'Brand', 'MARCA', 'BRAND'], false).toUpperCase().trim() || 'SIN CLASIFICAR';
    } catch (e) {
      console.warn(`⚠️ Brand field not found for row ${rowIndex}`);
      brand = 'SIN CLASIFICAR';
    }

    // Intento de extracción de Medida
    try {
      medida = extractField(row, ['Medida', 'Measure', 'MEDIDA', 'MEASURE'], false);
    } catch (e) {
      console.warn(`⚠️ Measure field not found for row ${rowIndex}`);
      medida = '';
    }

    // Intento de extracción de Modelo
    try {
      model = extractField(row, ['Modelo', 'Model', 'MODELO', 'MODEL'], false).toUpperCase().trim() || 'REVISAR MANUALMENTE';
    } catch (e) {
      console.warn(`⚠️ Model field not found for row ${rowIndex}`);
      model = 'REVISAR MANUALMENTE';
    }

    // Intento de extracción de Costo
    try {
      costo = extractNumberField(row, ['Costo', 'Cost', 'COSTO', 'COST', 'PRECIO', 'PRICE', 'Precio'], false);
    } catch (e) {
      console.warn(`⚠️ Cost parsing failed for row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
      costo = 0;
    }

    // Intento de extracción de Stock
    try {
      stock = extractNumberField(row, ['Stock', 'STOCK'], false);
    } catch (e) {
      console.warn(`⚠️ Stock parsing failed for row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
      stock = 0;
    }

    // Campos opcionales
    let loadIndex = '';
    let sku = '';
    let stockLocation = '';

    try {
      loadIndex = extractField(row, ['Índice', 'Load Index', 'ÍNDICE', 'LOAD_INDEX'], false);
    } catch (e) {
      loadIndex = '';
    }

    try {
      sku = extractField(row, ['SKU', 'sku'], false);
    } catch (e) {
      sku = '';
    }

    try {
      stockLocation = extractField(row, ['Ubicación', 'Location', 'UBICACIÓN', 'LOCATION'], false);
    } catch (e) {
      stockLocation = '';
    }

    // Parsear y validar medida
    const parsedMeasure = parseTireMeasure(medida);

    // Crear una descripción sintética si no vino una (para formato estándar)
    const syntheticDesc = `${brand} ${model} ${medida}`;

    if (parsedMeasure) {
      // Medida válida - retornar normalmente
      return {
        description: syntheticDesc,
        brand: brand,
        model: model,
        medida_full: medida.toUpperCase().trim(),
        width: parsedMeasure.width,
        aspect_ratio: parsedMeasure.aspect_ratio,
        rim: parsedMeasure.rim,
        cost_price: costo,
        stock: Math.max(0, stock),
        ...(loadIndex && { load_index: loadIndex.toUpperCase().trim() }),
        ...(sku && { sku: sku.trim() }),
        ...(stockLocation && { stock_location: stockLocation.trim() }),
      };
    } else {
      // Rescate: medida inválida o vacía
      console.warn(`⚠️ Invalid or missing measure for row ${rowIndex}: "${medida}"`);
      return {
        description: syntheticDesc,
        brand: brand,
        model: model,
        medida_full: medida || 'NO ESPECIFICADA', // Valor crudo o placeholder
        width: 0,
        aspect_ratio: 0,
        rim: 0,
        cost_price: costo,
        stock: Math.max(0, stock),
        ...(loadIndex && { load_index: loadIndex.toUpperCase().trim() }),
        ...(sku && { sku: sku.trim() }),
        ...(stockLocation && { stock_location: stockLocation.trim() }),
      };
    }
  } catch (unexpectedError) {
    // Rescate de último recurso: capturar ANY error no previsto
    console.error(`🆘 Critical error processing row ${rowIndex}:`, unexpectedError);
    return {
      description: 'ERROR DE FILA',
      brand: 'SIN CLASIFICAR',
      model: 'REVISAR MANUALMENTE',
      medida_full: 'ERROR AL PROCESAR',
      width: 0,
      aspect_ratio: 0,
      rim: 0,
      cost_price: 0,
      stock: 0,
    };
  }
}

/**
 * Descompone una string de descripción tipo "LLANTA 175-70-13 HIFLY HF201"
 * ESTRATEGIA DE RESCATE: Retorna el texto original en medida_full si no hay match, en lugar de cadenas vacías
 */
function parseCompositeDescription(desc: string) {
  try {
    const cleanDesc = desc.replace(/^LLANTA\s+/i, '').trim(); // Quitar prefijo común

    // Intentar matching por prioridad
    let match = cleanDesc.match(REGEX_FLOTATION);
    let type = 'FLOTATION';

    if (!match) {
      match = cleanDesc.match(REGEX_STANDARD);
      type = 'STANDARD';
    }

    if (!match) {
      match = cleanDesc.match(REGEX_TRUCK);
      type = 'TRUCK';
    }

    if (!match) {
      match = cleanDesc.match(REGEX_ATV_AGRO);
      type = 'ATV';
    }

    if (!match) {
      match = cleanDesc.match(REGEX_SIMPLE_AGRO);
      // Solo si es un formato valido como 10x15 (Agricultural)
      if (match && parseFloat(match[1]) > 5 && parseFloat(match[2]) > 5) {
        type = 'SIMPLE_AGRO';
      } else {
        match = null; // Falso positivo potencial (ej: 2x4)
      }
    }

    if (!match) {
      // RESCATE: No hay match de regex. Retornar el texto original y valores de "No Clasificado"
      console.warn(`⚠️ No regex match found for composite description: "${desc}"`);
      return {
        brand: 'SIN CLASIFICAR',
        model: 'REVISAR MANUALMENTE',
        medida_full: desc, // Retornar el valor crudo para que usuario vea qué falló
        width: 0,
        aspect_ratio: 0,
        rim: 0
      };
    }

    const medidaRaw = match[0];
    let width = 0;
    let aspect_ratio = 0;
    let rim = 0;
    let medida_full = '';

    if (type === 'FLOTATION') {
      // Grupo 1: "31x10.50", Grupo 2: "15"
      medida_full = `${match[1].toUpperCase()}R${match[2]}`;
      // Estimación bruta para ordenar: width = diameter (31) * 10?? No, usemos diameter
      // Hack: Store Diameter as Width for sorting, Aspect as 0
      const parts = match[1].toLowerCase().split('x');
      width = parseFloat(parts[0]) * 25.4; // Diameter to mm roughly
      aspect_ratio = 0;
      rim = parseFloat(match[2]);
    } else if (type === 'STANDARD') {
      // Grupo 1: width, 2: aspect, 3: rim
      width = parseInt(match[1]);
      aspect_ratio = parseInt(match[2]);
      rim = parseFloat(match[3]);
      medida_full = `${width}/${aspect_ratio}R${rim}`;
    } else if (type === 'TRUCK') {
      // Grupo 1: "11" or "7.50" or "155", Grupo 2: "22.5" or "12"
      const section = parseFloat(match[1]);
      rim = parseFloat(match[2]);

      // FIX: Distinguir entre medidas métricas (mm) y medidas imperiales (pulgadas)
      // Si la sección es mayor a 50, asumimos milímetros (ej: 155 R12, 295/80 R22.5)
      // Si es menor a 50, asumimos pulgadas (ej: 11 R22.5, 7.50 R16)
      if (section > 50) {
        width = section;
      } else {
        width = section * 25.4; // Inches to mm
      }

      aspect_ratio = 0; // Usually implied 80 or 100
      medida_full = `${match[1]}R${match[2]}`;
    } else if (type === 'ATV') {
      // Match: 26x9-14 -> G1: 26, G2: 9, G3: 14
      const height = match[1];
      const w = match[2];
      const r = match[3];
      medida_full = `${height}x${w}-${r}`;

      width = parseFloat(height) * 25.4; // Use height as width proxy for sorting
      aspect_ratio = 0;
      rim = parseFloat(r);
    } else if (type === 'SIMPLE_AGRO') {
      // Match: 10x15 -> G1: 10, G2: 15
      const w = match[1];
      const r = match[2];
      medida_full = `${w}x${r}`;
      width = parseFloat(w) * 25.4;
      aspect_ratio = 0;
      rim = parseFloat(r);
    }

    // Remover la medida del string para encontrar marca y modelo
    // String original: "175-70-13 HIFLY HF201" -> Remover match -> " HIFLY HF201"
    const remainder = cleanDesc.replace(medidaRaw, '').trim();

    // Heurística simple: Primera palabra es Marca, resto es Modelo
    // "HIFLY HF201" -> Marca: HIFLY, Modelo: HF201
    const parts = remainder.split(/\s+/);

    let brand = parts[0] || 'SIN CLASIFICAR';
    let modelTokens = parts.slice(1);

    // FIX: Detectar y remover prefijos numéricos basura (ej: "14-", "18-", "100")
    // que aparecen antes de la marca en algunos formatos de inventario.
    // Si la primera palabra es solo números o números con guión al final, y hay más texto,
    // asumimos que es un prefijo y la verdadera marca es la siguiente palabra.
    if (parts.length > 1 && /^\d+[-]?$/.test(brand)) {
      brand = parts[1];
      modelTokens = parts.slice(2);
    }

    // CASO ESPECIAL: Marcas compuestas comunes (ej: "JK TYRE", "DOUBLE KING")
    // Si la marca detectada y la primera palabra del modelo forman una marca conocida, unificarlas.
    const COMMON_BRANDS = ['JK', 'DOUBLE', 'GENERAL', 'BLACK'];
    if (COMMON_BRANDS.includes(brand.toUpperCase()) && modelTokens.length > 0) {
      brand = `${brand} ${modelTokens[0]}`;
      modelTokens = modelTokens.slice(1);
    }

    const model = modelTokens.join(' ') || 'REVISAR MANUALMENTE';

    return {
      brand: brand.toUpperCase(),
      model: model.toUpperCase(),
      medida_full,
      width: Math.round(width),
      aspect_ratio,
      rim
    };
  } catch (error) {
    // Rescate de último recurso para parseCompositeDescription
    console.error(`🆘 Critical error in parseCompositeDescription: ${error instanceof Error ? error.message : String(error)}`);
    return {
      brand: 'SIN CLASIFICAR',
      model: 'REVISAR MANUALMENTE',
      medida_full: desc, // Retornar el valor crudo
      width: 0,
      aspect_ratio: 0,
      rim: 0
    };
  }
}


/**
 * Extrae un valor de texto del objeto, buscando múltiples claves posibles
 * Realiza búsqueda insensible a mayúsculas/minúsculas y espacios
 */
function extractField(
  row: ParsedRow,
  possibleKeys: string[],
  required = false
): string {
  // 1. Intento Exacto (Fast path)
  for (const key of possibleKeys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }

  // 2. Búsqueda Fuzzy (Trim + Case Insensitive + Partial Match)
  // Útil para columnas " PRECIO " o "marca " o "Costo Unitario"
  const rowKeys = Object.keys(row);
  for (const targetKey of possibleKeys) {
    const normalizedTarget = targetKey.trim().toUpperCase();

    // 2a. Coincidencia Exacta Normalizada
    let foundKey = rowKeys.find(
      k => k.trim().toUpperCase() === normalizedTarget
    );

    // 2b. Coincidencia Parcial (Contains)
    // Si no encontramos exacto, buscamos si la columna contiene la palabra clave
    // Ej: target="COSTO" machea columna="COSTO UNITARIO"
    if (!foundKey) {
      foundKey = rowKeys.find(
        k => k.trim().toUpperCase().includes(normalizedTarget)
      );
    }

    if (foundKey) {
      const value = row[foundKey];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
  }

  if (required) {
    const availableKeys = Object.keys(row).join(', ');
    throw new Error(
      `Campo obligatorio no encontrado. Esperado: ${possibleKeys[0]}. Columnas encontradas en esta fila: [${availableKeys}]`
    );
  }

  return '';
}

/**
 * Extrae un valor numérico del objeto
 */
function extractNumberField(
  row: ParsedRow,
  possibleKeys: string[],
  required = false
): number {
  const field = extractField(row, possibleKeys, required);
  if (!field) return 0;

  // FIX-20260219: Limpiar formato de moneda ($ 900.00, $1,200.50) antes de parsear
  // 1. Remover todo lo que no sea dígito, punto o signo negativo
  // 2. Cuidado con formatos europeos (1.200,50) - Asumimos formato US/MX (1,200.50) por ahora
  const cleanField = field.replace(/[$,\s]/g, '');

  const num = parseFloat(cleanField);
  if (isNaN(num)) {
    throw new Error(
      `Valor no numérico en ${possibleKeys[0]}: "${field}"`
    );
  }

  return num;
}

/**
 * Parsea una medida de llanta usando el regex definido en SPEC-DATA-MODEL
 * Soporta formatos: 205/55R16, 205-55-16, 205 55 16, 31x10.50R15, 11R22.5
 */
function parseTireMeasure(
  measure: string
): { width: number; aspect_ratio: number; rim: number } | null {
  const norm = measure.trim();

  // 1. Flotation
  let match = norm.match(REGEX_FLOTATION);
  if (match) {
    const parts = match[1].toLowerCase().split('x');
    const diameter = parseFloat(parts[0]);
    // const section = parseFloat(parts[1]); 
    const w = diameter * 25.4;
    const r = parseFloat(match[2]);
    return { width: Math.round(w), aspect_ratio: 0, rim: r };
  }

  // 2. Standard
  match = norm.match(REGEX_STANDARD);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      aspect_ratio: parseInt(match[2], 10),
      rim: parseFloat(match[3]),
    };
  }

  // 3. Truck
  match = norm.match(REGEX_TRUCK);
  if (match) {
    const val = parseFloat(match[1]);
    const r = parseFloat(match[2]);

    // FIX: Mismo criterio de metrico vs imperial que arriba
    const w = val > 50 ? val : val * 25.4;

    return {
      width: Math.round(w),
      aspect_ratio: 0,
      rim: r
    };
  }

  return null;
}
