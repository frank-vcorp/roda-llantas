/**
 * Componente: MobileSearch (Inventario - Mobile UX)
 *
 * Interfaz de búsqueda tipo "Google Style" para móviles.
 * - Buscador grande y autofocus
 * - Grid de tarjetas con resultados (diseño profesional tipo e-commerce)
 * - Botón "Agregar" que abre modal para cantidad
 *
 * REDISEÑO: Tarjetas con shadow, rounded, jerarquía visual clara,
 * precio verde destacado (estilo e-commerce moderno).
 *
 * @id IMPL-20260130-WHITELABEL, FIX-20260131-MOBILE-CART
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 */

"use client";

import React, { useState, useCallback } from "react";
import { SearchIcon, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/types";
import { searchInventoryAction } from "@/lib/actions/inventory";
import { useQuote } from "@/lib/contexts/quote-context";
import { toast } from "sonner";

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
  const { addItem } = useQuote();

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

  // Confirmar agregar a carrito
  const handleConfirmAdd = () => {
    if (!selectedItem) return;

    addItem(selectedItem, quantity);
    toast.success("Producto agregado a la cotización");
    setShowQuantityModal(false);
    setSelectedItem(null);
  };

  const formatPrice = (price: number | null): string => {
    if (!price || price === 0) return "Consultar";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header - Fixed height to prevent layout shift */}
      <div className="shrink-0 px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Buscar Llantas</h1>

        {/* Search Bar - Premium */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Ej. 205 55 16, MICHELIN, TORNEL..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="h-12 pl-10 py-3 text-base border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Resultados - Scrollable container */}
      <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-slate-600">Buscando...</p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No se encontraron resultados</p>
            <p className="text-sm text-slate-500 mt-1">"{query}"</p>
          </div>
        )}

        {!loading && results.length === 0 && !query && (
          <div className="text-center py-12 text-slate-500">
            <p className="font-medium">Escribe una medida para buscar llantas</p>
            <p className="text-sm mt-2">Ejemplos: 205/55R16, MICHELIN, P205</p>
          </div>
        )}

        {/* Grid de tarjetas - Profesional */}
        <div className="grid grid-cols-1 gap-3">
          {results.map((item) => {
            const hasStock = item.stock > 0;
            const priceDisplay = formatPrice(item.manual_price);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md ${
                  !hasStock ? "opacity-60" : ""
                }`}
              >
                {/* Contenedor Principal */}
                <div className="p-4 flex flex-col h-full">
                  {/* Header: Medida + Stock Badge */}
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1">
                      {/* Medida (Principal - Grande y Bold) */}
                      <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                        {item.medida_full}
                      </h3>

                      {/* Marca y Modelo (Secundario - Pequeño, gris) */}
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        {item.brand} {item.model}
                      </p>
                    </div>

                    {/* Stock Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                        hasStock
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {hasStock ? `${item.stock} en stock` : "Sin stock"}
                    </div>
                  </div>

                  {/* Detalles Técnicos */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {item.sku && (
                        <div className="col-span-2">
                          <p className="text-slate-500 font-mono">SKU: {item.sku}</p>
                        </div>
                      )}
                      {item.rim && (
                        <div>
                          <p className="text-slate-400 font-semibold">Rin</p>
                          <p className="text-slate-700 font-medium">{item.rim}"</p>
                        </div>
                      )}
                      {item.width && (
                        <div>
                          <p className="text-slate-400 font-semibold">Ancho</p>
                          <p className="text-slate-700 font-medium">{item.width} mm</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Precio + Botón */}
                  <div className="flex justify-between items-center gap-3 mt-auto pt-3 border-t border-slate-100">
                    {/* Precio - Verde y Grande */}
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">
                        Precio unitario
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {priceDisplay}
                      </p>
                    </div>

                    {/* Botón Agregar */}
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={!hasStock}
                      className={`rounded-lg h-10 px-4 font-semibold transition-all gap-2 ${
                        hasStock
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">Agregar</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Espaciador final */}
        <div className="h-4" />
      </div>
      </div>

      {/* Modal de Cantidad - Mejorado */}
      {showQuantityModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom-3 max-h-[90vh] overflow-y-auto">
            {/* Cerrar botón */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Detalle del producto - Mejorado */}
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900">
                {selectedItem.medida_full}
              </h3>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">
                {selectedItem.brand} {selectedItem.model}
              </p>
              {selectedItem.sku && (
                <p className="text-xs text-slate-500 font-mono mt-2">
                  SKU: {selectedItem.sku}
                </p>
              )}
              <p className="text-3xl font-extrabold text-emerald-600 mt-3">
                {formatPrice(selectedItem.manual_price)}
              </p>
            </div>

            {/* Selector de cantidad - Mejorado */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-700">
                Cantidad:
              </span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-none h-10 px-4 hover:bg-slate-100"
                >
                  −
                </Button>
                <span className="w-12 text-center font-extrabold text-lg">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedItem.stock, quantity + 1)
                    )
                  }
                  disabled={quantity >= selectedItem.stock}
                  className="rounded-none h-10 px-4 hover:bg-slate-100 disabled:opacity-50"
                >
                  +
                </Button>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                ({selectedItem.stock} disponibles)
              </span>
            </div>

            {/* Subtotal */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Subtotal:</span>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {formatPrice(
                    (quantity * (selectedItem.manual_price || 0))
                  )}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-lg border-slate-300"
                onClick={() => setShowQuantityModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                onClick={handleConfirmAdd}
              >
                <ShoppingCart className="h-5 w-5" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
