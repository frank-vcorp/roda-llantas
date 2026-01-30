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
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
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
import Link from 'next/link';

interface ConvertToSaleButtonProps {
  quotationId: string;
  status?: string;
  validUntil?: string; // Fecha de vencimiento
  onSuccess?: (saleId: string) => void;
}

export function ConvertToSaleButton({
  quotationId,
  status = 'draft',
  validUntil,
  onSuccess,
}: ConvertToSaleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Verificar si está vencida
  const isExpired = validUntil ? new Date(validUntil) < new Date() : false;

  // No mostrar botón si ya está vendida
  if (status === 'sold') {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Venta confirmada</span>
      </div>
    );
  }

  // Si está vencida y en borrador
  if (isExpired && status === 'draft') {
    return (
      <div className="flex items-center gap-2">
         <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
           <AlertTriangle className="h-4 w-4" />
           <span className="text-sm font-medium">Cotización Vencida</span>
         </div>
         <Link href={`/dashboard/quotes/new?clone=${quotationId}`}>
           <Button variant="outline" size="sm" className="gap-2">
             <RefreshCw className="h-4 w-4" />
             Recotizar
           </Button>
         </Link>
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
