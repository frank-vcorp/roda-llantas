"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * IMPL-20260129-SPRINT1
 * Server Action para autenticación con email/password
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 */

export async function login(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
  };
}

export async function signout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
