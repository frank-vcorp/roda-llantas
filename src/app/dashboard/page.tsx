/**
 * IMPL-20260129-DASH-01
 * Página del dashboard - Analytics y Panel de Control
 * Implementación completa con KPIs, accesos rápidos y tablas de resumen
 * @ref context/SPEC-DASHBOARD-ANALYTICS.md
 */

import { getDashboardMetrics } from "@/lib/services/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  SearchX,
  AlertTriangle,
  Package,
  Upload,
  Plus,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Formatea moneda a MXN
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Formatea fecha a formato corto
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-MX", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  try {
    // Obtener métricas del dashboard
    const metrics = await getDashboardMetrics();

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-4xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-2">
            Resumen de tu negocio - {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Cotizado Hoy */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotizado Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.quotations.total_amount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.quotations.count} {metrics.quotations.count === 1 ? "cotización" : "cotizaciones"}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Búsquedas sin Éxito */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Búsquedas sin Éxito</CardTitle>
              <SearchX className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.lost_sales_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Demanda insatisfecha hoy</p>
            </CardContent>
          </Card>

          {/* Card 3: Stock Crítico */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.low_stock_count}</div>
              <p className="text-xs text-muted-foreground mt-1">Productos con stock ≤ 4</p>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Rápidos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/dashboard/quotes/new">
              <Button className="w-full h-auto py-4 flex flex-col items-center gap-2" variant="outline">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Nueva Cotización</span>
              </Button>
            </Link>
            <Link href="/dashboard/inventory">
              <Button className="w-full h-auto py-4 flex flex-col items-center gap-2" variant="outline">
                <Package className="h-5 w-5" />
                <span className="font-medium">Gestión de Inventario</span>
              </Button>
            </Link>
            <Link href="/dashboard/inventory/import">
              <Button className="w-full h-auto py-4 flex flex-col items-center gap-2" variant="outline">
                <Upload className="h-5 w-5" />
                <span className="font-medium">Importar Productos</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tablas de Resumen */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Tabla 1: Últimas Cotizaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Cotizaciones</CardTitle>
              <CardDescription>Últimas 5 cotizaciones generadas</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.recent_quotations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.recent_quotations.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.customer_name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(quote.total_amount)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDate(quote.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay cotizaciones aún hoy</p>
                  <Link href="/dashboard/quotes/new">
                    <Button className="mt-4" size="sm">
                      Crear cotización
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla 2: Top Búsquedas sin Resultado */}
          <Card>
            <CardHeader>
              <CardTitle>Qué buscan y no encuentran</CardTitle>
              <CardDescription>Top búsquedas fallidas de hoy</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.top_lost_searches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Búsqueda</TableHead>
                      <TableHead className="text-right">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.top_lost_searches.map((lost, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium truncate">{lost.search_term}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDate(lost.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>¡Excelente! Sin búsquedas fallidas hoy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[DashboardPage] Error loading metrics:", error);
    // Mostrar fallback o redirigir si no hay sesión
    return redirect("/auth/login");
  }
}
