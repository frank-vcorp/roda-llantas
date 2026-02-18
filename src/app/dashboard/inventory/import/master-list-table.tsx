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
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getMasterInventory();
            if (res.success && res.data) {
                setData(res.data);
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

    const filteredData = data.filter(item =>
        (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.medida_full || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.brand || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card className="mt-8 border-slate-300 shadow-md">
            <CardHeader className="bg-slate-100 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                        📦 Catálogo Completo
                    </CardTitle>
                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative w-full md:w-72">
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
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[100px]">SKU</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[100px]">Medida</TableHead>
                                <TableHead className="text-right w-[120px] bg-yellow-50/50">Costo (Mane)</TableHead>
                                <TableHead className="text-center w-[100px]">Total</TableHead>
                                <TableHead className="w-[200px]">Desglose Almacenes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" /> Cargando lista maestra...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
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
                                        <TableCell className="text-center">
                                            <Badge variant={item.stock > 0 ? "default" : "secondary"} className={item.stock > 0 ? "bg-slate-700" : ""}>
                                                {item.stock}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-[10px]">
                                                {item.stock_breakdown.map((w, i) => (
                                                    w.quantity > 0 && (
                                                        <div key={i} className="flex justify-between border-b border-dotted border-slate-200 pb-0.5 last:border-0">
                                                            <span className="text-slate-500 truncate max-w-[120px]">{w.name}</span>
                                                            <span className="font-mono font-bold text-slate-700">{w.quantity}</span>
                                                        </div>
                                                    )
                                                ))}
                                                {item.stock === 0 && <span className="text-slate-300">-</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="p-2 text-xs text-center text-slate-400 border-t bg-slate-50">
                    Mostrando {filteredData.length} productos
                </div>
            </CardContent>
        </Card>
    );
}
