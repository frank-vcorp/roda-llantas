import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * IMPL-20260129-SPRINT1
 * Middleware para protección de rutas autenticadas
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 *
 * - Protege rutas de /dashboard
 * - Redirige a /login si no hay sesión válida
 * - Actualiza la sesión de Supabase en cada petición
 */

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Processing request for: ${request.nextUrl.pathname}`);
  const response = await updateSession(request);
  if (response.headers.get("location")) {
    console.log(`[Middleware] Redirecting to: ${response.headers.get("location")}`);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
