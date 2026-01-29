/**
 * Botón de Impresión para Cotizaciones
 *
 * @author DEBY - Lead Debugger
 * @id FIX-20260129-08
 * @description Componente cliente que ejecuta window.print()
 * @fix FIX-20260129-QUOTES-ERR02 - Event handlers cannot be passed to Server Component props
 */
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  className?: string;
}

/**
 * Botón de impresión que encapsula el event handler en un Client Component
 * FIX REFERENCE: FIX-20260129-QUOTES-ERR02
 */
export function PrintButton({ className }: PrintButtonProps) {
  return (
    <Button
      onClick={() => window.print()}
      className={`gap-2 ${className ?? ""}`}
      variant="default"
    >
      <Printer className="h-4 w-4" />
      Imprimir
    </Button>
  );
}
