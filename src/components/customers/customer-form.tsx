"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Customer } from "@/lib/types";
import { updateCustomer } from "@/app/dashboard/customers/actions";
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
import { toast } from "sonner";

/**
 * Esquema de validación para actualizar cliente
 */
const customerFormSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  tax_id: z.string().optional().nullable(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer: Customer;
  onSuccess?: () => void;
}

/**
 * CustomerForm
 *
 * Formulario para editar un cliente existente.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03
 * @ref context/SPEC-CRM-LITE.md
 */

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      tax_id: customer.tax_id || "",
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    startTransition(async () => {
      const result = await updateCustomer(customer.id, {
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        tax_id: data.tax_id || null,
      });

      if (result.success) {
        toast.success("Cliente actualizado correctamente");
        onSuccess?.();
      } else {
        toast.error(result.error || "Error al actualizar cliente");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1234567890"
                  {...field}
                  value={field.value || ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Opcional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  {...field}
                  value={field.value || ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Opcional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RFC / NIT</FormLabel>
              <FormControl>
                <Input
                  placeholder="RFC o NIT"
                  {...field}
                  value={field.value || ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Opcional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
