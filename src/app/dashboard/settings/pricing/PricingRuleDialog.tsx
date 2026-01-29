/**
 * Componente Dialog para crear/editar reglas de precios
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-UI
 * @ref context/SPEC-PRICING-ENGINE.md
 */

"use client";

import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPricingRule, updatePricingRule } from "./actions";
import { toast } from "sonner";

// Esquema de validación
const pricingRuleSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  brand_pattern: z.string().nullable(),
  margin_percentage: z
    .number({ message: "Debe ser un número" })
    .min(0, "El margen debe ser positivo")
    .max(1000, "El margen no puede exceder 1000"),
  priority: z.number().int().min(1, "Prioridad mínima es 1").max(100, "Prioridad máxima es 100"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof pricingRuleSchema>;

interface PricingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: PricingRule | null;
  onSuccess?: () => void;
}

export function PricingRuleDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: PricingRuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: rule
      ? {
          name: rule.name || "",
          brand_pattern: rule.brand_pattern || null,
          margin_percentage: rule.margin_percentage,
          priority: rule.priority || 1,
          is_active: rule.is_active !== false,
        }
      : {
          name: "",
          brand_pattern: null, // Cambiado de "" a null para Zod nullable
          margin_percentage: 25,
          priority: 1,
          is_active: true,
        },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      if (rule?.id) {
        // Actualizar
        const result = await updatePricingRule(rule.id, values);
        if (result.success) {
          toast.success("Regla actualizada correctamente");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Error al actualizar");
        }
      } else {
        // Crear
        const result = await createPricingRule(values);
        if (result.success) {
          toast.success("Regla creada correctamente");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Editar Regla de Precio" : "Crear Nueva Regla"}
          </DialogTitle>
          <DialogDescription>
            {rule
              ? "Actualiza los detalles de la regla de precio"
              : "Completa los campos para crear una nueva regla"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Regla</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. Margen Michelin Premium"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre descriptivo para identificar la regla
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Patrón de Marca */}
            <FormField
              control={form.control}
              name="brand_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patrón de Marca (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. Michelin, o dejar vacío para todas"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Usa % como comodín (ej. Miche% para Michelin y Michelob)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor de Margen */}
            <FormField
              control={form.control}
              name="margin_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margen de Ganancia (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.01}
                      placeholder="ej. 25"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                         const val = parseFloat(e.target.value);
                         field.onChange(isNaN(val) ? 0 : val);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje de ganancia sobre el costo (ej. 25 = 25%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prioridad */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad (1-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      placeholder="ej. 50"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Prioridad mayor = se aplica primero. Máximo 100.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
