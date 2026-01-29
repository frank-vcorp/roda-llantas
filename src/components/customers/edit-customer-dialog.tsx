"use client";

import { useState } from "react";
import { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/customer-form";
import { Pencil } from "lucide-react";

/**
 * EditCustomerDialog
 *
 * Dialog para editar un cliente. Se abre cuando el usuario
 * hace clic en el botón de editar en la tabla.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03
 * @ref context/SPEC-CRM-LITE.md
 */

interface EditCustomerDialogProps {
  customer: Customer;
}

export function EditCustomerDialog({ customer }: EditCustomerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Editar
      </Button>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Actualiza la información del cliente: {customer.full_name}
          </DialogDescription>
        </DialogHeader>

        <CustomerForm customer={customer} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
