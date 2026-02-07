/**
 * Definición de columnas para DataTable de Inventario
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT3, IMPL-20260129-PRICING-01
 * @id IMPL-20260129-QUOTES-01 - Agregado columna de checkbox
 * @ref context/SPEC-DATA-MODEL.md, context/SPEC-UX-UI.md, context/SPEC-PRICING-ENGINE.md, context/SPEC-QUOTATIONS.md
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { useQuote } from "@/lib/contexts/quote-context";

import { formatCurrency } from "@/lib/utils";

import { ArrowUpDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InventoryActions } from "@/components/inventory/inventory-actions";

/**
 * Badge de stock con color condicional
 * - Rojo si stock = 0
 * - Verde si stock > 4
 * - Amarillo si stock 1-4
 */
const StockBadge = ({ stock }: { stock: number }) => {
  if (stock === 0) {
    return <Badge variant="destructive">{stock} unidades</Badge>;
  } else if (stock > 4) {
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{stock} unidades</Badge>;
  } else {
    return <Badge variant="secondary">{stock} unidades</Badge>;
  }
};

/**
 * Columna de selección (checkbox) para agregar a cotización
 */
const SelectionCell = ({ row }: { row: any }) => {
  const { items, addItem, removeItem } = useQuote();
  const isSelected = items.some((qi) => qi.item.id === row.original.id);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      addItem(row.original, 1);
    } else {
      removeItem(row.original.id);
    }
  };

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={handleToggle}
      aria-label="Seleccionar para cotizar"
    />
  );
};

/**
 * Columnas de la tabla de inventario
 */
export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "select",
    header: "Sel.",
    cell: (info) => <SelectionCell row={info.row} />,
    size: 50,
  },
  {
    accessorKey: "sku",
    header: "Clave",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-500">
        {row.getValue("sku") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Descripción (Original)",
    cell: ({ row }) => {
      const item = row.original;
      // Si no existe description (DB vieja), construir una
      const displayText = item.description || `${item.brand} ${item.model} ${item.medida_full}`;

      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{displayText}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white p-3 max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-bold border-b pb-1 mb-1">Datos Estructurados</p>
                  <p><strong>Marca:</strong> {item.brand}</p>
                  <p><strong>Modelo:</strong> {item.model}</p>
                  <p><strong>Medida:</strong> {item.medida_full}</p>
                  <p><strong>Rin:</strong> {item.rim}"</p>

                  {(item as any)._publicPrice?.volume_tiers?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700">
                      <p className="font-bold text-emerald-400 mb-1">Precios por Volumen</p>
                      <div className="space-y-1">
                        {(item as any)._publicPrice.volume_tiers.map((tier: any, i: number) => (
                          <div key={i} className="flex justify-between text-[11px]">
                            <span>x{tier.min_qty} piezas:</span>
                            <span className="font-mono text-emerald-300">{formatCurrency(tier.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => <StockBadge stock={row.getValue("stock")} />,
  },
  /*
  {
    accessorKey: "cost_price",
    header: "Precio Costo",
    cell: ({ row }) => (
      <span className="font-medium text-blue-600">
        {formatCurrency(row.getValue("cost_price"))}
      </span>
    ),
  },
  */
  {
    id: "public_price",
    header: "Precio Público",
    cell: ({ row }) => {
      const item = row.original as any;
      const priceData = item._publicPrice;

      if (!priceData) {
        return <span className="text-gray-400">-</span>;
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                {priceData.is_manual && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
                    OFERTA
                  </Badge>
                )}
                <span className={`font-semibold ${priceData.is_manual
                  ? "text-amber-600"
                  : "text-green-600"
                  }`}>
                  {formatCurrency(priceData.public_price)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white p-3 max-w-xs">
              <div className="text-xs space-y-1">
                <p className="font-bold border-b pb-1 mb-1">Detalle</p>
                {/* 
                <p>
                  <strong>Costo:</strong> {formatCurrency(row.original.cost_price)}
                </p>
                 */}
                <p>
                  <strong>Método:</strong> {priceData.is_manual ? "Manual (Oferta)" : "Automático"}
                </p>
                {/*
                {priceData.margin_percentage !== undefined && (
                  <p>
                    <strong>Margen:</strong> +{priceData.margin_percentage}%
                  </p>
                )}
                */}
                <p>
                  <strong>Regla:</strong> {priceData.rule_applied || "-"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <InventoryActions item={row.original} />,
  },
];
