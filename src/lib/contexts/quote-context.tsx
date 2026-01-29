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

  /**
   * Cargar desde localStorage al montar
   */
  useEffect(() => {
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
  }, []);

  /**
   * Persistir en localStorage cuando cambia items
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
   * Agregar un item a la cotización
   * Si ya existe, incrementa la cantidad
   */
  const addItem = (item: InventoryItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((qi) => qi.item.id === item.id);

      if (existingIndex >= 0) {
        // Ya existe, incrementar cantidad
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        // Agregar nuevo
        return [...prevItems, { item, quantity }];
      }
    });
  };

  /**
   * Eliminar un item de la cotización
   */
  const removeItem = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((qi) => qi.item.id !== itemId)
    );
  };

  /**
   * Actualizar la cantidad de un item
   * Si cantidad <= 0, elimina el item
   */
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setItems((prevItems) =>
        prevItems.map((qi) =>
          qi.item.id === itemId ? { ...qi, quantity } : qi
        )
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
   * Usa public_price si existe, sino usa cost_price * 1.3 como fallback
   */
  const getTotalAmount = (): number => {
    return items.reduce((total, qi) => {
      const priceData = (qi.item as any)._publicPrice;
      const unitPrice = priceData?.public_price || qi.item.cost_price * 1.3;
      return total + unitPrice * qi.quantity;
    }, 0);
  };

  /**
   * Obtener cantidad total de items (suma de cantidades)
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
