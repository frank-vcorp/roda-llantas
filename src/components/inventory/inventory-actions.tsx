"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { deleteInventoryItem } from "@/app/dashboard/inventory/actions";

interface InventoryActionsProps {
  item: InventoryItem;
}

export function InventoryActions({ item }: InventoryActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que quieres borrar este ítem?")) {
      startTransition(async () => {
        try {
          await deleteInventoryItem(item.id);
          // Optional: Add toast success here
        } catch (error) {
          console.error("Error al borrar:", error);
          alert("Error al borrar el ítem");
        }
      });
    }
  };

  const handleEdit = () => {
     router.push(`/dashboard/inventory/${item.id}/edit`);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 cursor-pointer"
          disabled={isPending}
        >
          <Trash className="mr-2 h-4 w-4" />
          {isPending ? "Borrando..." : "Borrar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
