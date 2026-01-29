/**
 * Página de Configuración de Precios
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-UI
 * @ref context/SPEC-PRICING-ENGINE.md
 */

"use client";

import { useState, useEffect } from "react";
import { PricingRule } from "@/lib/types";
import { getPricingRules } from "./actions";
import { PricingRulesList } from "./PricingRulesList";
import { PricingRuleDialog } from "./PricingRuleDialog";
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
            Configuración de Precios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las reglas de márgenes para calcular precios automáticos
          </p>
        </div>
        <Button onClick={handleNewRule} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando reglas...</p>
          </div>
        </div>
      ) : (
        <PricingRulesList
          rules={rules}
          onEdit={handleEditRule}
          onDeleted={loadRules}
        />
      )}

      {/* Dialog para crear/editar */}
      <PricingRuleDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        rule={selectedRule}
        onSuccess={loadRules}
      />

      {/* Info útil */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="font-semibold text-sm">Cómo funciona:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            Las reglas se ordenan por <strong>Prioridad</strong> (mayor número
            = mayor prioridad)
          </li>
          <li>
            El <strong>Patrón de Marca</strong> usa ILIKE (case-insensitive).
            Usa % como comodín.
          </li>
          <li>
            Si el patrón es vacío, la regla aplica a <strong>todas</strong> las
            marcas
          </li>
          <li>
            Los porcentajes se aplican al costo para calcular el precio de venta
          </li>
        </ul>
      </div>
    </div>
  );
}
