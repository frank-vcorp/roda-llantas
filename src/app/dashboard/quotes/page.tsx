/**
 * Página de Historial de Cotizaciones
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-05
 * @ref context/SPEC-QUOTATIONS.md
 *
 * Server Component que muestra:
 * - KPIs: Cotizaciones hoy, Monto total hoy
 * - Tabla de historial con folio, fecha, cliente, total
 * - Acciones: Ver, Eliminar
 * - Empty state si no hay cotizaciones
 */

import { getQuotations, getTodayQuotations, deleteQuotation } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Plus } from "lucide-react";
import { DeleteQuotationButton } from "@/components/quote/delete-quotation-button";
import { formatCurrency } from "@/lib/utils";

export default async function QuotationsPage() {
  // Obtener cotizaciones del historial y del día
  const [historialResult, todayResult] = await Promise.all([
    getQuotations(50),
    getTodayQuotations(),
  ]);

  const quotations = historialResult.quotations || [];
  const todayQuotations = todayResult.quotations || [];

  // Calcular KPIs
  const quotationsCount = todayQuotations.length;
  const totalAmountToday = todayQuotations.reduce(
    (acc, q) => acc + (q.total_amount || 0),
    0
  );

  // Formatear folio (últimos 8 caracteres del UUID)
  const formatFolio = (id: string) => id.slice(-8).toUpperCase();

  // Formatear fecha a formato local
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">
            Historial de todas tus cotizaciones
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI: Cotizaciones Hoy */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Cotizaciones Hoy
          </div>
          <div className="text-3xl font-bold text-foreground">
            {quotationsCount}
          </div>
        </div>

        {/* KPI: Monto Total Hoy */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Monto Total Hoy
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(totalAmountToday)}
          </div>
        </div>
      </div>

      {/* Tabla de Historial */}
      {quotations.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Folio
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                      {formatFolio(quotation.id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {formatDate(quotation.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {quotation.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {formatCurrency(quotation.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Ver */}
                        <Link href={`/dashboard/quotes/${quotation.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            title="Ver cotización"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </Link>

                        {/* Eliminar */}
                        <DeleteQuotationButton quotationId={quotation.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
          <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-muted mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay cotizaciones aún
          </h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primera cotización seleccionando productos del inventario.
          </p>
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nueva Cotización
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
