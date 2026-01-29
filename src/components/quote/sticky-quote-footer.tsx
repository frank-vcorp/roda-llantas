/**
 * Sticky Quote Footer: Barra flotante de cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-01
 * @ref context/SPEC-QUOTATIONS.md
 *
 * Se muestra al pie cuando hay items seleccionados.
 * Muestra cantidad de items, total estimado y botón para ir a cotizar.
 */

"use client";

import { useQuote } from "@/lib/contexts/quote-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Formato de moneda
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export function StickyQuoteFooter() {
  const { items, getTotalAmount, getItemCount } = useQuote();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * Solo mostrar en cliente (después de hidratación)
   */
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || items.length === 0) {
    return null;
  }

  const itemCount = getItemCount();
  const totalAmount = getTotalAmount();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <p className="text-foreground font-medium">
              {itemCount} {itemCount === 1 ? "producto" : "productos"} seleccionado{itemCount === 1 ? "" : "s"}
            </p>
            <p className="text-muted-foreground text-xs">
              Total estimado: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard/quotes/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Ir a Cotizar
        </Button>
      </div>
    </div>
  );
}
