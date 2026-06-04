/**
 * Alta individual basica de servicios.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-02
 * @ref context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/services/service-form";

export default async function NewServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8">
      <div>
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Servicios
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Nuevo servicio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registra un servicio con categoria, nombre, tier y precio base sin afectar el flujo de cotizacion.
        </p>
      </div>

      <ServiceForm />
    </div>
  );
}