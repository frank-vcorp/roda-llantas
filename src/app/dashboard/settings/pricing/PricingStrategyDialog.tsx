/**
 * Componente Dialog para estrategia de precios simplificada (Grid de Márgenes)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260218-PRICING-GRID
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PricingRule } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPricingRule, updatePricingRule } from "./actions";
import { toast } from "sonner";

// Esquema simplificado
const strategySchema = z.object({
    name: z.string().min(3, "El nombre es obligatorio"),
    brand_pattern: z.string().nullable(),
    public_margin: z.number().min(0).max(100),
    promo_margin: z.number().min(0).max(100),
    promo_qty: z.number().min(2).max(100),
    wholesale_margin: z.number().min(0).max(100),
    wholesale_qty: z.number().min(2).max(100),
});

type FormValues = z.infer<typeof strategySchema>;

interface PricingStrategyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule?: PricingRule | null;
    onSuccess?: () => void;
}

export function PricingStrategyDialog({
    open,
    onOpenChange,
    rule,
    onSuccess,
}: PricingStrategyDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [testCost, setTestCost] = useState<number>(1000);
    const [quoterQty, setQuoterQty] = useState<number>(1);

    const form = useForm<FormValues>({
        resolver: zodResolver(strategySchema),
        defaultValues: {
            name: "",
            brand_pattern: null,
            public_margin: 35,
            promo_margin: 33,
            promo_qty: 4,
            wholesale_margin: 30,
            wholesale_qty: 8,
        },
    });

    useEffect(() => {
        if (rule) {
            // Parsear volume rules para extraer los márgenes específicos
            let vRules: any[] = [];
            if (typeof rule.volume_rules === "string") {
                try { vRules = JSON.parse(rule.volume_rules); } catch (e) { vRules = []; }
            } else if (Array.isArray(rule.volume_rules)) {
                vRules = rule.volume_rules;
            }

            // Mapear reglas: 0->Promo, 1->Mayoreo (ignoring any extra legacy rules)
            const r1 = vRules[0]; // Promo
            const r2 = vRules[vRules.length - 1]; // Wholesale (usually the last/highest qty)

            // If only 1 rule exists, map it to promo, leave wholesale default?
            // Safer to map what we have.

            form.reset({
                name: rule.name || "",
                brand_pattern: rule.brand_pattern || null,
                public_margin: rule.margin_percentage || 35,
                promo_margin: r1?.margin_percentage || 33,
                promo_qty: r1?.min_qty || 4,
                wholesale_margin: r2?.margin_percentage || 30,
                wholesale_qty: r2?.min_qty || 8,
            });
        } else {
            // Default values for new rule
            form.reset({
                name: "",
                brand_pattern: null,
                public_margin: 35,
                promo_margin: 33,
                promo_qty: 4,
                wholesale_margin: 30,
                wholesale_qty: 8,
            });
        }
    }, [rule, form]);

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            // Construir el objeto PricingRule compatible con la DB
            const dbPayload = {
                name: values.name,
                brand_pattern: values.brand_pattern,
                margin_percentage: values.public_margin,
                priority: values.brand_pattern ? 10 : 1, // Prioridad automática: Marca > General
                is_active: true,
                volume_rules: [
                    { min_qty: values.promo_qty, margin_percentage: values.promo_margin },
                    { min_qty: values.wholesale_qty, margin_percentage: values.wholesale_margin },
                ],
            };

            if (rule?.id) {
                const result = await updatePricingRule(rule.id, dbPayload);
                if (result.success) {
                    toast.success("Estrategia actualizada");
                    onOpenChange(false);
                    onSuccess?.();
                } else {
                    toast.error(result.error || "Error al actualizar");
                }
            } else {
                const result = await createPricingRule(dbPayload);
                if (result.success) {
                    toast.success("Estrategia creada");
                    onOpenChange(false);
                    form.reset();
                    onSuccess?.();
                } else {
                    toast.error(result.error || "Error al crear");
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {rule ? "Editar Estrategia de Precios" : "Nueva Estrategia de Precios"}
                    </DialogTitle>
                    <DialogDescription>
                        Define los márgenes para cada nivel de volumen.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Estrategia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Estrategia Michelin" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="brand_pattern"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej. Michelin (vacío para General)"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={e => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-medium mb-4 text-slate-700">Grid de Márgenes (%)</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="public_margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-500">Público (1 pza)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="font-bold text-center"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <FormLabel className="text-xs text-emerald-600 font-bold flex flex-col gap-1 items-center">
                                        <span>Promoción (Qty)</span>
                                        <FormField
                                            control={form.control}
                                            name="promo_qty"
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    className="h-6 w-12 text-center text-xs p-0 bg-white border-emerald-200"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                                />
                                            )}
                                        />
                                    </FormLabel>
                                    <FormField
                                        control={form.control}
                                        name="promo_margin"
                                        render={({ field }) => (
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="font-bold text-center border-emerald-200 bg-emerald-50/50"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel className="text-xs text-slate-500 font-bold flex flex-col gap-1 items-center">
                                        <span>Mayoreo (Qty)</span>
                                        <FormField
                                            control={form.control}
                                            name="wholesale_qty"
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    className="h-6 w-12 text-center text-xs p-0 bg-white border-slate-200"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                                />
                                            )}
                                        />
                                    </FormLabel>
                                    <FormField
                                        control={form.control}
                                        name="wholesale_margin"
                                        render={({ field }) => (
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="font-bold text-center"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SIMULADOR DE PRECIOS (SANDBOX) */}
                        <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 text-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    🧪 Simulador de Precios
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Costo de Prueba:</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                                        <Input
                                            type="number"
                                            className="h-8 pl-5 bg-slate-800 border-slate-700 text-white text-right"
                                            value={testCost}
                                            onChange={(e) => setTestCost(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center text-xs">
                                <div className="p-2 bg-slate-800 rounded border border-slate-700">
                                    <p className="text-slate-400 mb-1">Público</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("public_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-400 mt-1">
                                        Contento: +${Math.round((testCost * (1 + (form.watch("public_margin") || 0) / 100)) - testCost)}
                                    </p>
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                                    <p className="text-emerald-400 mb-1">{form.watch("promo_qty") || 4} Pzas (Promo)</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("promo_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-500/70 mt-1">
                                        +${Math.round((testCost * (1 + (form.watch("promo_margin") || 0) / 100)) - testCost)}
                                    </p>
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                                    <p className="text-slate-400 mb-1">{form.watch("wholesale_qty") || 8}+ Pzas (Mayoreo)</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("wholesale_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-500/70 mt-1">
                                        +${Math.round((testCost * (1 + (form.watch("wholesale_margin") || 0) / 100)) - testCost)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* COTIZADOR DE LOGICA (QUOTER) */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                🧮 Cotizador de Reglas
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="w-full sm:w-1/3">
                                    <FormLabel className="text-xs text-slate-500">Cantidad a Comprar</FormLabel>
                                    <Input
                                        type="number"
                                        className="mt-1 bg-white"
                                        placeholder="Ej. 10"
                                        onChange={(e) => {
                                            setQuoterQty(parseInt(e.target.value) || 0);
                                        }}
                                    />
                                </div>
                                <div className="flex-1 bg-white p-3 rounded border border-slate-200">
                                    <p className="text-xs text-slate-400 mb-1">Regla Aplicada:</p>
                                    {(() => {
                                        const qty = quoterQty;
                                        const pQty = form.watch("promo_qty") || 4;
                                        const wsQty = form.watch("wholesale_qty") || 8;

                                        let applied = "Público";
                                        let margin = form.watch("public_margin");
                                        let color = "text-slate-700";
                                        let bg = "bg-slate-100";

                                        if (qty >= wsQty) {
                                            applied = "Mayoreo";
                                            margin = form.watch("wholesale_margin");
                                            color = "text-slate-800";
                                            bg = "bg-slate-200";
                                        } else if (qty >= pQty) {
                                            applied = "Promoción";
                                            margin = form.watch("promo_margin");
                                            color = "text-emerald-700";
                                            bg = "bg-emerald-100";
                                        }

                                        // Calculate Price
                                        const price = Math.round(testCost * (1 + (margin || 0) / 100));

                                        return (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className={`text-lg font-bold ${color}`}>{applied}</span>
                                                    <p className="text-xs text-muted-foreground">Margen: {margin}%</p>
                                                </div>
                                                <div className={`text-right px-3 py-1 rounded ${bg}`}>
                                                    <span className={`text-xl font-mono font-bold ${color}`}>${price}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-slate-900">
                                {isLoading ? "Guardando..." : "Guardar Estrategia"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
