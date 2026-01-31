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
      <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border/50 p-6 z-20 shadow-2xl shadow-black/5">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black text-lg">R</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">Roda Llantas</h1>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DashboardNav userRole={userRole} variant="sidebar" />
          </div>

          <div className="mt-auto pt-6 border-t border-border/50">
            <div className="bg-muted/30 p-4 rounded-3xl flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{userEmail?.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{userRole || 'Vendedor'}</p>
              </div>
              <UserNav email={userEmail} role={userRole} />
            </div>
          </div>
        </aside>

        {/* Mobile Header (Top) */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-card border-b border-border/50 sticky top-0 z-30 backdrop-blur-md bg-card/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-black text-xs">R</span>
            </div>
            <h1 className="text-md font-black tracking-tight">Roda Llantas</h1>
          </div>
          <UserNav email={userEmail} role={userRole} />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
          <main className="flex-1 px-4 sm:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full pb-32 md:pb-12">
            {children}
          </main>
          <StickyQuoteFooter />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-card/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl flex items-center z-40 animate-in slide-in-from-bottom-10 duration-500">
          <DashboardNav userRole={userRole} variant="mobile" />
        </nav>
      </div>
    </QuoteProvider>
  );
}

