/**
 * Pantalla de Resumen de Cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-03 (Descuento + Edición de Precios)
 * @id IMPL-20260129-QUOTES-02 (Base)
 * @id IMPL-20260129-CRM-02 (CustomerCombobox integration)
 * @ref context/SPEC-QUOTATIONS.md
 * @ref context/SPEC-CRM-LITE.md
 * @modified 2026-01-29: Reemplazado input de cliente con CustomerCombobox
 * @modified 2026-01-29: Agregado descuentos (percentage/amount) y edición de unit_price por item
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuote } from "@/lib/contexts/quote-context";
import { createQuotation } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CustomerCombobox } from "@/components/customers/customer-combobox";
import { Customer } from "@/lib/types";

/**
 * Función auxiliar para calcular el precio público
 * Usa manual_price si existe, sino cost_price * 1.3 como fallback
 */
function getUnitPrice(item: any): number {
  if (item.manual_price && item.manual_price > 0) {
    return item.manual_price;
  }
  return item.cost_price * 1.3;
}

import { formatCurrency } from "@/lib/utils";

export default function QuoteSummaryPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalAmount, clearQuote } =
    useQuote();

  // Cliente seleccionado del combobox
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estado para descuentos
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number | string>("");
  const [showDiscount, setShowDiscount] = useState(false);

  // Estado para precios editables por item
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});

  // Evitar hydration mismatch
  useMemo(() => {
    setMounted(true);
    // Inicializar precios de los items
    const initialPrices: Record<string, number> = {};
    items.forEach((item) => {
      initialPrices[item.item.id] = getUnitPrice(item.item);
    });
    setItemPrices(initialPrices);
  }, [items]);

  if (!mounted) {
    return null;
  }

  // Si no hay items, mostrar mensaje
  if (items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-semibold text-muted-foreground mb-6">
              No hay items seleccionados
            </p>
            <Link href="/dashboard/inventory">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Inventario
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * Calcular subtotal y total con descuento
   */
  const subtotal = items.reduce((acc, quoteItem) => {
    const itemPrice = itemPrices[quoteItem.item.id] || getUnitPrice(quoteItem.item);
    return acc + itemPrice * quoteItem.quantity;
  }, 0);

  // Calcular descuento
  let discountAmount = 0;
  if (discountValue) {
    const numValue = typeof discountValue === "string" ? parseFloat(discountValue) : discountValue;
    if (discountType === "percentage") {
      discountAmount = subtotal * (numValue / 100);
    } else {
      discountAmount = numValue;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  /**
   * Manejar generación de cotización
   */
  const handleGenerateQuotation = async () => {
    // Validar campos obligatorios
    if (!customerName.trim()) {
      toast.error("Nombre del cliente es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createQuotation({
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        items: items.map((item) => ({
          id: item.item.id,
          quantity: item.quantity,
          unit_price: itemPrices[item.item.id] || getUnitPrice(item.item),
        })),
        discount_type: discountValue ? discountType : undefined,
        discount_value: discountValue
          ? typeof discountValue === "string"
            ? parseFloat(discountValue)
            : discountValue
          : undefined,
      });

      if (response.success && response.quotation_id) {
        toast.success("Cotización generada exitosamente");
        clearQuote();
        router.push(`/dashboard/quotes/${response.quotation_id}`);
      } else {
        toast.error(response.error || "Error al generar cotización");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error inesperado al generar cotización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" className="gap-2 -ml-4">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-4">Resumen de Cotización</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2">
          {/* Items Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Items Seleccionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">
                        Descripción
                      </th>
                      <th className="text-right py-2 font-semibold">Precio Unitario</th>
                      <th className="text-center py-2 font-semibold">
                        Cantidad
                      </th>
                      <th className="text-right py-2 font-semibold">
                        Subtotal
                      </th>
                      <th className="text-center py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((quoteItem) => {
                      const item = quoteItem.item;
                      const unitPrice = itemPrices[item.id] || getUnitPrice(item);
                      const lineSubtotal = unitPrice * quoteItem.quantity;

                      return (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-muted/50 transition"
                        >
                          <td className="py-3">
                            <div className="font-medium">{item.description || item.model}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.brand} • {item.medida_full}
                            </div>
                          </td>
                          <td className="text-right py-3">
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              value={itemPrices[item.id] || getUnitPrice(item)}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setItemPrices({
                                  ...itemPrices,
                                  [item.id]: newPrice,
                                });
                              }}
                              className="w-28 text-right h-8"
                              disabled={isLoading}
                            />
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center">
                              <Input
                                type="number"
                                min="1"
                                max="999"
                                value={quoteItem.quantity}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 1;
                                  updateQuantity(item.id, newQty);
                                }}
                                className="w-16 text-center h-8"
                                disabled={isLoading}
                              />
                            </div>
                          </td>
                          <td className="text-right py-3 font-semibold">
                            {formatCurrency(lineSubtotal)}
                          </td>
                          <td className="text-center py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Form */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer_name">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer_name"
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Teléfono (Opcional)</Label>
                <Input
                  id="customer_phone"
                  placeholder="Ej: 555-1234"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar - Right Side */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Section */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowDiscount(!showDiscount)}
                  className="w-full flex items-center justify-between hover:bg-muted/50 p-2 rounded transition"
                  disabled={isLoading}
                >
                  <span className="font-medium">Descuento</span>
                  {showDiscount ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showDiscount && (
                  <div className="mt-3 space-y-3 bg-muted/30 p-3 rounded">
                    <div className="flex gap-2">
                      <Select
                        value={discountType}
                        onValueChange={(value: any) => setDiscountType(value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                          <SelectItem value="amount">Monto ($)</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder={discountType === "percentage" ? "0" : "0"}
                        min="0"
                        step={discountType === "percentage" ? "1" : "1000"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1 h-10"
                        disabled={isLoading}
                      />
                    </div>

                    {discountAmount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Descuento: {formatCurrency(discountAmount)}
                      </div>
                    )}
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Item count */}
              <div className="text-sm text-muted-foreground">
                {items.length} producto{items.length !== 1 ? "s" : ""} •{" "}
                {items.reduce((sum, item) => sum + item.quantity, 0)} unidad
                {items.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? "es" : ""}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button
                  onClick={handleGenerateQuotation}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Generando..." : "Generar Cotización"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/inventory")}
                  disabled={isLoading}
                  className="w-full"
                >
                  Continuar Comprando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
