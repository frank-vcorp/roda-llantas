/**
 * Sticky Quote Footer: Barra flotante de cotización (Express Edition)
 * 
 * @author SOFIA - Builder
 * @id IMPL-20260131-EXPRESS-QUOTE
 * @description Barra inferior que permite ver items, ajustar cantidades y compartir vía WhatsApp directamente.
 * @ref context/SPEC-QUOTATIONS.md
 */

"use client";

import { useQuote } from "@/lib/contexts/quote-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  MessageCircle,
  X,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsAppMessage, normalizePhoneNumber } from "./whatsapp-button";

export function StickyQuoteFooter() {
  const { items, getTotalAmount, getItemCount, removeItem, updateQuantity } = useQuote();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Estado para el modal de WhatsApp
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || items.length === 0) {
    return null;
  }

  const itemCount = getItemCount();
  const totalAmount = getTotalAmount();

  const handleWhatsAppShare = () => {
    if (!customerPhone) {
      alert("Por favor ingresa un número de teléfono");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(customerPhone);
    const messageItems = items.map(qi => {
      const priceData = (qi.item as any)._publicPrice;
      const unitPrice = priceData?.public_price || qi.item.cost_price * 1.3;
      return {
        quantity: qi.quantity,
        description: `${qi.item.brand} ${qi.item.model} ${qi.item.medida_full}`,
        subtotal: unitPrice * qi.quantity
      };
    });

    const message = buildWhatsAppMessage(
      customerName || "Cliente",
      "EXPRESS-" + new Date().getTime().toString().slice(-4),
      messageItems,
      totalAmount
    );

    const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    setShowWhatsAppForm(false);
  };

  return (
    <div className={`fixed left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] z-50 transition-all duration-300 ease-in-out ${isExpanded
        ? 'h-[70vh] bottom-0'
        : 'h-20 bottom-24 md:bottom-0'
      }`}>

      {/* Botón Expansor / Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 border-b-0 rounded-t-xl px-6 py-2 shadow-[0_-4px_10px_rgb(0,0,0,0.04)] flex items-center gap-2 group"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" /> : <ChevronUp className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
          {isExpanded ? 'Cerrar' : 'Ver Detalle'}
        </span>
      </button>

      <div className="flex flex-col h-full max-w-lg mx-auto overflow-hidden">
        {/* Barra Principal (Visible siempre) */}
        <div className="flex items-center justify-between px-6 h-20 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              {itemCount} {itemCount === 1 ? 'Llantas' : 'Llantas'} • MI COTIZACIÓN
            </span>
            <span className="text-2xl font-black text-emerald-600 leading-none">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <Button
            onClick={() => setShowWhatsAppForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 gap-2 font-bold shadow-lg shadow-emerald-200 animate-in zoom-in-90"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </Button>
        </div>

        {/* Detalle Expandido */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 animate-in fade-in slide-in-from-bottom-5">
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Items en la cotización
              </h3>

              <div className="space-y-3">
                {items.map((qi) => {
                  const item = qi.item;
                  const priceData = (item as any)._publicPrice;
                  const unitPrice = priceData?.public_price || item.cost_price * 1.3;

                  return (
                    <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative group">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="pr-8">
                        <p className="font-bold text-slate-900 leading-tight mb-1">{item.medida_full}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-3">
                          {item.brand} • {item.model}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-9">
                            <button
                              onClick={() => updateQuantity(item.id, qi.quantity - 1)}
                              className="w-10 flex items-center justify-center hover:bg-slate-50"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-black">{qi.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, qi.quantity + 1)}
                              className="w-10 flex items-center justify-center hover:bg-slate-50"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Subtotal</p>
                            <p className="font-bold text-emerald-600">{formatCurrency(unitPrice * qi.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Overlay de WhatsApp Express */}
      {showWhatsAppForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-[32px] p-8 space-y-6 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Enviar por WhatsApp</h3>
              <button
                onClick={() => setShowWhatsAppForm(false)}
                className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed">
              Ingresa los datos para enviar la cotización de <span className="font-bold text-emerald-600">{itemCount} items</span> directamente.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Nombre del Cliente</label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-14 rounded-2xl border-slate-200 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Teléfono (WhatsApp)</label>
                <Input
                  type="tel"
                  placeholder="Ej: 55 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-14 rounded-2xl border-slate-200 text-base"
                />
              </div>
            </div>

            <Button
              onClick={handleWhatsAppShare}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] gap-3 text-lg font-black shadow-xl shadow-emerald-100"
            >
              <MessageCircle className="h-6 w-6" />
              Enviar Cotización
            </Button>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Se abrirá WhatsApp con el resumen listo para enviar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
