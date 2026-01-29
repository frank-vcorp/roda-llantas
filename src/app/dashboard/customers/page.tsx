/**
 * Página del Directorio de Clientes
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03
 * @ref context/SPEC-CRM-LITE.md
 * @created 2026-01-29
 *
 * Server Component que muestra:
 * - Tabla de clientes (Nombre, Teléfono, Email, Fecha de Registro)
 * - Buscador simple
 * - Acciones por fila: Editar
 * - Empty state si no hay clientes
 */

import { getAllCustomers, searchCustomers } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SearchBar } from "@/components/customers/search-bar";
import { CustomersTable } from "@/components/customers/customers-table";

export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<{
    query?: string;
  }>;
}

export default async function CustomersPage(props: CustomersPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  // Obtener clientes (filtrados si hay búsqueda)
  let result;
  if (query.trim()) {
    result = await searchCustomers(query);
  } else {
    result = await getAllCustomers();
  }

  const customers = result.customers || [];
  const error = result.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <SearchBar placeholder="Buscar por nombre o teléfono..." />
      </div>

      {/* Tabla de Clientes */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar los clientes: {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No hay clientes registrados</p>
        </div>
      ) : (
        <CustomersTable customers={customers} />
      )}
    </div>
  );
}
