/**
 * IMPL-20260129-SPRINT1
 * Página principal - Redirige a login o dashboard según autenticación
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
