/**
 * IMPL-20260129-SPRINT1
 * Layout para las páginas de autenticación
 * Documentación: context/Documento de Especificaciones Técnicas Llantera.md
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200 via-background to-zinc-300 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">{children}</div>
    </div>
  );
}
