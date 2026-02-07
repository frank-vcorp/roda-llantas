/**
 * IMPL-20260129-SPRINT1, IMPL-20260207-PUBLIC-SEARCH
 * Página principal - Buscador Público de Llantas
 *
 * Muestra el buscador sin necesidad de login.
 * Redirige al dashboard si ya hay sesión.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInventoryItems } from "@/lib/services/inventory";
import { getPricingRules, enrichInventoryWithPrices } from "@/lib/services/pricing";
import { MobileSearch } from "@/components/inventory/mobile-search";
import { getUserRole } from "@/lib/auth/role";
import { QuoteProvider } from "@/lib/contexts/quote-context";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya está logueado, ir al dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Si es público, cargar inventario básico
  // Usamos limit: 50 para carga inicial rápida
  const limit = 50;

  // Obtener items e invocar getPricingRules en paralelo
  const [{ data: items, count }, rules] = await Promise.all([
    getInventoryItems({
      search: "",
      page: 0,
      limit,
    }),
    getPricingRules(),
  ]);

  // Pre-calcular precios públicos (sin rol de admin, visibility restringida)
  const itemsWithPrices = enrichInventoryWithPrices(items, rules);

  return (
    <QuoteProvider>
      <main className="h-screen w-full bg-slate-50">
        <div className="h-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
          <MobileSearch
            initialItems={itemsWithPrices}
            userRole={null} // Forzar rol nulo para ocultar costos/márgenes
            showLoginButton={true}
          />
        </div>
      </main>
    </QuoteProvider>
  );
}
