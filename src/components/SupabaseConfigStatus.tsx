/**
 * Componente que verifica el estado de la configuración de Supabase
 * Muestra una alerta si la URL no está configurada o está con valores por defecto
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-02
 * @ref context/Documento de Especificaciones Técnicas Llantera.md
 */

"use client";

export default function SupabaseConfigStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isConfigured =
    supabaseUrl &&
    supabaseUrl !== "https://tu-proyecto.supabase.co" &&
    supabaseUrl.startsWith("https://");

  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-lg border-2 font-semibold text-lg max-w-md ${
          isConfigured
            ? "bg-green-50 border-green-300 text-green-700"
            : "bg-amber-50 border-amber-300 text-amber-700"
        }`}
      >
        {isConfigured ? (
          <>
            <span className="text-2xl">✅</span>
            <span>Supabase URL detectada</span>
          </>
        ) : (
          <>
            <span className="text-2xl">⚠️</span>
            <span>Supabase no configurado</span>
          </>
        )}
      </div>
    </div>
  );
}
