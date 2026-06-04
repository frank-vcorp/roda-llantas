/**
 * Listado administrativo del modulo de servicios.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-02
 * @ref context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServicesAdminList } from "./actions";

export const dynamic = "force-dynamic";

interface ServicesPageProps {
  searchParams: Promise<{
    query?: string;
  }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function ServicesPage(props: ServicesPageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams?.query || "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const items = await getServicesAdminList(query);

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Modulo de servicios
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Servicios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Administra el catalogo interno de servicios sin mezclarlo con cotizaciones ni carrito.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/services/import">
            <Button variant="outline" className="w-full sm:w-auto">
              Importar servicios
            </Button>
          </Link>
          <Link href="/dashboard/services/new">
            <Button className="w-full sm:w-auto">Nuevo servicio</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <form method="get" className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            name="query"
            defaultValue={query}
            placeholder="Buscar por nombre, categoria o tier"
            className="md:max-w-md"
          />
          <div className="flex gap-3">
            <Button type="submit">Buscar</Button>
            <Link href="/dashboard/services">
              <Button type="button" variant="ghost">
                Limpiar
              </Button>
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Listado administrativo</h2>
            <p className="text-sm text-muted-foreground">
              {items.length} registro{items.length === 1 ? "" : "s"} mostrado{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">No hay servicios para mostrar</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajusta la busqueda o utiliza la importacion inicial para cargar el catalogo.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Servicio</th>
                    <th className="px-5 py-3 font-medium">Categoria</th>
                    <th className="px-5 py-3 font-medium">Tier</th>
                    <th className="px-5 py-3 font-medium">Precio base</th>
                    <th className="px-5 py-3 font-medium">Precio manual</th>
                    <th className="px-5 py-3 font-medium">Precio final</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.tierId} className="border-t border-border align-top">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{item.displayName}</div>
                        <div className="text-xs text-muted-foreground">Base: {item.baseName}</div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{item.category}</td>
                      <td className="px-5 py-4 text-foreground">{item.tierCode}</td>
                      <td className="px-5 py-4 text-foreground">{formatCurrency(item.basePrice)}</td>
                      <td className="px-5 py-4 text-foreground">
                        {item.manualPrice === null ? "-" : formatCurrency(item.manualPrice)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {formatCurrency(item.finalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {items.map((item) => (
                <article key={item.tierId} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                      {item.tierCode}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Precio base</dt>
                      <dd className="font-medium text-foreground">{formatCurrency(item.basePrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Precio manual</dt>
                      <dd className="font-medium text-foreground">
                        {item.manualPrice === null ? "-" : formatCurrency(item.manualPrice)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Precio final</dt>
                      <dd className="text-base font-semibold text-foreground">{formatCurrency(item.finalPrice)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}