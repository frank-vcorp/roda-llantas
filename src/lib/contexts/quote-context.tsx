/**
 * Quote Context: Manejo de estado de cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-01
 * @ref context/SPEC-QUOTATIONS.md
 *
 * Proporciona funcionalidad para seleccionar items del inventario
 * y mantener el estado de la cotización en progreso.
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { InventoryItem } from "@/lib/types";

/**
 * Estructura de un item en la cotización
 */
export interface QuoteItem {
  item: InventoryItem;
  quantity: number;
}

/**
 * Estructura del contexto de cotización
 */
interface QuoteContextType {
  items: QuoteItem[];
  addItem: (item: InventoryItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearQuote: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

/**
 * Crear el contexto
 */
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

/**
 * Storage key para localStorage
 */
const QUOTE_STORAGE_KEY = "roda_llantas_quote";

/**
 * Provider de QuoteContext
 */
export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pricingRules, setPricingRules] = useState<any[]>([]);

  // Importar acción de servidor (Necesitamos importarla arriba)
  // Como es un archivo cliente, necesitamos importar la acción.
  // Nota: getPricingRules es de "src/app/dashboard/settings/pricing/actions"

  /**
   * Cargar desde localStorage y Reglas de Precio al montar
   */
  useEffect(() => {
    // Cargar cotización guardada
    try {
      const stored = localStorage.getItem(QUOTE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error("Error loading quote from localStorage:", error);
    }
    setIsHydrated(true);

    // Cargar reglas de precio
    import("@/app/dashboard/settings/pricing/actions").then(({ getPricingRules }) => {
      getPricingRules().then(result => {
        if (result.success && result.rules) {
          setPricingRules(result.rules);
        }
      });
    });
  }, []);

  /**
   * Persistir en localStorage cuando cambia
   */
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Error saving quote to localStorage:", error);
      }
    }
  }, [items, isHydrated]);

  /**
   * Helper para recalcular el precio de un item basado en cantidad y reglas
   */
  const recalculateItemPrice = (item: InventoryItem, quantity: number) => {
    // Importamos la lógica pura (dinámica)
    const { calculateItemPrice } = require("@/lib/logic/pricing-engine");

    const calcResult = calculateItemPrice(item, pricingRules, quantity);

    // Actualizamos la metadata del item con el nuevo precio
    return {
      ...item,
      _publicPrice: { // Mantenemos compatibilidad con formato anterior
        public_price: calcResult.price,
        is_manual: calcResult.method === 'manual',
        rule_applied: calcResult.ruleName,
        margin_percentage: calcResult.margin_percentage
      }
    };
  };

  /**
   * Agregar un item a la cotización
   */
  const addItem = (item: InventoryItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((qi) => qi.item.id === item.id);

      if (existingIndex >= 0) {
        // Ya existe, incrementar cantidad
        const updated = [...prevItems];
        const newQuantity = updated[existingIndex].quantity + quantity;

        // Recalcular precio con nueva cantidad
        const updatedItem = recalculateItemPrice(updated[existingIndex].item, newQuantity);

        updated[existingIndex] = {
          item: updatedItem,
          quantity: newQuantity
        };
        return updated;
      } else {
        // Agregar nuevo (Recalcular precio inicial)
        const updatedItem = recalculateItemPrice(item, quantity);
        return [...prevItems, { item: updatedItem, quantity }];
      }
    });
  };

  /**
   * Eliminar un item
   */
  const removeItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((qi) => qi.item.id !== itemId));
  };

  /**
   * Actualizar la cantidad de un item
   */
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setItems((prevItems) =>
        prevItems.map((qi) => {
          if (qi.item.id === itemId) {
            // Recalcular precio con nueva cantidad
            const updatedItem = recalculateItemPrice(qi.item, quantity);
            return { item: updatedItem, quantity };
          }
          return qi;
        })
      );
    }
  };

  /**
   * Limpiar toda la cotización
   */
  const clearQuote = () => {
    setItems([]);
  };

  /**
   * Calcular monto total
   */
  const getTotalAmount = (): number => {
    return items.reduce((total, qi) => {
      const priceData = (qi.item as any)._publicPrice;
      // Usar precio calculado o fallback
      const unitPrice = priceData?.public_price || qi.item.cost_price;
      return total + unitPrice * qi.quantity;
    }, 0);
  };

  /**
   * Obtener cantidad total de items
   */
  const getItemCount = (): number => {
    return items.reduce((count, qi) => count + qi.quantity, 0);
  };

  const value: QuoteContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearQuote,
    getTotalAmount,
    getItemCount,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
}

/**
 * Hook para usar QuoteContext
 */
export function useQuote(): QuoteContextType {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error("useQuote debe ser usado dentro de QuoteProvider");
  }
  return context;
}
