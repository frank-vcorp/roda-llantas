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
import { DataTable } from "@/components/inventory/data-table";
import { SearchBar } from "@/components/inventory/search-bar";
import { CustomPagination } from "@/components/inventory/pagination";
import { columns } from "@/app/dashboard/inventory/columns";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya está logueado, ir al dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Convertir página 1-based (URL) a 0-based (Backend)
  const pageIndex = Math.max(0, currentPage - 1);

  // Obtener items e invocar getPricingRules en paralelo
  const [{ data: items, count, suggestions }, rules] = await Promise.all([
    getInventoryItems({
      search: query,
      page: pageIndex,
      limit,
    }),
    getPricingRules(),
  ]);

  // Pre-calcular precios públicos (sin rol de admin, visibility restringida)
  const itemsWithPrices = enrichInventoryWithPrices(items, rules);

  // Para mobile: obtener todos los items (sin paginación) inicialmente
  // Nota: MobileSearch usa su propio sistema de filtrado client-side si se le pasan items,
  // pero aquí le pasamos items paginados si hay query? 
  // MobileSearch espera 'initialItems'. Si hay query, MobileSearch filtra?
  // Re-leí MobileSearch: Si recibe initialItems, los usa. Si escribe en su input, busca en servidor.
  // Así que pasarle los items paginados está bien como estado inicial.

  const hasSuggestions = items.length === 0 && (suggestions?.length || 0) > 0;
  const displayItems = hasSuggestions ? (suggestions || []) : itemsWithPrices; // Usar items enriquecidos

  const totalPages = Math.ceil(count / limit);

  // Filter out actions column for public view
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
          <div className="space-y-4">
            {hasSuggestions && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">No encontramos resultados exactos</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Pero encontramos estas opciones disponibles en el mismo Rin.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <DataTable
                columns={publicColumns}
                data={hasSuggestions ? enrichInventoryWithPrices(suggestions || [], rules) : itemsWithPrices}
                userRole={null}
              />
            </div>

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
    </QuoteProvider>
  );
}
