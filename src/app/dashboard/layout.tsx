/**
 * IMPL-20260129-SPRINT1, IMPL-20260129-ROLES-MOBILE
 * Layout para el dashboard protegido
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md, context/SPEC-ROLES-MOBILE.md
 *
 * @id IMPL-20260129-QUOTES-01 - Agregado QuoteProvider
 * @id IMPL-20260129-ROLES-MOBILE - Agregado getUserRole y filtrado de navegación
 */

import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { QuoteProvider } from "@/lib/contexts/quote-context";
import { StickyQuoteFooter } from "@/components/quote/sticky-quote-footer";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/role";
import { UserRole } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  let userRole: UserRole | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || null;
      userRole = await getUserRole(user.id);
    }
  } catch (error) {
    console.error("[DashboardLayout] Error fetching user role:", error);
  }

  return (
    <QuoteProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-foreground">Roda Llantas</h1>
              <DashboardNav userRole={userRole} />
            </div>
            <div className="flex items-center gap-4">
              <UserNav email={userEmail} role={userRole} />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {children}
        </main>
        <StickyQuoteFooter />
      </div>
    </QuoteProvider>
  );
}

