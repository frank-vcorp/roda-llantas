/**
 * Página de Configuración de Precios (Simplificada - Grid)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260218-PRICING-GRID
 */

"use client";

import { useState, useEffect } from "react";
import { PricingRule } from "@/lib/types";
import { getPricingRules } from "./actions";
import { PricingStrategyTable } from "./PricingStrategyTable"; // Nueva tabla grid
import { PricingStrategyDialog } from "./PricingStrategyDialog"; // Nuevo dialog simple
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PricingSettingsPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);

  // Cargar reglas al montar
  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setIsLoading(true);
    try {
      const result = await getPricingRules();
      if (result.success && result.rules) {
        setRules(result.rules);
      } else {
        toast.error(result.error || "Error al cargar las reglas");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleNewRule = () => {
    setSelectedRule(null);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: PricingRule) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedRule(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Estrategias de Precios
          </h1>
          <p className="text-muted-foreground mt-2">
            Define tu grid de márgenes para Público, Promociones (3 y 4 llantas) y Mayoreo.
          </p>
        </div>
        <Button onClick={handleNewRule} size="lg" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="w-4 h-4" />
          Nueva Estrategia
        </Button>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando estrategias...</p>
          </div>
        </div>
      ) : (
        <PricingStrategyTable
          rules={rules}
          onEdit={handleEditRule}
          onDeleted={loadRules}
        />
      )}

      {/* Dialog para crear/editar (Grid Mode) */}
      <PricingStrategyDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        rule={selectedRule}
        onSuccess={loadRules}
      />

      {/* Info útil */}
      <div className="rounded-lg border bg-blue-50 p-4 text-blue-800 text-sm">
        <p className="font-semibold mb-1">💡 Nota sobre la lógica:</p>
        <p>
          Si configuras una marca específica (ej. Michelin), el sistema usará esa estrategia primero.
          Si no hay estrategia para la marca, usará la estrategia General.
          <br />
          El <strong>Precio Público</strong> se calcula como Costo + Margen Público.
        </p>
      </div>
    </div>
  );
}
