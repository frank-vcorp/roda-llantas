import { PricingRule, InventoryItem } from '@/lib/types';

/**
 * Calculadora de precios basada en reglas
 * @id IMPL-20260129-PRICING, IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */


export interface PriceCalculationResult {
  price: number;
  method: 'manual' | 'rule' | 'default';
  ruleName?: string;
  margin_percentage?: number;
  volume_tiers?: { min_qty: number; price: number; margin: number }[];
}

export interface PublicPriceResult {
  public_price: number;
  is_manual: boolean;
  rule_applied?: string;
  margin_percentage?: number;
  volume_tiers?: { min_qty: number; price: number; margin: number }[];
}


/**
 * Calcula el precio público para un item (Función pura)
 * Reutilizable en Server y Client
 */
export function calculateItemPrice(
  item: InventoryItem,
  rules: PricingRule[],
  quantity: number = 1
): PriceCalculationResult {
  // 1. Verificar precio manual override (Prioridad absoluta)
  if (item.manual_price && item.manual_price > 0) {
    return {
      price: item.manual_price,
      method: 'manual',
      ruleName: 'OFERTA (Manual)'
    };
  }

  // 2. Ordenar reglas por prioridad
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // 3. Buscar regla coincidente
  const matchedRule = sortedRules.find(rule => {
    // Si no está activa explícitamente falsa, asumimos true
    if (rule.is_active === false) return false;

    // Si no hay patrón de marca o es "*", es una regla global
    if (!rule.brand_pattern || rule.brand_pattern === '*') return true;

    const brand = (item.brand || '').toLowerCase();
    const pattern = rule.brand_pattern.toLowerCase();

    // Match parcial (ILIKE behavior simulado)
    return brand.includes(pattern) || pattern.includes(brand);
  });

  if (matchedRule) {
    let marginPercentage = matchedRule.margin_percentage;
    let ruleName = matchedRule.brand_pattern === "*"
      ? "Regla Global"
      : `Marca: ${matchedRule.brand_pattern}`;

    // Pre-calcular tiers de volumen si existen
    let computedTiers: { min_qty: number; price: number; margin: number }[] = [];
    let volumeRules: any[] = [];

    // 4. Verificar reglas por volumen (Kits)
    if (matchedRule.volume_rules && matchedRule.volume_rules.length > 0) {
      // Parsear si viene como string (defensivo)
      let rawVR = matchedRule.volume_rules;
      if (typeof rawVR === 'string') {
        try { volumeRules = JSON.parse(rawVR); } catch (e) { volumeRules = []; }
      } else {
        volumeRules = rawVR;
      }

      if (Array.isArray(volumeRules)) {
        // Ordenar por cantidad mínima descendente
        const sortedVolumeRules = [...volumeRules].sort((a, b) => b.min_qty - a.min_qty);

        // Calcular los precios para cada tier para mostrar en UI
        // Invertimos el orden para mostrar de menor a mayor cantidad en el array de tiers
        computedTiers = [...sortedVolumeRules]
          .sort((a, b) => a.min_qty - b.min_qty)
          .map(vr => {
            const mMultiplier = 1 + (vr.margin_percentage / 100);
            return {
              min_qty: vr.min_qty,
              margin: vr.margin_percentage,
              price: Math.round(item.cost_price * mMultiplier)
            };
          });

        const matchedVolume = sortedVolumeRules.find(vr => quantity >= vr.min_qty);

        if (matchedVolume) {
          marginPercentage = matchedVolume.margin_percentage;
          ruleName += ` (Volumen x${matchedVolume.min_qty})`;
        }
      }
    }

    // Cálculo: Costo + Margen
    const marginMultiplier = 1 + (marginPercentage / 100);
    const price = Math.round(item.cost_price * marginMultiplier);

    return {
      price: price,
      method: 'rule',
      ruleName: ruleName,
      margin_percentage: marginPercentage,
      volume_tiers: computedTiers.length > 0 ? computedTiers : undefined
    };
  }

  // 5. Fallback Default (Coste puro, sin margen si no hay reglas)
  return {
    price: item.cost_price,
    method: 'default',
    ruleName: 'Costo (Sin Regla)',
    margin_percentage: 0
  };
}


/**
 * Calcula el precio público basado en reglas de margen
 * 
 * Jerarquía:
 * 1. Si existe manual_price, retornar ese (OFERTA)
 * 2. Si existe regla para la marca, aplicar su margen
 * 3. Caso contrario, retornar costo (sin margen)
 * 
 * @param item - Item del inventario
 * @param rules - Array de reglas de precios
 * @returns Objeto con precio calculado y metadata
 */
export function calculatePublicPrice(
  item: InventoryItem,
  rules: PricingRule[],
  quantity: number = 1
): PublicPriceResult {
  const result = calculateItemPrice(item, rules, quantity);

  return {
    public_price: result.price,
    is_manual: result.method === 'manual',
    rule_applied: result.ruleName,
    margin_percentage: result.margin_percentage,
    volume_tiers: result.volume_tiers
  };
}

/**
 * Extiende items de inventario con precio público calculado
 * 
 * @param items - Array de items del inventario
 * @param rules - Array de reglas de precios
 * @returns Array de items con propiedad _publicPrice
 */
export function enrichInventoryWithPrices(
  items: InventoryItem[],
  rules: PricingRule[]
): any[] {
  return items.map((item) => ({
    ...item,
    _publicPrice: calculatePublicPrice(item, rules),
  }));
}
