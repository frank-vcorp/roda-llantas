"use client";

/**
 * Formulario cliente para alta individual basica de servicios.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-02
 * @fix FIX-20260604-04
 * @ref context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createService, type CreateServiceInput, type ServiceMutationResult } from "@/app/dashboard/services/actions";

const DEFAULT_FORM: {
  category: string;
  displayName: string;
  tierCode: CreateServiceInput["tierCode"];
  basePrice: string;
  manualPrice: string;
} = {
  category: "",
  displayName: "",
  tierCode: "A",
  basePrice: "",
  manualPrice: "",
};

const COMMERCIAL_TIER_OPTIONS: Array<{
  label: string;
  value: CreateServiceInput["tierCode"];
}> = [
  { value: "A", label: "Basica" },
  { value: "AA", label: "Media" },
  { value: "AAA", label: "Premium" },
];

export function ServiceForm() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState<ServiceMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      const payload: CreateServiceInput = {
        category: form.category,
        displayName: form.displayName,
        tierCode: form.tierCode,
        basePrice: Number(form.basePrice),
        manualPrice: form.manualPrice ? Number(form.manualPrice) : null,
      };

      const response = await createService(payload);
      setResult(response);

      if (response.success) {
        setForm(DEFAULT_FORM);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Ej. Frenos"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tierCode">Gama</Label>
            <select
              id="tierCode"
              name="tierCode"
              value={form.tierCode}
              onChange={handleChange}
              disabled={isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {COMMERCIAL_TIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="displayName">Nombre del servicio</Label>
            <Input
              id="displayName"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="Ej. Cambio de balatas delanteras"
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Captura el nombre comercial sin sufijos. La gama se selecciona por separado y el nombre visible se conserva limpio.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={handleChange}
              placeholder="0.00"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualPrice">Precio manual (opcional)</Label>
            <Input
              id="manualPrice"
              name="manualPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.manualPrice}
              onChange={handleChange}
              placeholder="0.00"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar servicio
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push("/dashboard/services")}
          >
            Volver al listado
          </Button>
        </div>
      </form>

      {result ? (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}