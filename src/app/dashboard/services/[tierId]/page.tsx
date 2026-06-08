/**
 * Pagina de edicion individual de servicio.
 *
 * @author INTEGRA
 * @id ARCH-20260608-01
 * @ref context/SPECs/SPEC-ARCH-20260608-01-EDICION-SERVICIOS.md
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/services/service-form";

interface EditServicePageProps {
  params: Promise<{
    tierId: string;
  }>;
}

export default async function EditServicePage(props: EditServicePageProps) {
  const params = await props.params;
  const tierId = params.tierId;

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
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Editar servicio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Modifica categoria, nombre, gama y precios del servicio sin afectar el flujo de cotizacion.
        </p>
      </div>

      <ServiceForm tierId={tierId} />
    </div>
  );
}