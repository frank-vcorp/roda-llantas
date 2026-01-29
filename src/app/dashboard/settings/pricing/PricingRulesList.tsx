/**
 * Componente tabla de reglas de precios
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-UI
 * @ref context/SPEC-PRICING-ENGINE.md
 */

"use client";

import { useState } from "react";
import { PricingRule } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { deletePricingRule } from "./actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PricingRulesListProps {
  rules: PricingRule[];
  onEdit: (rule: PricingRule) => void;
  onDeleted?: () => void;
}

export function PricingRulesList({
  rules,
  onEdit,
  onDeleted,
}: PricingRulesListProps) {
  const [ruleToDelete, setRuleToDelete] = useState<PricingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (ruleId: string) => {
    setIsDeleting(true);
    try {
      const result = await deletePricingRule(ruleId);
      if (result.success) {
        toast.success("Regla eliminada correctamente");
        setRuleToDelete(null);
        onDeleted?.();
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No hay reglas de precio configuradas
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea una nueva regla para comenzar
          </p>
        </div>
      </div>
    );
  }

  // Ordenar por prioridad descendente
  const sortedRules = [...rules].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell>
                {rule.brand_pattern ? (
                  <span className="text-sm">{rule.brand_pattern}</span>
                ) : (
                  <Badge variant="secondary">Todas</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">%</Badge>
              </TableCell>
              <TableCell>
                {`${rule.margin_percentage}%`}
              </TableCell>
              <TableCell>
                <span className="text-sm font-semibold">
                  {rule.priority || 1}
                </span>
              </TableCell>
              <TableCell>
                {rule.is_active !== false ? (
                  <Badge>Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(rule)}
                  title="Editar regla"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRuleToDelete(rule)}
                  title="Eliminar regla"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={!!ruleToDelete}
        onOpenChange={(open: boolean) => !open && setRuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la regla "{ruleToDelete?.name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                ruleToDelete && handleDelete(ruleToDelete.id)
              }
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
