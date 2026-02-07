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
import { formatCurrency } from "@/lib/utils";

interface MobileSearchProps {
  initialItems?: InventoryItem[];
  userRole?: string | null;
}

export function MobileSearch({ initialItems = [], userRole }: MobileSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const { addItem } = useQuote();
  const isAdmin = userRole === 'admin';

  // ... existing code ...

  {/* Volume Tiers - Mobile View (Only for Admin) */ }
  {
    isAdmin && (item as any)._publicPrice?.volume_tiers?.length > 0 && (
      <div className="mb-3 bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-emerald-500"></span>
          Precios de Mayoreo
        </p>
        <div className="space-y-1">
          {(item as any)._publicPrice.volume_tiers.map((tier: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Llevando {tier.min_qty}+ pz:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(tier.price)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  {/* Footer: Precio + Botón */ }
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
      className={`rounded-lg h-10 px-4 font-semibold transition-all gap-2 ${hasStock
        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
        : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Agregar</span>
    </Button>
  </div>
                  </div >
                </div >
              );
})}
          </div >

  {/* Espaciador final */ }
  < div className = "h-4" />
        </div >
      </div >

  {/* Modal de Cantidad - Mejorado */ }
{
  showQuantityModal && selectedItem && (
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
            {formatPrice((selectedItem as any)._publicPrice?.public_price || selectedItem.manual_price)}
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
                (quantity * ((selectedItem as any)._publicPrice?.public_price || selectedItem.manual_price || 0))
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
  )
}
    </div >
  );
}
