/**
 * IMPL-20260129-SPRINT1, IMPL-20260207-PUBLIC-SEARCH
 * Página principal - Buscador Público de Llantas
 *
 * Muestra el buscador sin necesidad de login.
 * Redirige al dashboard si ya hay sesión.
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
import { SearchBar } from "@/components/inventory/search-bar";
import { CustomPagination } from "@/components/inventory/pagination";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { PublicInventoryTable } from "@/components/inventory/public-inventory-table";

// MobileSearch expects items with prices, so we still need enrichInventoryWithPrices here or move it to MobileSearch too?
// MobileSearch is a client component? Let's check. 
// For now, I'll keep enrich for Mobile, but PublicInventoryTable does its own enrich.
// Actually, to avoid double calculation, I can pass raw items to PublicTable?
// My PublicTable implementation does enrich inside. 
// So I only need enrich for MobileSearch.


export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function Home(props: HomeProps) {
  console.log("[Home] Starting render...");
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = 50;

  console.log("[Home] Creating Supabase client...");
  const supabase = await createClient();

  console.log("[Home] Checking session...");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya está logueado, ir al dashboard
  if (user) {
    console.log("[Home] User found, redirecting to /dashboard");
    redirect("/dashboard");
  }

  // Convertir página 1-based (URL) a 0-based (Backend)
  const pageIndex = Math.max(0, currentPage - 1);

  console.log("[Home] Fetching inventory and rules...");
  try {
    // Fetch settings and rules
    const [{ data: items, count, suggestions }, rules, settings] = await Promise.all([
      getInventoryItems({
        search: query,
        page: pageIndex,
        limit,
      }),
      getPricingRules(),
      getPublicOrganizationSettings()
    ]);

    console.log(`[Home] Data fetched. Items: ${items?.length}, Rules: ${rules?.length}`);

    // Pre-calcular precios públicos (sin rol de admin, visibility restringida)
    console.log("[Home] Enriching items with prices...");
    const itemsWithPrices = enrichInventoryWithPrices(items, rules);

    // FIX-20260223: Sanitize items to avoid leaking cost_price and raw rules to the public internet
    const sanitizeItems = (arr: any[]) => arr.map(item => {
      const { cost_price, stock_breakdown, ...safeItem } = item;
      return safeItem;
    });

    const safeItemsWithPrices = sanitizeItems(itemsWithPrices);
    const safeSuggestionsWithPrices = sanitizeItems(enrichInventoryWithPrices(suggestions || [], rules));

    // Move result calculation here to be safe
    const hasSuggestions = items.length === 0 && (suggestions?.length || 0) > 0;
    const displayData = hasSuggestions ? safeSuggestionsWithPrices : safeItemsWithPrices;

    console.log("[Home] Ready to render JSX");

    const totalPages = Math.ceil(count / limit);

    return (
      <QuoteProvider>
        <div className="min-h-screen bg-slate-50">

          {/* DESKTOP VERSION (Table) */}
          <div className="hidden md:block max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header Desktop */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                {settings?.logo_url && (
                  <img src={settings.logo_url} alt={settings?.name || "Logo"} className="h-14 w-auto object-contain" />
                )}
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {settings?.name || "Roda Llantas"}
                </h1>
              </div>

              <Link href="/login">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2">
                  <LogIn className="h-4 w-4" />
                  Acceso Especial
                </Button>
              </Link>
            </div>

            {/* Buscador Desktop */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <SearchBar placeholder="Buscar por marca, modelo, medida (ej. 205/55R16)..." />
            </div>

            {/* MasterList Table */}
            <PublicInventoryTable
              displayData={displayData}
              hasSuggestions={hasSuggestions}
            />

            {count > 0 && <CustomPagination totalPages={totalPages} />}
          </div>

          {/* MOBILE VERSION (Cards) */}
          <div className="md:hidden">
            <MobileSearch
              initialItems={safeItemsWithPrices}
              userRole={null}
              showLoginButton={true}
              settings={settings}
            />
          </div>

        </div>
      </QuoteProvider>
    );

  } catch (e) {
    console.error("[Home] Error during data fetch or rendering:", e);
    throw e; // Rethrow to show error page, but now logged on server
  }
}
