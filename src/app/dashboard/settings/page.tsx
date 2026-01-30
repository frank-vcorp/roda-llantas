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
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { getOrganizationSettings } from "@/lib/actions/settings";

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza tu marca y la información que aparece en tus cotizaciones
          </p>
        </div>

        {/* Form */}
        <SettingsForm initialData={settings} />
      </div>
    </div>
  );
}
