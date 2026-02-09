/**
 * IMPL-20260129-SPRINT1
 * Middleware de Supabase para actualizar sesiones y proteger rutas
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          // Re-create the response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: Actualizar la sesión de Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protección de rutas
  const pathname = request.nextUrl.pathname;

  // Si intenta acceder a /dashboard sin sesión, redirigir a /login
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si está en /login pero tiene sesión, redirigir a /dashboard
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
