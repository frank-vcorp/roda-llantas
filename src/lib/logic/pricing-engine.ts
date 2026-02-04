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

    // 4. Verificar reglas por volumen (Kits)
    if (matchedRule.volume_rules && matchedRule.volume_rules.length > 0) {
      // Parsear si viene como string (defensivo)
      let volumeRules = matchedRule.volume_rules;
      if (typeof volumeRules === 'string') {
        try { volumeRules = JSON.parse(volumeRules); } catch (e) { volumeRules = []; }
      }

      if (Array.isArray(volumeRules)) {
        // Ordenar por cantidad mínima descendente
        const sortedVolumeRules = [...volumeRules].sort((a, b) => b.min_qty - a.min_qty);
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
      margin_percentage: marginPercentage
    };
  }

  // 5. Fallback Default (Coste puro, sin margen si no hay reglas)
  // El sistema original usaba cost * 1.3 como fallback en UI, pero el servicio retornaba cost
  // Retornaremos cost para ser consistentes con el servicio
  return {
    price: item.cost_price,
    method: 'default',
    ruleName: 'Costo (Sin Regla)',
    margin_percentage: 0
  };
}

