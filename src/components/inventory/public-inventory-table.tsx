"use client";

import { InventoryItem, PricingRule } from "@/lib/types";
import { DataTable } from "@/components/inventory/data-table";
import { columns } from "@/app/dashboard/inventory/columns";
import { enrichInventoryWithPrices } from "@/lib/logic/pricing-engine";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PublicInventoryTableProps {
    displayData: any[];
    hasSuggestions: boolean;
}

export function PublicInventoryTable({ displayData, hasSuggestions }: PublicInventoryTableProps) {
    // Filter out actions column for public view
    const publicColumns = columns.filter((col) => col.id !== "actions");

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
