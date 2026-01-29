/**
 * Cliente Supabase para el navegador (Browser Client)
 * Patrón App Router de Next.js
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-02
 * @ref context/Documento de Especificaciones Técnicas Llantera.md
 */

import { createBrowserClient as createClient } from "@supabase/ssr";

export const createBrowserClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
