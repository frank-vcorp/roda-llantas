'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Search } from 'lucide-react';
import { getLostSalesStats, type LostSalesStats } from '@/lib/actions/analytics';

/**
 * Lost Sales Analytics Page
 * 
 * Visualiza términos de búsqueda sin resultados agrupados por frecuencia.
 * Permite al dueño identificar demanda insatisfecha y decidir qué comprar.
 * 
 * @author SOFIA - Builder
 * @date 2026-01-29
 * @id IMPL-20260129-LOST-SALES-02
 */

export default function LostSalesPage() {
  const [stats, setStats] = useState<LostSalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLostSalesStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading lost sales data');
        console.error('Error fetching lost sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const handleGoogleSearch = (query: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas Perdidas</h1>
        <p className="text-muted-foreground mt-2">
          Términos de búsqueda sin resultados. Identifica demanda insatisfecha para optimizar tu inventario.
        </p>
      </div>

      {/* KPIs Header */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Búsquedas Fallidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.totalQueries.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Búsquedas que no arrojaron resultados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Término Top #1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {stats?.topTerm || 'Sin datos'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Término más buscado sin resultados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Búsquedas Fallidas</CardTitle>
          <CardDescription>
            Ordenadas por frecuencia. Usa estas palabras para decidir qué comprar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {error}
            </div>
          ) : !stats || stats.data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay búsquedas sin resultados registradas aún.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Término de Búsqueda</TableHead>
                    <TableHead className="text-center">Frecuencia</TableHead>
                    <TableHead>Última Vez</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.data.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.normalized_query}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="justify-center">
                          {item.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.last_seen).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(item.normalized_query)}
                          title="Copiar término"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGoogleSearch(item.normalized_query)}
                          title="Buscar en Google"
                        >
                          <Search className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Google</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
