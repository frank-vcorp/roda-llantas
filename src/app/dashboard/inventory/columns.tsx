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
const StockBadge = ({ row }: { row: any }) => {
  const stock = row.getValue("stock");
  const item = row.original as InventoryItem;
  const warehouses = item.warehouses || [];

  const badge = (
    stock === 0 ? <Badge variant="destructive">{stock}</Badge> :
      stock > 4 ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">{stock}</Badge> :
        <Badge variant="secondary">{stock}</Badge>
  );

  if (warehouses.length === 0) return badge;

  return (
    <div className="flex flex-nowrap gap-1.5 items-center whitespace-nowrap">
      {badge}
      {warehouses.map((w, i) => (
        <Badge key={i} variant="outline" className="text-[10px] px-1.5 h-5 bg-white font-mono text-slate-600 border-slate-200 shrink-0">
          {w.code || w.name.substring(0, 2)}: {w.quantity}
        </Badge>
      ))}
    </div>
  );
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
      const isTruncated = displayText.length > 35;
      const truncatedText = isTruncated ? displayText.substring(0, 35) + "..." : displayText;

      return (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-sm cursor-help underline decoration-dashed decoration-slate-300 underline-offset-4">
                  {truncatedText}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white p-3 max-w-sm">
                <div className="text-xs space-y-2">
                  <p className="font-bold border-b pb-1 mb-1">{displayText}</p>
                  <p><strong>Marca:</strong> {item.brand}</p>
                  <p><strong>Modelo:</strong> {item.model}</p>
                  <p><strong>Medida:</strong> {item.medida_full}</p>
                  <p><strong>Rin:</strong> {item.rim}"</p>
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
    cell: ({ row }) => <StockBadge row={row} />,
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


      const userRole = (row.getAllCells()[0].getContext().table.options.meta as any)?.userRole;
      const isAdmin = userRole === 'admin';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                {priceData.is_manual && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-xs shrink-0">
                    OFERTA
                  </Badge>
                )}
                <span className={`font-semibold whitespace-nowrap ${priceData.is_manual
                  ? "text-amber-600"
                  : "text-green-600"
                  }`}>
                  {formatCurrency(priceData.public_price)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white p-3 max-w-xs">
              <div className="text-xs space-y-1">
                {isAdmin && (
                  <>
                    <p className="font-bold border-b pb-1 mb-1">Detalle (Privado)</p>
                    <p>
                      <strong className="text-slate-400">Costo:</strong> {formatCurrency(row.original.cost_price)}
                    </p>
                  </>
                )}

                <p>
                  <strong>Método:</strong> {priceData.is_manual ? "Manual (Oferta)" : "Automático"}
                </p>

                {isAdmin && priceData.margin_percentage !== undefined && (
                  <p>
                    <strong className="text-emerald-400">Margen:</strong> +{priceData.margin_percentage}%
                  </p>
                )}

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
    id: "special_prices",
    header: "Precios Especiales",
    cell: ({ row }) => {
      const item = row.original as any;
      const tiers = item._publicPrice?.volume_tiers || [];

      if (tiers.length === 0) {
        return <span className="text-gray-400 text-xs">-</span>;
      }

      return (
        <div className="flex flex-col gap-1">
          {tiers.map((tier: any, i: number) => {
            let label = i === 0 ? `Promoción` : `Especial`;
            return (
              <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                <span className="text-slate-500 font-medium">{label} (x{tier.min_qty}):</span>
                <span className="font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(tier.price)}</span>
              </div>
            );
          })}
        </div>
      );
    }
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <InventoryActions item={row.original} />,
  },
];
