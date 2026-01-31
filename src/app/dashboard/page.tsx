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
  FileText,
  LayoutDashboard,
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
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Panel de Control
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Sistema Conectado</span>
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Cotizado Hoy */}
          <Card className="relative overflow-hidden border-none shadow-xl shadow-blue-500/5 bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-900/10 rounded-3xl group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600/80">Cotizado Hoy</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{formatCurrency(metrics.quotations.total_amount)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold py-0.5 px-2 bg-blue-500/10 text-blue-600 rounded-full">
                  {metrics.quotations.count} {metrics.quotations.count === 1 ? "operación" : "operaciones"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Búsquedas sin Éxito */}
          <Card className="relative overflow-hidden border-none shadow-xl shadow-orange-500/5 bg-gradient-to-br from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-900/10 rounded-3xl group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <SearchX className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-orange-600/80">Oportunidades</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <SearchX className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{metrics.lost_sales_count}</div>
              <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-tighter mt-2 mt-2">Búsquedas sin stock hoy</p>
            </CardContent>
          </Card>

          {/* Card 3: Stock Crítico */}
          <Card className="relative overflow-hidden border-none shadow-xl shadow-red-500/5 bg-gradient-to-br from-white to-red-50/30 dark:from-zinc-900 dark:to-red-900/10 rounded-3xl group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertTriangle className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-600/80">Alertas Stock</CardTitle>
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{metrics.low_stock_count}</div>
              <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-tighter mt-2">Productos por agotarse</p>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Rápidos */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Accesos Directos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/quotes/new" className="group">
              <Button className="w-full h-auto py-6 flex flex-col items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-primary hover:text-primary-foreground border-none shadow-lg shadow-black/5 rounded-3xl transition-all duration-300 group-hover:-translate-y-1" variant="outline">
                <div className="p-3 bg-primary/5 group-hover:bg-white/20 rounded-2xl transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm">Nueva Cotización</span>
              </Button>
            </Link>
            <Link href="/dashboard/inventory" className="group">
              <Button className="w-full h-auto py-6 flex flex-col items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-primary hover:text-primary-foreground border-none shadow-lg shadow-black/5 rounded-3xl transition-all duration-300 group-hover:-translate-y-1" variant="outline">
                <div className="p-3 bg-primary/5 group-hover:bg-white/20 rounded-2xl transition-colors">
                  <Package className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm">Gestión de Inventario</span>
              </Button>
            </Link>
            <Link href="/dashboard/inventory/import" className="group">
              <Button className="w-full h-auto py-6 flex flex-col items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-primary hover:text-primary-foreground border-none shadow-lg shadow-black/5 rounded-3xl transition-all duration-300 group-hover:-translate-y-1" variant="outline">
                <div className="p-3 bg-primary/5 group-hover:bg-white/20 rounded-2xl transition-colors">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm">Importar Catálogo</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tablas de Resumen */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tabla 1: Últimas Cotizaciones */}
          <Card className="border-none shadow-xl shadow-black/5 bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <CardTitle className="text-lg font-black tracking-tight">Actividad Reciente</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Últimas cotizaciones generadas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.recent_quotations.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">Cliente</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Monto</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest pr-6">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.recent_quotations.map((quote) => (
                      <TableRow key={quote.id} className="border-b border-border/30 last:border-none group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-sm pl-6 py-4">{quote.customer_name}</TableCell>
                        <TableCell className="text-right font-black text-sm text-primary">
                          {formatCurrency(quote.total_amount)}
                        </TableCell>
                        <TableCell className="text-right text-[10px] font-bold text-muted-foreground pr-6">
                          {formatDate(quote.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <FileText className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Sin movimientos hoy</p>
                  <Link href="/dashboard/quotes/new">
                    <Button className="rounded-2xl font-bold" size="sm" variant="secondary">
                      Crear Cotización
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla 2: Top Búsquedas sin Resultado */}
          <Card className="border-none shadow-xl shadow-black/5 bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <CardTitle className="text-lg font-black tracking-tight">Faltantes en Stock</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Lo que el cliente buscó hoy</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.top_lost_searches.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">Término de Búsqueda</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest pr-6">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.top_lost_searches.map((lost, idx) => (
                      <TableRow key={idx} className="border-b border-border/30 last:border-none hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-sm pl-6 py-4 truncate max-w-[200px]">{lost.search_term}</TableCell>
                        <TableCell className="text-right text-[10px] font-bold text-muted-foreground pr-6">
                          {formatDate(lost.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                  <div className="p-4 bg-green-500/10 rounded-full">
                    <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Todo en existencia</p>
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
