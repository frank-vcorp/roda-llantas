import { PricingRule, InventoryItem } from '@/lib/types';

/**
 * Calculadora de precios basada en reglas
 * @id IMPL-20260129-PRICING, IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */

export class PricingEngine {
  private rules: PricingRule[];

  constructor(rules: PricingRule[]) {
    // Las reglas ya vienen ordenadas por prioridad del servidor
    // Si tienen campo priority, ordenarlas; si no, usarlas como están
    this.rules = rules.sort((a, b) => {
      const priorityA = a.priority || 50;
      const priorityB = b.priority || 50;
      return priorityB - priorityA;
    });
  }

  /**
   * Calcula el precio público para un item
   */
  public calculatePrice(item: InventoryItem): { price: number; method: 'manual' | 'rule' | 'default'; ruleName?: string } {
    
    // 1. Verificar precio manual override
    if (item.manual_price && item.manual_price > 0) {
      return { price: item.manual_price, method: 'manual' };
    }

    // 2. Buscar regla coincidente
    const matchedRule = this.rules.find(rule => {
      const isActive = rule.is_active !== false; // Default: true si no especificado
      if (!isActive) return false;
      
      // Si no hay patrón de marca o es "*", es una regla global
      if (!rule.brand_pattern || rule.brand_pattern === '*') return true;

      const brand = item.brand?.toLowerCase() || '';
      const pattern = rule.brand_pattern.toLowerCase();
      
      return brand.includes(pattern);
    });

    if (matchedRule) {
      // FIX REFERENCE: FIX-20260129-06 - Corregido uso de margin_percentage
      // margin_percentage = 30 significa +30% sobre cost_price
      const marginMultiplier = 1 + (matchedRule.margin_percentage / 100);
      const price = item.cost_price * marginMultiplier;

      return { 
        price: this.roundPrice(price), 
        method: 'rule', 
        ruleName: matchedRule.brand_pattern === '*' 
          ? 'Regla Global' 
          : `Marca: ${matchedRule.brand_pattern}`
      };
    }

    // 3. Fallback Default (margen del 25%)
    const GLOBAL_MARGIN = 1.25; // 25% de margen
    const price = item.cost_price * GLOBAL_MARGIN;

    return { 
      price: this.roundPrice(price), 
      method: 'default',
      ruleName: 'Margen Global (25%)'
    };
  }

  /**
   * Redondeo psicológico (Opcional, por ahora Math.ceil a entero)
   */
  private roundPrice(value: number): number {
    return Math.ceil(value);
  }
}
