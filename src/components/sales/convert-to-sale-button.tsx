/**
 * IMPL-20260129-SALES-01: Botón para Confirmar Venta (Conversión de Cotización)
 * 
 * Funcionalidad:
 * - Mostrar botón "Confirmar Venta" si la cotización no está vendida
 * - Mostrar confirmación antes de proceder
 * - Manejar estado de loading
 * - Mostrar toast de éxito/error
 * 
 * @author SOFIA - Builder
 * @date 2026-01-29
 * @id IMPL-20260129-SALES-01
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { convertQuotationToSale } from '@/lib/actions/sales';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConvertToSaleButtonProps {
  quotationId: string;
  status?: string;
  onSuccess?: (saleId: string) => void;
}

export function ConvertToSaleButton({
  quotationId,
  status = 'draft',
  onSuccess,
}: ConvertToSaleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // No mostrar botón si ya está vendida
  if (status === 'sold') {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Venta confirmada</span>
      </div>
    );
  }

  const handleConfirmSale = async () => {
    setShowDialog(false);
    setIsLoading(true);

    try {
      const result = await convertQuotationToSale(quotationId);

      if (result.success && result.sale_id) {
        toast.success('Venta confirmada', {
          description: `Venta registrada exitosamente. ID: ${result.sale_id.substring(0, 8).toUpperCase()}`,
        });

        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess(result.sale_id);
        }

        // Recargar la página después de 1 segundo
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Error al confirmar venta', {
          description: result.error || 'Ocurrió un error inesperado',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error', {
        description: 'Error inesperado al procesar la venta',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isLoading ? 'Procesando...' : 'Confirmar Venta'}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción convertirá la cotización en una venta y descontará el inventario.
              Esta acción no se puede deshacer fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSale} className="bg-green-600 hover:bg-green-700">
              Confirmar Venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
