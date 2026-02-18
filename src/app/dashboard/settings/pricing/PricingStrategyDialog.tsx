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
    promo3_margin: z.number().min(0).max(100),
    promo4_margin: z.number().min(0).max(100),
    wholesale_margin: z.number().min(0).max(100),
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

    const form = useForm<FormValues>({
        resolver: zodResolver(strategySchema),
        defaultValues: {
            name: "",
            brand_pattern: null,
            public_margin: 35,
            promo3_margin: 33,
            promo4_margin: 31,
            wholesale_margin: 30,
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

            form.reset({
                name: rule.name || "",
                brand_pattern: rule.brand_pattern || null,
                public_margin: rule.margin_percentage || 35,
                promo3_margin: vRules.find((r: any) => r.min_qty === 3)?.margin_percentage || 33,
                promo4_margin: vRules.find((r: any) => r.min_qty === 4)?.margin_percentage || 31,
                wholesale_margin: vRules.find((r: any) => r.min_qty === 8)?.margin_percentage || 30,
            });
        } else {
            // Default values for new rule
            form.reset({
                name: "",
                brand_pattern: null,
                public_margin: 35,
                promo3_margin: 33,
                promo4_margin: 31,
                wholesale_margin: 30,
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
                    { min_qty: 3, margin_percentage: values.promo3_margin },
                    { min_qty: 4, margin_percentage: values.promo4_margin },
                    { min_qty: 8, margin_percentage: values.wholesale_margin },
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
            <DialogContent className="sm:max-w-[600px]">
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
                            <div className="grid grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="public_margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-500">Público (1-2)</FormLabel>
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
                                <FormField
                                    control={form.control}
                                    name="promo3_margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-emerald-600 font-bold">Promo 3 Pzas</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="font-bold text-center border-emerald-200 bg-emerald-50/50"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="promo4_margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-blue-600 font-bold">Promo 4 Pzas</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="font-bold text-center border-blue-200 bg-blue-50/50"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="wholesale_margin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-500">Mayoreo (8+)</FormLabel>
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
                            </div>
                        </div>

                        {/* SIMULADOR DE PRECIOS (SANDBOX) - IMPL-20260218-SIMULATOR */}
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

                            <div className="grid grid-cols-4 gap-4 text-center text-xs">
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
                                    <p className="text-emerald-400 mb-1">Promo 3</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("promo3_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-500/70 mt-1">
                                        +${Math.round((testCost * (1 + (form.watch("promo3_margin") || 0) / 100)) - testCost)}
                                    </p>
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                                    <p className="text-blue-400 mb-1">Promo 4</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("promo4_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-500/70 mt-1">
                                        +${Math.round((testCost * (1 + (form.watch("promo4_margin") || 0) / 100)) - testCost)}
                                    </p>
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                                    <p className="text-slate-400 mb-1">Mayoreo</p>
                                    <p className="text-lg font-bold text-white">
                                        ${Math.round(testCost * (1 + (form.watch("wholesale_margin") || 0) / 100))}
                                    </p>
                                    <p className="text-emerald-500/70 mt-1">
                                        +${Math.round((testCost * (1 + (form.watch("wholesale_margin") || 0) / 100)) - testCost)}
                                    </p>
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
