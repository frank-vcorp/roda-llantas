/**
 * Componente: MobileSearch (Inventario - Mobile UX)
 *
 * Interfaz de búsqueda tipo "Google Style" para móviles.
 * - Buscador grande y autofocus
 * - Grid de tarjetas con resultados
 * - Botón "Agregar" que abre modal para cantidad
 *
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 * @ref context/SPEC-ROLES-MOBILE.md, context/SPEC-INVENTORY-VIEW.md
 */

"use client";

import React, { useState, useCallback } from "react";
import { SearchIcon, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/types";
import { searchInventoryAction } from "@/lib/actions/inventory";

interface MobileSearchProps {
  initialItems?: InventoryItem[];
}

export function MobileSearch({ initialItems = [] }: MobileSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  // Manejar búsqueda
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);

      if (!searchQuery.trim()) {
        setResults(initialItems);
        return;
      }

      setLoading(true);
      try {
        const response = await searchInventoryAction(searchQuery, 50);
        setResults(response || []);
      } catch (error) {
        console.error("[MobileSearch] Error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [initialItems]
  );

  // Manejar agregar a carrito
  const handleAddToCart = (item: InventoryItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowQuantityModal(true);
  };

  // Confirmar agregar a carrito (TODO: Integrar con contexto de cotización)
  const handleConfirmAdd = () => {
    if (!selectedItem) return;

    console.log(`[MobileSearch] Agregado: ${selectedItem.medida_full} x${quantity}`);
    // TODO: Enviar al contexto de cotización (QuoteContext)
    setShowQuantityModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-xl font-bold mb-4">🔍 Buscar Llantas</h1>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Ej. 205 55 16"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="pl-10 py-2 text-base"
          />
        </div>
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Buscando...</p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-8">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
          </div>
        )}

        {!loading && results.length === 0 && !query && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Escribe una medida para buscar llantas</p>
          </div>
        )}

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 gap-3">
          {results.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              {/* Medida (Grande) */}
              <h3 className="text-lg font-bold text-primary">{item.medida_full}</h3>

              {/* Marca/Modelo */}
              <p className="text-sm text-muted-foreground">
                {item.brand} {item.model}
              </p>

              {/* Stock y Precio */}
              <div className="flex justify-between items-center mt-3">
                <div className="space-y-1">
                  <div className="text-sm">
                    🟢 Stock: <span className="font-semibold">{item.stock}</span>
                  </div>
                  <div className="text-sm">
                    💰 ${item.manual_price?.toLocaleString("es-CO") || "0"}
                  </div>
                </div>

                {/* Botón Agregar */}
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stock === 0}
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Cantidad */}
      {showQuantityModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-lg p-4 space-y-4 animate-in slide-in-from-bottom">
            {/* Detalle del producto */}
            <div>
              <h3 className="text-lg font-bold">{selectedItem.medida_full}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedItem.brand} {selectedItem.model}
              </p>
              <p className="text-2xl font-bold text-primary mt-2">
                ${selectedItem.manual_price?.toLocaleString("es-CO") || "0"}
              </p>
            </div>

            {/* Selector de cantidad */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </Button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= selectedItem.stock}
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground ml-auto">
                ({selectedItem.stock} disponibles)
              </span>
            </div>

            {/* Subtotal */}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="text-xl font-bold text-primary">
                  ${(quantity * (selectedItem.manual_price || 0)).toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowQuantityModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirmAdd}
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
