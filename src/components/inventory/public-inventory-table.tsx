"use client";

import { InventoryItem, PricingRule } from "@/lib/types";
import { DataTable } from "@/components/inventory/data-table";
import { columns } from "@/app/dashboard/inventory/columns";
import { enrichInventoryWithPrices } from "@/lib/services/pricing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PublicInventoryTableProps {
    items: InventoryItem[];
    suggestions: InventoryItem[];
    rules: PricingRule[];
}

export function PublicInventoryTable({ items, suggestions, rules }: PublicInventoryTableProps) {
    // Pre-calcular precios públicos
    const itemsWithPrices = enrichInventoryWithPrices(items, rules);

    const hasSuggestions = items.length === 0 && (suggestions?.length || 0) > 0;

    // Filter out actions column for public view
    const publicColumns = columns.filter((col) => col.id !== "actions");

    const displayData = hasSuggestions
        ? enrichInventoryWithPrices(suggestions || [], rules)
        : itemsWithPrices;

    return (
        <div className="space-y-4">
            {hasSuggestions && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">No encontramos resultados exactos</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Pero encontramos estas opciones disponibles en el mismo Rin.
                    </AlertDescription>
                </Alert>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <DataTable
                    columns={publicColumns}
                    data={displayData}
                    userRole={null}
                />
            </div>
        </div>
    );
}
