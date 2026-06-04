"use client";

/**
 * Formulario cliente para importacion de servicios.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-02
 * @ref context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseServiceExcel, type ParsedServiceImportRow } from "@/lib/logic/service-excel-parser";
import { importServices, type ServiceMutationResult } from "@/app/dashboard/services/actions";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ServiceImportForm() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedServiceImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ServiceMutationResult | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.basePrice, 0),
    [rows]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);

    startParsing(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const parsedRows = parseServiceExcel(arrayBuffer);
        setRows(parsedRows);
      } catch (parseError) {
        setRows([]);
        setError(parseError instanceof Error ? parseError.message : "No se pudo procesar el archivo.");
      }
    });
  };

  const handleSave = () => {
    if (!rows.length) {
      setError("Primero debes cargar un archivo con filas validas.");
      return;
    }

    setError(null);
    setResult(null);

    startSaving(async () => {
      const response = await importServices(rows);
      setResult(response);

      if (response.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">1. Cargar archivo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                El importador respeta el nombre original, categoria y precio del Excel. Solo separa el tier final A, AA o AAA.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={isParsing || isSaving} />
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>Columnas esperadas: SKU, Nombre del producto, Categoria, Precio de venta.</p>
              <p className="mt-2">Archivo actual: {fileName || "Ninguno"}</p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">2. Resumen de vista previa</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Filas</dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">{rows.length}</dd>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Monto base</dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(totalAmount)}</dd>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Estado</dt>
              <dd className="mt-2 text-sm font-semibold text-foreground">
                {isParsing ? "Procesando archivo" : rows.length ? "Listo para guardar" : "Sin datos cargados"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleSave} disabled={!rows.length || isParsing || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar en BD
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/services")}
              disabled={isSaving}
            >
              Ver listado
            </Button>
          </div>
        </article>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            <div className="space-y-2">
              <p>{result.message}</p>
              {result.errors?.length ? (
                <ul className="list-disc pl-5 text-sm">
                  {result.errors.slice(0, 5).map((item) => (
                    <li key={`${item.index}-${item.error}`}>
                      Fila {item.index}: {item.error}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-3xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">3. Vista previa</h2>
          <p className="text-sm text-muted-foreground">
            Revisa nombre original, categoria, tier y precio base antes de guardar.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            La vista previa aparecera aqui despues de seleccionar un archivo valido.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Display name</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Precio base</th>
                  <th className="px-5 py-3 font-medium">Alias base</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.sku}-${index}`} className="border-t border-border">
                    <td className="px-5 py-4 font-medium text-foreground">{row.displayName}</td>
                    <td className="px-5 py-4 text-foreground">{row.category}</td>
                    <td className="px-5 py-4 text-foreground">{row.tierCode}</td>
                    <td className="px-5 py-4 text-foreground">{formatCurrency(row.basePrice)}</td>
                    <td className="px-5 py-4 text-foreground">{row.alias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}