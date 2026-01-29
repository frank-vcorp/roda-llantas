/**
 * IMPL-20260129-SPRINT1
 * Layout para el dashboard protegido
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 *
 * @id IMPL-20260129-QUOTES-01 - Agregado QuoteProvider
 */

import { DashboardNav } from "@/components/dashboard/nav";
import { QuoteProvider } from "@/lib/contexts/quote-context";
import { StickyQuoteFooter } from "@/components/quote/sticky-quote-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuoteProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-foreground">Roda Llantas</h1>
              <DashboardNav />
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
