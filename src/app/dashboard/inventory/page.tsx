/**
 * Página principal de Inventario - Tabla de Datos
 * Visualización del catálogo completo de llantas (Desktop + Mobile)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT3, IMPL-20260129-PRICING-01, IMPL-20260129-ROLES-MOBILE
 * @ref context/SPEC-DATA-MODEL.md, context/SPEC-PRICING-ENGINE.md, context/SPEC-ROLES-MOBILE.md
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/inventory/data-table";
import { SearchBar } from "@/components/inventory/search-bar";
import { CustomPagination } from "@/components/inventory/pagination";
import { MobileSearch } from "@/components/inventory/mobile-search";
import { columns } from "./columns";
import { getInventoryItems } from "@/lib/services/inventory";
import { getPricingRules, enrichInventoryWithPrices } from "@/lib/services/pricing";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function InventoryPage(props: InventoryPageProps) {
  const searchParams = await props.searchParams;
  
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const limit = 50;

  // Convertir página 1-based (URL) a 0-based (Backend)
  const pageIndex = Math.max(0, currentPage - 1);

  // Obtener items e invocar getPricingRules en paralelo
  const [{ data: items, count }, rules] = await Promise.all([
    getInventoryItems({
      search: query,
      page: pageIndex,
      limit,
    }),
    getPricingRules(),
  ]);

  // Pre-calcular precios públicos en el servidor
  const itemsWithPrices = enrichInventoryWithPrices(items, rules);

  // Para mobile: obtener todos los items (sin paginación) inicialmente
  const allItemsForMobile = count <= 200 ? itemsWithPrices : [];

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      {/* DESKTOP VERSION */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Inventario</h1>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {items.length} de {count} producto{count !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/dashboard/inventory/import">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar placeholder="Buscar por marca, modelo o medida..." />
        </div>

        {/* DataTable */}
        <div className="space-y-4">
          <DataTable columns={columns} data={itemsWithPrices} />
          {count > 0 && <CustomPagination totalPages={totalPages} />}
        </div>
      </div>

      {/* MOBILE VERSION */}
      <div className="md:hidden h-[calc(100vh-200px)]">
        <MobileSearch initialItems={allItemsForMobile} />
      </div>
    </div>
  );
}

