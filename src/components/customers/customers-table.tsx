/**
 * Componente CustomersTable
 *
 * Tabla de clientes con acciones (Editar)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-03
 * @ref context/SPEC-CRM-LITE.md
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { Customer } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>RFC/NIT</TableHead>
            <TableHead>Fecha de Registro</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.full_name}</TableCell>
              <TableCell>{customer.phone || "-"}</TableCell>
              <TableCell>{customer.email || "-"}</TableCell>
              <TableCell>{customer.tax_id || "-"}</TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(customer.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <EditCustomerDialog customer={customer} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
