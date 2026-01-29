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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
