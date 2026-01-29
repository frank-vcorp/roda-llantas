/**
 * Botón para Eliminar Cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-05
 * @ref context/SPEC-QUOTATIONS.md
 *
 * Componente cliente que:
 * - Muestra un botón "Eliminar"
 * - Confirma la acción antes de proceder
 * - Llama a deleteQuotation() server action
 * - Maneja estado de carga
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteQuotation } from "@/app/dashboard/quotes/actions";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteQuotationButtonProps {
  quotationId: string;
}

export function DeleteQuotationButton({
  quotationId,
}: DeleteQuotationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteQuotation(quotationId);
      if (result.success) {
        setIsOpen(false);
        router.refresh(); // Refrescar la página para actualizar la tabla
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting quotation:", error);
      alert("Error al eliminar la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-destructive hover:text-destructive"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        title="Eliminar cotización"
      >
        <Trash2 className="h-4 w-4" />
        {isLoading ? "..." : "Eliminar"}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cotización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta cotización? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
