/**
 * Página principal - Landing Page Pública RodaMAx
 * Diseño "Google Style": solo buscador al inicio, resultados al buscar.
 * Incluye: fotos del local, mapa de ubicación y botón WhatsApp flotante.
 *
 * @id IMPL-20260302-LANDING
 * @author SOFIA - Builder
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInventoryItems } from "@/lib/services/inventory";
import { getPricingRules } from "@/lib/services/pricing";
import { getPublicOrganizationSettings } from "@/lib/actions/settings";
import { enrichInventoryWithPrices } from "@/lib/logic/pricing-engine";
import { MobileSearch } from "@/components/inventory/mobile-search";
import { QuoteProvider } from "@/lib/contexts/quote-context";
import { PublicInventoryTable } from "@/components/inventory/public-inventory-table";
import { CustomPagination } from "@/components/inventory/pagination";
import { SearchBar } from "@/components/inventory/search-bar";
import { StorePhotos } from "@/components/landing/store-photos";
import { LogIn, MapPin, Phone, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

const WHATSAPP_NUMBER = "5214427725036";
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const STORE_PHOTOS = [
  {
    src: "https://xcprrxhituqnrzsjxrof.supabase.co/storage/v1/object/public/branding/store/exterior.jpg",
    alt: "Fachada RodaMAx - Llantas, Suspensiones y Frenos",
    caption: "Tu llantería de confianza en Querétaro",
  },
  {
    src: "https://xcprrxhituqnrzsjxrof.supabase.co/storage/v1/object/public/branding/store/bodega.jpg",
    alt: "Bodega de Llantas RodaMAx",
    caption: "Más de 500 medidas en existencia",
  },
];

interface HomeProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function Home(props: HomeProps) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = 50;
  const hasQuery = query.trim().length > 0;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const pageIndex = Math.max(0, currentPage - 1);

  try {
    const [{ data: items, count, suggestions }, rules, settings] = await Promise.all([
      hasQuery
        ? getInventoryItems({ search: query, page: pageIndex, limit })
        : { data: [], count: 0, suggestions: [] },
      getPricingRules(),
      getPublicOrganizationSettings(),
    ]);

    const sanitize = (arr: any[]) =>
      arr.map(({ cost_price, stock_breakdown, ...safe }) => safe);

    const itemsWithPrices = sanitize(enrichInventoryWithPrices(items, rules));
    const suggestionsWithPrices = sanitize(enrichInventoryWithPrices(suggestions || [], rules));

    const hasSuggestions = items.length === 0 && (suggestions?.length || 0) > 0;
    const displayData = hasSuggestions ? suggestionsWithPrices : itemsWithPrices;
    const totalPages = Math.ceil((count || 0) / limit);

    const whatsappGeneral = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola RodaMAx, necesito información sobre llantas 👋")}`;

    return (
      <QuoteProvider>
        <div className="min-h-screen bg-white">

          {/* ─── FLOATING WHATSAPP BUTTON ─── */}
          <a
            href={whatsappGeneral}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-2xl hover:bg-[#22c55e] transition-all duration-300 hover:scale-105 font-semibold text-sm"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            WhatsApp
          </a>

          {/* ─── MOBILE VERSION ─── */}
          <div className="md:hidden">
            <MobileSearch
              initialItems={[]}
              userRole={null}
              showLoginButton={true}
              settings={settings}
            />
          </div>

          {/* ─── DESKTOP VERSION ─── */}
          <div className="hidden md:flex flex-col min-h-screen">

            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings?.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt={settings?.name || "Logo"}
                      className="h-10 w-auto object-contain"
                    />
                  )}
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {settings?.name || "RodaMAx"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="#nosotros"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Nosotros
                  </a>
                  <a
                    href="#ubicacion"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Ubicación
                  </a>
                  <a
                    href={whatsappGeneral}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-[#25D366] text-white px-4 py-2 rounded-full hover:bg-[#22c55e] transition-colors font-medium flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    WhatsApp
                  </a>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <LogIn className="h-4 w-4" />
                    Acceso
                  </Link>
                </div>
              </div>
            </nav>

            {/* HERO */}
            {!hasQuery && (
              <section className="flex-1 flex flex-col items-center justify-center min-h-screen pt-16 pb-8 px-6 bg-gradient-to-b from-white via-slate-50 to-white">
                <div className="flex flex-col items-center gap-6 max-w-2xl w-full text-center">
                  {/* Logo grande */}
                  {settings?.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt={settings?.name || "Logo"}
                      className="h-24 w-auto object-contain drop-shadow-md"
                    />
                  )}
                  <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">
                      {settings?.name || "RodaMAx"}
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">
                      Encuentra tu llanta perfecta en segundos
                    </p>
                  </div>

                  {/* BIG SEARCH BAR */}
                  <div className="w-full mt-2">
                    <SearchBar
                      placeholder="Busca por medida, marca o modelo... ej. 205/55R16, Michelin, Tornel"
                    />
                  </div>

                  <p className="text-sm text-slate-400">
                    Escribe la medida de tu llanta o el nombre de la marca
                  </p>

                  {/* Scroll hint */}
                  <a
                    href="#nosotros"
                    className="mt-16 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors animate-bounce"
                  >
                    <span className="text-xs">Ver más</span>
                    <ChevronDown className="h-5 w-5" />
                  </a>
                </div>
              </section>
            )}

            {/* SEARCH RESULTS */}
            {hasQuery && (
              <div className="pt-20 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header when in search mode */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt={settings?.name || "Logo"} className="h-14 w-auto object-contain" />
                    )}
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                      {settings?.name || "RodaMAx"}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={whatsappGeneral}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] text-white px-4 py-2 rounded-full hover:bg-[#22c55e] transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Preguntar por WhatsApp
                    </a>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <SearchBar placeholder="Buscar por marca, modelo, medida (ej. 205/55R16)..." />
                </div>

                <PublicInventoryTable
                  displayData={displayData}
                  hasSuggestions={hasSuggestions}
                />

                {(count || 0) > 0 && <CustomPagination totalPages={totalPages} />}
              </div>
            )}

            {/* ─── SECTION: NOSOTROS + FOTOS ─── */}
            <section id="nosotros" className="py-20 px-6 bg-white">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-slate-900 mb-3">
                    Tu llantería de confianza
                  </h2>
                  <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    En <strong>{settings?.name || "RodaMAx"}</strong> contamos con cientos de medidas en existencia
                    al mejor precio de Querétaro.
                  </p>
                </div>

                {/* Fotos del local - Client Component para manejar onError */}
                <StorePhotos photos={STORE_PHOTOS} />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 text-center">
                  {[
                    { value: "500+", label: "Medidas en stock" },
                    { value: "10+", label: "Marcas disponibles" },
                    { value: "⭐⭐⭐⭐⭐", label: "Servicio de calidad" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── SECTION: UBICACIÓN + MAPA ─── */}
            <section id="ubicacion" className="py-20 px-6 bg-slate-50">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-slate-900 mb-3">
                    ¿Dónde estamos?
                  </h2>
                  <p className="text-lg text-slate-500">
                    Visítanos o escríbenos, con gusto te atendemos
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Info de contacto */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Dirección</p>
                          <p className="text-sm text-slate-600">
                            Av. de la Luz 2801<br />
                            Col. Prados del Rincón<br />
                            Querétaro, Qro.
                          </p>
                          <a
                            href="https://maps.app.goo.gl/QZWzNfs5h5ezSiNV8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-emerald-600 hover:underline font-medium"
                          >
                            Ver en Google Maps →
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 mb-1">Teléfono</p>
                          <a
                            href="tel:+524427725036"
                            className="text-sm text-slate-600 hover:text-emerald-600"
                          >
                            +52 1 442 772 5036
                          </a>
                        </div>
                      </div>
                    </div>

                    <a
                      href={whatsappGeneral}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-2xl hover:bg-[#22c55e] transition-all duration-200 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Escríbenos por WhatsApp
                    </a>
                  </div>

                  {/* Google Maps Embed */}
                  <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-80 md:h-full min-h-[300px]">
                    <iframe
                      src="https://maps.google.com/maps?q=Av.+de+la+Luz+2801,+Prados+del+Rincon,+Queretaro,+Mexico&t=&z=16&ie=UTF8&iwloc=&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: "300px" }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación RodaMAx"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
              <p>
                © {new Date().getFullYear()}{" "}
                <span className="text-white font-semibold">
                  {settings?.name || "RodaMAx"}
                </span>{" "}
                — Av. de la Luz 2801, Col. Prados del Rincón, Querétaro
              </p>
              <p className="mt-1">
                <a href="tel:+524427725036" className="hover:text-white transition-colors">
                  +52 1 442 772 5036
                </a>
              </p>
            </footer>

          </div>
          {/* /DESKTOP */}

        </div>
      </QuoteProvider>
    );

  } catch (e) {
    console.error("[Home] Error:", e);
    throw e;
  }
}
