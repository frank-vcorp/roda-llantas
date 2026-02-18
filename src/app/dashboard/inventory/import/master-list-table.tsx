"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMasterInventory } from "@/app/dashboard/inventory/actions";
import { formatCurrency } from "@/lib/utils";

interface MasterItem {
    id: string;
    sku: string;
    description: string;
    brand: string;
    model: string;
    medida_full: string;
    cost_price: number;
    stock: number;
    stock_breakdown: { name: string; quantity: number }[];
}

export function MasterPriceList() {
    const [data, setData] = useState<MasterItem[]>([]);
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getMasterInventory();
            if (res.success && res.data) {
                setData(res.data);
                if (res.warehouses) {
                    setWarehouses(res.warehouses);
                }
            }
        } catch (error) {
            console.error("Error loading master list", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Fallback: If warehouses is empty but we have data, try to extract warehouse names from the stock breakdown
        if (warehouses.length === 0 && data.length > 0) {
            const uniqueWarehouses = new Set<string>();
            data.forEach(item => {
                item.stock_breakdown.forEach(s => {
                    uniqueWarehouses.add(s.name);
                });
            });

            if (uniqueWarehouses.size > 0) {
                const derivedWarehouses = Array.from(uniqueWarehouses).map((name, i) => ({
                    id: `derived-${i}`,
                    name: name
                }));
                // Sort to keep consistent order (e.g. Almacen 1 first)
                derivedWarehouses.sort((a, b) => a.name.localeCompare(b.name));
                setWarehouses(derivedWarehouses);
            }
        }
    }, [data, warehouses.length]);

    const filteredData = data.filter(item =>
        (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.medida_full || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.brand || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    📦 Catálogo Completo
                </h3>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar SKU, Medida, Marca..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-white"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchData} title="Refrescar">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="w-full overflow-hidden border rounded-md shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[120px]">SKU</TableHead>
                                <TableHead className="min-w-[200px]">Descripción</TableHead>
                                <TableHead className="w-[100px]">Medida</TableHead>
                                <TableHead className="text-right w-[120px]">Costo</TableHead>
                                <TableHead className="text-center w-[100px] font-bold text-slate-900 border-l border-r border-slate-200 bg-slate-200/50">Total</TableHead>
                                {warehouses.length > 0 ? warehouses.map(w => (
                                    <TableHead key={w.id} className="text-center min-w-[120px] whitespace-nowrap bg-slate-50">{w.name}</TableHead>
                                )) : (
                                    <TableHead className="text-center text-red-400">Sin Almacenes</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5 + (warehouses.length || 1)} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" /> Cargando lista maestra...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5 + (warehouses.length || 1)} className="h-24 text-center text-slate-500">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50">
                                        <TableCell className="font-mono text-xs text-slate-500">{item.sku || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">{item.description}</span>
                                                <span className="text-[10px] text-slate-400">{item.brand} • {item.model}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">{item.medida_full}</TableCell>
                                        <TableCell className="text-right font-mono font-medium text-amber-700 bg-yellow-50/30">
                                            {formatCurrency(item.cost_price)}
                                        </TableCell>
                                        <TableCell className="text-center font-bold border-l border-r border-slate-100 bg-slate-50">
                                            {item.stock}
                                        </TableCell>
                                        {warehouses.map(w => {
                                            const stock = item.stock_breakdown.find(sb => sb.name === w.name)?.quantity || 0;
                                            return (
                                                <TableCell key={w.id} className="text-center">
                                                    <span className={`font-mono ${stock > 0 ? "text-slate-900 font-bold" : "text-slate-300"}`}>
                                                        {stock > 0 ? stock : "-"}
                                                    </span>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="p-2 text-xs text-center text-slate-400 border-t bg-slate-50">
                    Mostrando {filteredData.length} productos
                </div>
            </div>
        </div>
    );
}
