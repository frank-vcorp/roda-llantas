/**
 * @file new/page.tsx
 * @description Página para registrar nueva compra (entrada de stock)
 * @id IMPL-20260129-PURCHASES-01
 * @reference context/SPEC-PURCHASES.md
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { createPurchase, PurchaseItem } from "@/lib/actions/purchases";
import { ProductCombobox, InventoryProduct } from "@/components/inventory/product-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface PurchaseFormItem extends PurchaseItem {
  id: string; // Temporal ID para UI
  product?: InventoryProduct;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos generales
  const [providerName, setProviderName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Items
  const [items, setItems] = useState<PurchaseFormItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [selectedUnitCost, setSelectedUnitCost] = useState("");

  /**
   * Agregar item a la compra
   */
  const handleAddItem = () => {
    if (!selectedProduct || !selectedQuantity || !selectedUnitCost) {
      setError("Completa todos los campos del producto");
      return;
    }

    const qty = parseInt(selectedQuantity, 10);
    const cost = parseFloat(selectedUnitCost);

    if (qty <= 0 || cost <= 0) {
      setError("Cantidad y costo deben ser mayores a 0");
      return;
    }

    const newItem: PurchaseFormItem = {
      id: `item-${Date.now()}`,
      productId: selectedProduct.id,
      quantity: qty,
      unitCost: cost,
      product: selectedProduct,
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setSelectedQuantity("");
    setSelectedUnitCost("");
    setError(null);
  };

  /**
   * Eliminar item
   */
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  /**
   * Calcular total
   */
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  };

  /**
   * Guardar compra
   */
  const handleSavePurchase = async () => {
    // Validaciones
    if (!providerName.trim()) {
      setError("Nombre del proveedor requerido");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Número de factura requerido");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createPurchase({
        providerName: providerName.trim(),
        invoiceNumber: invoiceNumber.trim(),
        purchaseDate,
        totalAmount: calculateTotal(),
        items: items.map(({ productId, quantity, unitCost }) => ({
          productId,
          quantity,
          unitCost,
        })),
      });

      if (result.success) {
        toast.success(result.message || "Compra registrada exitosamente");
        router.push("/dashboard/inventory");
      } else {
        setError(result.error || "Error al registrar compra");
        toast.error(result.error || "Error al registrar compra");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Inventario
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Compra</h1>
          <p className="text-gray-600 mt-2">
            Registra entrada de mercancía desde proveedores
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  Datos de la compra y proveedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Proveedor */}
                <div className="space-y-2">
                  <Label htmlFor="provider">Nombre del Proveedor *</Label>
                  <Input
                    id="provider"
                    placeholder="Ej: Michelin - Distribuidor Centro"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Factura */}
                <div className="space-y-2">
                  <Label htmlFor="invoice">Número de Factura *</Label>
                  <Input
                    id="invoice"
                    placeholder="Ej: INV-2026-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Fecha */}
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha de Compra *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agregar Items */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Agregar Productos</CardTitle>
                <CardDescription>
                  Busca y agrega los productos de esta compra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda de Producto */}
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <ProductCombobox
                    value={selectedProduct}
                    onSelectProduct={setSelectedProduct}
                    placeholder="Buscar por marca, modelo o medida..."
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cantidad */}
                  <div className="space-y-2">
                    <Label htmlFor="qty">Cantidad *</Label>
                    <Input
                      id="qty"
                      type="number"
                      placeholder="0"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Costo Unitario */}
                  <div className="space-y-2">
                    <Label htmlFor="cost">Costo Unitario ($) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={selectedUnitCost}
                      onChange={(e) => setSelectedUnitCost(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Botón agregar */}
                <Button
                  onClick={handleAddItem}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>

            {/* Tabla de Items */}
            {items.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Productos en la Compra</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Costo Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {item.product?.brand} {item.product?.model}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.product?.medida_full}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              ${item.unitCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(item.quantity * item.unitCost).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen Lateral */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items count */}
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Cantidad de Productos:</span>
                  <span className="font-semibold">{items.length}</span>
                </div>

                {/* Total items */}
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Unidades Total:</span>
                  <span className="font-semibold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold">Monto Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Botón Guardar */}
                <Button
                  onClick={handleSavePurchase}
                  disabled={isLoading || items.length === 0}
                  className="w-full mt-6 h-10"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Compra"
                  )}
                </Button>

                {/* Botón Cancelar */}
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
