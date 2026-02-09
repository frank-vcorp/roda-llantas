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
import { getPricingRules, enrichInventoryWithPrices } from "@/lib/services/pricing";
import { MobileSearch } from "@/components/inventory/mobile-search";
import { getUserRole } from "@/lib/auth/role";
import { QuoteProvider } from "@/lib/contexts/quote-context";

import { SearchBar } from "@/components/inventory/search-bar";
import { CustomPagination } from "@/components/inventory/pagination";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { PublicInventoryTable } from "@/components/inventory/public-inventory-table";
import { enrichInventoryWithPrices } from "@/lib/services/pricing"; // Kept for mobile items if needed, or move logic?
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
    // Obtener items e invocar getPricingRules en paralelo
    const [{ data: items, count, suggestions }, rules] = await Promise.all([
      getInventoryItems({
        search: query,
        page: pageIndex,
        limit,
      }),
      getPricingRules(),
    ]);

    console.log(`[Home] Data fetched. Items: ${items?.length}, Rules: ${rules?.length}`);

    // Pre-calcular precios públicos (sin rol de admin, visibility restringida)
    console.log("[Home] Enriching items with prices...");
    const itemsWithPrices = enrichInventoryWithPrices(items, rules);

    // ... rest of logic ...

    // Move result calculation here to be safe
    const hasSuggestions = items.length === 0 && (suggestions?.length || 0) > 0;

    console.log("[Home] Ready to render JSX");

    // ... rest of the component

    // Need to reconstruct the return because I can't just replace the top block easily with this tool's constraints if I don't include the rest.
    // I will return the original logic but with logs.

    // Re-declaring variables from original code that follow this block
    const totalPages = Math.ceil(count / limit);
    const publicColumns = columns.filter(col => col.id !== "actions");

    return (
      <QuoteProvider>
        {/* Background */}
        <div className="min-h-screen bg-slate-50">

          {/* DESKTOP VERSION */}
          <div className="hidden md:block max-w-7xl mx-auto px-6 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-primary-foreground font-black text-xl">R</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">Roda Llantas</h1>
                </div>
                <p className="text-sm text-slate-500">
                  Catálogo Público • {count} resultados
                </p>
              </div>

              <Link href="/login">
                <Button className="gap-2 font-bold bg-slate-900 text-white hover:bg-slate-800">
                  <LogIn className="h-4 w-4" />
                  Acceso Admin
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <SearchBar placeholder="Buscar por marca, modelo, medida (ej. 205/55R16)..." />
            </div>

            {/* DataTable */}
            {/* Moved table logic to Client Component to avoid "columns.filter is not a function" error */}
            <PublicInventoryTable
              items={items}
              suggestions={suggestions || []}
              rules={rules}
            />

            {count > 0 && <CustomPagination totalPages={totalPages} />}
          </div>
        </div>

        {/* MOBILE VERSION */}
        <div className="md:hidden h-screen bg-white">
          <MobileSearch
            initialItems={itemsWithPrices}
            userRole={null}
            showLoginButton={true}
          />
        </div>

      </div>
      </QuoteProvider >
    );

  } catch (e) {
    console.error("[Home] Error during data fetch or rendering:", e);
    throw e; // Rethrow to show error page, but now logged on server
  }
}
