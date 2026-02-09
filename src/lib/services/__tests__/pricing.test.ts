/**
 * Tests para el Motor de Precios
 * 
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */

import { calculatePublicPrice, enrichInventoryWithPrices } from "@/lib/logic/pricing-engine";
import { InventoryItem, PricingRule } from "@/lib/types";

describe("Pricing Service - calculatePublicPrice()", () => {
  const mockItem: InventoryItem = {
    id: "test-1",
    profile_id: "profile-1",
    sku: "TEST-001",
    brand: "Michelin",
    model: "Pilot Sport",
    medida_full: "175/60R15",
    width: 175,
    aspect_ratio: 60,
    rim: 15,
    load_index: "82",
    cost_price: 100000,
    stock: 10,
    stock_location: "Rack A",
    manual_price: null,
    updated_at: new Date().toISOString(),
  };

  const mockRules: PricingRule[] = [
    {
      id: "rule-1",
      profile_id: "profile-1",
      brand_pattern: "Michelin",
      margin_type: "percentage",
      margin_value: 1.30, // 30%
      min_profit: 0,
      is_active: true,
      priority: 100,
    },
    {
      id: "rule-2",
      profile_id: "profile-1",
      brand_pattern: "*",
      margin_type: "percentage",
      margin_value: 1.25, // 25%
      min_profit: 0,
      is_active: true,
      priority: 1,
    },
  ];

  test("Debería aplicar margen porcentual para marca coincidente", () => {
    const result = calculatePublicPrice(mockItem, mockRules);

    expect(result.public_price).toBe(130000); // 100000 * 1.30
    expect(result.is_manual).toBe(false);
    expect(result.margin_percentage).toBe(30);
    expect(result.rule_applied).toContain("Michelin");
  });

  test("Debería priorizar precio manual sobre reglas", () => {
    const itemWithManual: InventoryItem = {
      ...mockItem,
      manual_price: 150000,
    };

    const result = calculatePublicPrice(itemWithManual, mockRules);

    expect(result.public_price).toBe(150000);
    expect(result.is_manual).toBe(true);
    expect(result.rule_applied).toContain("OFERTA");
  });

  test("Debería aplicar regla global si no hay match de marca", () => {
    const itemOtherBrand: InventoryItem = {
      ...mockItem,
      brand: "Goodyear",
    };

    const result = calculatePublicPrice(itemOtherBrand, mockRules);

    expect(result.public_price).toBe(125000); // 100000 * 1.25
    expect(result.margin_percentage).toBe(25);
    expect(result.rule_applied).toContain("Global");
  });

  test("Debería retornar costo si no hay reglas", () => {
    const result = calculatePublicPrice(mockItem, []);

    expect(result.public_price).toBe(100000);
    expect(result.is_manual).toBe(false);
    expect(result.margin_percentage).toBe(0);
  });

  test("Debería soportar margen fijo", () => {
    const fixedRules: PricingRule[] = [
      {
        id: "rule-fixed",
        profile_id: "profile-1",
        brand_pattern: "*",
        margin_type: "fixed",
        margin_value: 20000, // Sumar 20000
        is_active: true,
      },
    ];

    const result = calculatePublicPrice(mockItem, fixedRules);

    expect(result.public_price).toBe(120000); // 100000 + 20000
    expect(result.margin_percentage).toBe(20);
  });

  test("Debería ignorar reglas inactivas", () => {
    const inactiveRules: PricingRule[] = [
      {
        id: "rule-inactive",
        profile_id: "profile-1",
        brand_pattern: "Michelin",
        margin_type: "percentage",
        margin_value: 1.50,
        is_active: false,
      },
      {
        id: "rule-active",
        profile_id: "profile-1",
        brand_pattern: "*",
        margin_type: "percentage",
        margin_value: 1.25,
        is_active: true,
      },
    ];

    const result = calculatePublicPrice(mockItem, inactiveRules);

    expect(result.public_price).toBe(125000);
    expect(result.rule_applied).toContain("Global");
  });
});

describe("Pricing Service - enrichInventoryWithPrices()", () => {
  const items: InventoryItem[] = [
    {
      id: "item-1",
      profile_id: "profile-1",
      sku: "SKU-001",
      brand: "Michelin",
      model: "Model1",
      medida_full: "175/60R15",
      width: 175,
      aspect_ratio: 60,
      rim: 15,
      load_index: "82",
      cost_price: 100000,
      stock: 5,
      stock_location: null,
      manual_price: null,
      updated_at: new Date().toISOString(),
    },
  ];

  const rules: PricingRule[] = [
    {
      id: "rule-1",
      profile_id: "profile-1",
      brand_pattern: "*",
      margin_type: "percentage",
      margin_value: 1.25,
      is_active: true,
    },
  ];

  test("Debería enriquecer items con propiedad _publicPrice", () => {
    const enriched = enrichInventoryWithPrices(items, rules);

    expect(enriched).toHaveLength(1);
    expect(enriched[0]._publicPrice).toBeDefined();
    expect(enriched[0]._publicPrice.public_price).toBe(125000);
  });

  test("Debería preservar propiedades originales", () => {
    const enriched = enrichInventoryWithPrices(items, rules);

    expect(enriched[0].id).toBe("item-1");
    expect(enriched[0].sku).toBe("SKU-001");
    expect(enriched[0].brand).toBe("Michelin");
  });
});
