/**
 * Página: Dashboard Settings (Configuración de Organización)
 *
 * Panel de administración para personalizar la marca:
 * - Nombre del negocio
 * - Dirección y contacto
 * - Logo (URL de imagen externa)
 * - Mensaje de pie de página para tickets
 *
 * @id IMPL-20260130-WHITELABEL
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { getOrganizationSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Configuración | Dashboard",
  description: "Personaliza tu marca y configuración del negocio",
};

export default async function SettingsPage() {
  // Validar autenticación
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Obtener settings actuales
  const settings = await getOrganizationSettings();

  return (
    <div className="container max-w-2xl py-10 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground mt-2">
              Personaliza tu marca y la información que aparece en tus cotizaciones
            </p>
          </div>
          {/* Link a gestión de precios - FIX-20260130-ORPHAN-LINK */}
          <Link href="/dashboard/settings/pricing">
            <Button variant="outline">Gestionar Reglas de Precios</Button>
          </Link>
        </div>

        {/* Form */}
        <SettingsForm initialData={settings} />
      </div>
    </div>
  );
}
