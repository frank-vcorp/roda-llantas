/**
 * Componente: MobileSearch - Landing Page Mobile
 *
 * - Hero con logo + buscador grande
 * - Resultados al buscar (desaparece el hero)
 * - Sección de fotos del local
 * - Mapa y contacto
 * - WhatsApp flotante
 *
 * @id IMPL-20260302-MOBILE-LANDING
 * @author SOFIA - Builder
 */

"use client";

import React, { useState, useCallback } from "react";
import { SearchIcon, ShoppingCart, X, MapPin, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/lib/types";
import { searchInventoryAction } from "@/lib/actions/inventory";
import { useQuote } from "@/lib/contexts/quote-context";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { LogIn } from "lucide-react";

const WHATSAPP_NUMBER = "5214427725036";
const WHATSAPP_GENERAL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola RodaMAx, necesito información sobre llantas 👋")}`;
const STORE_PHOTOS = [
  {
    src: "https://xcprrxhituqnrzsjxrof.supabase.co/storage/v1/object/public/branding/store/exterior.jpg",
    alt: "Fachada RodaMAx",
    caption: "Tu llantera de confianza",
  },
  {
    src: "https://xcprrxhituqnrzsjxrof.supabase.co/storage/v1/object/public/branding/store/bodega.jpg",
    alt: "Bodega de Llantas",
    caption: "Más de 500 medidas en existencia",
  },
];

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

interface MobileSearchProps {
  initialItems?: InventoryItem[];
  userRole?: string | null;
  showLoginButton?: boolean;
  settings?: any;
}

export function MobileSearch({ initialItems = [], userRole, showLoginButton = false, settings }: MobileSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const { addItem } = useQuote();
  const isAdmin = userRole === "admin";
  const hasQuery = query.trim().length > 0;

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
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
  }, []);

  const handleAddToCart = (item: InventoryItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;
    addItem(selectedItem, quantity);
    toast.success("Producto agregado a la cotización");
    setShowQuantityModal(false);
    setSelectedItem(null);
  };

  const formatPrice = (price: number | null): string => {
    if (!price || price === 0) return "Consultar";
    return formatCurrency(price);
  };

  const makeWhatsAppLink = (item: any) => {
    const msg = `Hola RodaMAx, me interesa la llanta *${item.brand} ${item.model}* medida *${item.medida_full}*. ¿Tienen disponibilidad?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white relative">

      {/* ── WHATSAPP FLOTANTE ── */}
      <a
        href={WHATSAPP_GENERAL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-2xl font-semibold text-sm hover:bg-[#22c55e] transition-all duration-200 active:scale-95"
      >
        <span className="h-5 w-5"><WhatsAppIcon /></span>
        WhatsApp
      </a>

      {/* ── HERO: logo + buscador (solo cuando no hay búsqueda) ── */}
      {!hasQuery && (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-5 pb-8 bg-gradient-to-b from-white to-slate-50">

          {/* Nav top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {settings?.logo_url && (
                <img src={settings.logo_url} alt={settings?.name || "Logo"} className="h-8 w-auto object-contain" />
              )}
              <span className="text-base font-black text-slate-900 tracking-tight">{settings?.name || "RodaMAx"}</span>
            </div>
            {showLoginButton && (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5 text-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  Acceso
                </Button>
              </Link>
            )}
          </div>

          {/* Hero content */}
          <div className="flex flex-col items-center text-center gap-5 w-full max-w-sm mt-12">
            {settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt={settings?.name || "Logo"}
                className="h-20 w-auto object-contain drop-shadow-md"
              />
            )}
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {settings?.name || "RodaMAx"}
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Encuentra tu llanta en segundos
              </p>
            </div>

            {/* BUSCADOR GRANDE */}
            <div className="w-full relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Medida, marca o modelo..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="h-14 pl-11 text-base rounded-2xl border-2 border-slate-200 focus:border-emerald-400 focus:ring-0 shadow-sm bg-white"
              />
            </div>
            <p className="text-xs text-slate-400">Ej: 205/55R16 · P215 75R15 · Rin 16</p>

            {/* Scroll hint */}
            <a
              href="#nosotros"
              className="mt-8 flex flex-col items-center gap-1 text-slate-300 animate-bounce"
            >
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </div>
      )}

      {/* ── HEADER STICKY (solo cuando hay búsqueda) ── */}
      {hasQuery && (
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm shrink-0">
          <div className="px-4 py-3 flex items-center gap-3">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-auto object-contain" />
            )}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar llanta..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 pl-9 text-sm rounded-xl border-slate-200 focus:border-emerald-400 focus:ring-0"
              />
            </div>
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTADOS ── */}
      {hasQuery && (
        <div className="flex-1 px-4 py-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-slate-500">Buscando...</p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No encontramos resultados</p>
              <p className="text-sm text-slate-400 mt-1">"{query}"</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola RodaMAx, busco la llanta "${query}", ¿la tienen?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-md"
              >
                <span className="h-4 w-4"><WhatsAppIcon /></span>
                Preguntar por WhatsApp
              </a>
            </div>
          )}

          {/* Tarjetas de resultado */}
          <div className="grid grid-cols-1 gap-3">
            {results.map((item: any) => {
              const hasStock = item.stock > 0;
              const publicPrice = item._publicPrice?.public_price || item.manual_price || 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${!hasStock ? "opacity-60" : ""}`}
                >
                  <div className="p-4">
                    {/* Header: medida + stock */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold text-slate-900">{item.medida_full}</h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                          {item.brand} {item.model}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${hasStock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {hasStock ? `${item.stock} pzas` : "Sin stock"}
                      </span>
                    </div>

                    {/* Desglose almacenes */}
                    {item.warehouses?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.warehouses.map((w: any, idx: number) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            {w.code || w.name}: {w.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Precios especiales */}
                    {item._publicPrice?.volume_tiers?.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-2.5 mb-3 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                          Precios por volumen
                        </p>
                        <div className="space-y-1">
                          {item._publicPrice.volume_tiers.map((tier: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-slate-600">{i === 0 ? `Promo (${tier.min_qty} pzas)` : `Especial (${tier.min_qty}+)`}:</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(tier.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Precio + botones */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Precio público</p>
                        <p className="text-xl font-black text-emerald-600">{formatPrice(publicPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* WhatsApp directo por llanta */}
                        <a
                          href={makeWhatsAppLink(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-10 w-10 bg-[#25D366] text-white rounded-xl shadow-sm active:scale-95 transition-transform"
                        >
                          <span className="h-5 w-5"><WhatsAppIcon /></span>
                        </a>
                        {/* Agregar a cotización */}
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={!hasStock}
                          className={`h-10 px-4 rounded-xl font-semibold text-sm gap-1.5 ${hasStock ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Cotizar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-24" />
        </div>
      )}

      {/* ── SECCIÓN NOSOTROS + FOTOS (solo landing) ── */}
      {!hasQuery && (
        <section id="nosotros" className="px-5 py-12 bg-white">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Tu llantera de confianza
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Cientos de medidas en existencia al mejor precio.
          </p>

          <div className="flex flex-col gap-4">
            {STORE_PHOTOS.map((photo, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden shadow-md h-48">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-white font-semibold text-sm">{photo.caption}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { v: "500+", l: "Medidas" },
              { v: "10+", l: "Marcas" },
              { v: "⭐⭐⭐", l: "Calidad" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-lg font-black text-slate-800">{s.v}</p>
                <p className="text-xs text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECCIÓN UBICACIÓN (solo landing) ── */}
      {!hasQuery && (
        <section id="ubicacion" className="px-5 py-10 bg-slate-50">
          <h2 className="text-2xl font-black text-slate-900 mb-6">¿Dónde estamos?</h2>

          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden shadow-md h-56 mb-5 border border-slate-200">
            <iframe
              src="https://maps.google.com/maps?q=Av.+de+la+Luz+2801,+Prados+del+Rincon,+Queretaro,+Mexico&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación RodaMAx"
            />
          </div>

          {/* Contacto */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Dirección</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Av. de la Luz 2801, Col. Prados del Rincón, Querétaro
                </p>
                <a
                  href="https://maps.app.goo.gl/QZWzNfs5h5ezSiNV8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 font-semibold mt-1 inline-block"
                >
                  Abrir en Google Maps →
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <Phone className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Teléfono</p>
                <a href="tel:+524427725036" className="text-sm text-slate-600">+52 1 442 772 5036</a>
              </div>
            </div>
          </div>

          {/* CTA WhatsApp */}
          <a
            href={WHATSAPP_GENERAL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#25D366] text-white w-full py-4 rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-transform"
          >
            <span className="h-6 w-6"><WhatsAppIcon /></span>
            Escríbenos por WhatsApp
          </a>
        </section>
      )}

      {/* FOOTER (solo landing) */}
      {!hasQuery && (
        <footer className="px-5 py-6 bg-slate-900 text-slate-400 text-center text-xs">
          <p>© {new Date().getFullYear()} <span className="text-white font-semibold">{settings?.name || "RodaMAx"}</span></p>
          <p className="mt-0.5">Av. de la Luz 2801 · Querétaro · +52 1 442 772 5036</p>
          {showLoginButton && (
            <Link href="/login" className="mt-2 inline-block text-slate-500 hover:text-slate-300 text-xs">
              Acceso Administrativo
            </Link>
          )}
        </footer>
      )}

      {/* ── MODAL CANTIDAD ── */}
      {showQuantityModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom-3">
            <div className="flex justify-end">
              <button onClick={() => setShowQuantityModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900">{selectedItem.medida_full}</h3>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">
                {selectedItem.brand} {selectedItem.model}
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-3">
                {formatPrice((selectedItem as any)._publicPrice?.public_price || selectedItem.manual_price)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-700">Cantidad:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-none h-10 px-4">−</Button>
                <span className="w-12 text-center font-extrabold text-lg">{quantity}</span>
                <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.min(selectedItem.stock, quantity + 1))} disabled={quantity >= selectedItem.stock} className="rounded-none h-10 px-4 disabled:opacity-50">+</Button>
              </div>
              <span className="text-xs text-slate-500">({selectedItem.stock} disp.)</span>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Subtotal:</span>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {formatPrice(quantity * ((selectedItem as any)._publicPrice?.public_price || selectedItem.manual_price || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowQuantityModal(false)}>Cancelar</Button>
              <Button className="flex-1 h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl" onClick={handleConfirmAdd}>
                <ShoppingCart className="h-5 w-5" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
