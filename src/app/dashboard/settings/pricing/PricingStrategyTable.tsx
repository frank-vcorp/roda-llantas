/**
 * Componente tabla de estrategias de precios (Grid Simplificado)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260218-PRICING-GRID
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

interface PricingStrategyTableProps {
    rules: PricingRule[];
    onEdit: (rule: PricingRule) => void;
    onDeleted?: () => void;
}

export function PricingStrategyTable({
    rules,
    onEdit,
    onDeleted,
}: PricingStrategyTableProps) {
    const [ruleToDelete, setRuleToDelete] = useState<PricingRule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (ruleId: string) => {
        setIsDeleting(true);
        try {
            const result = await deletePricingRule(ruleId);
            if (result.success) {
                toast.success("Estrategia eliminada");
                setRuleToDelete(null);
                onDeleted?.();
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper para extraer márgenes de los JSON rules
    const getMargin = (rule: PricingRule, qty: number) => {
        if (!rule.volume_rules) return "-";
        let vRules: any[] = [];
        if (typeof rule.volume_rules === 'string') {
            try { vRules = JSON.parse(rule.volume_rules); } catch (e) { vRules = []; }
        } else if (Array.isArray(rule.volume_rules)) {
            vRules = rule.volume_rules;
        }
        const found = vRules.find((r: any) => r.min_qty === qty);
        return found ? `${found.margin_percentage}%` : "-";
    };

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Estrategia / Marca</TableHead>
                            <TableHead className="text-center bg-slate-50 text-slate-700 font-bold border-l">Público</TableHead>
                            <TableHead className="text-center bg-emerald-50 text-emerald-700 font-bold border-l">Promo 3</TableHead>
                            <TableHead className="text-center bg-blue-50 text-blue-700 font-bold border-l">Promo 4</TableHead>
                            <TableHead className="text-center bg-slate-50 text-slate-700 font-bold border-l border-r">Mayoreo (8+)</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No hay estrategias configuradas. Crea la primera.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{rule.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {rule.brand_pattern ? `Marca: ${rule.brand_pattern}` : "General (Todas)"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center border-l text-lg font-mono">
                                        {rule.margin_percentage}%
                                    </TableCell>
                                    <TableCell className="text-center border-l text-lg font-mono font-bold text-emerald-600 bg-emerald-50/10">
                                        {getMargin(rule, 3)}
                                    </TableCell>
                                    <TableCell className="text-center border-l text-lg font-mono font-bold text-blue-600 bg-blue-50/10">
                                        {getMargin(rule, 4)}
                                    </TableCell>
                                    <TableCell className="text-center border-l border-r text-lg font-mono text-slate-500">
                                        {getMargin(rule, 8)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => onEdit(rule)}
                                            >
                                                <Edit className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setRuleToDelete(rule)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog
                open={!!ruleToDelete}
                onOpenChange={(open) => !open && setRuleToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Estrategia?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará la estrategia "{ruleToDelete?.name}" y sus configuraciones de margen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2">
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => ruleToDelete && handleDelete(ruleToDelete.id)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
