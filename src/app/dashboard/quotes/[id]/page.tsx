/**
 * Página de Visualización de Cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-04
 * @ref context/SPEC-QUOTATIONS.md
 * @description Renderiza la cotización generada con diseño imprimible
 * @modified 2026-01-29: Implementación inicial con Server Component, fetching y estilos de impresión
 */

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import { PrintButton } from "@/components/quote/print-button";
import { WhatsAppButton } from "@/components/quote/whatsapp-button";
import "./styles.css";

/**
 * Función auxiliar para formatear moneda COP
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Función auxiliar para formatear fechas
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Obtener el folio corto del UUID
 */
function getShortFolio(id: string): string {
  return id.substring(0, 8).toUpperCase();
}

/**
 * Interfaz para los datos de cotización con items
 */
interface QuotationWithItems {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  discount_type: string | null;
  discount_value: number;
  total_amount: number;
  created_at: string;
  status: string;
  quotation_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    inventory_id: string;
    inventory: {
      brand: string;
      model: string;
      medida_full: string;
      sku: string | null;
    };
  }>;
}

/**
 * Props de página con params como Promise (Next.js 15+)
 * @fix FIX-20260129-QUOTES-ERR01 - Breaking change Next.js 15
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationViewPage({ params }: PageProps) {
  // FIX REFERENCE: FIX-20260129-QUOTES-ERR01
  // Next.js 15: params es Promise, debe ser awaited
  const { id } = await params;

  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Obtener cotización con items (join a inventory)
  const { data: quotation, error } = await supabase
    .from("quotations")
    .select(
      `
      id,
      customer_name,
      customer_phone,
      discount_type,
      discount_value,
      total_amount,
      created_at,
      status,
      quotation_items (
        id,
        quantity,
        unit_price,
        inventory_id,
        inventory:inventory_id (
          brand,
          model,
          medida_full,
          sku
        )
      )
    `
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !quotation) {
    notFound();
  }

  const data = quotation as unknown as QuotationWithItems;

  // Calcular subtotal
  const subtotal = data.quotation_items.reduce((acc, item) => {
    return acc + item.unit_price * item.quantity;
  }, 0);

  // Calcular monto del descuento
  let discountAmount = 0;
  if (data.discount_type && data.discount_value) {
    if (data.discount_type === "percentage") {
      discountAmount = subtotal * (data.discount_value / 100);
    } else if (data.discount_type === "amount") {
      discountAmount = data.discount_value;
    }
  }

  return (
    <div className="quotation-container">
      {/* Botones de acción - Ocultos al imprimir */}
      <div className="print:hidden mb-6 flex gap-3 justify-between">
        <Link href="/dashboard/inventory">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Volver al Inventario
          </Button>
        </Link>
        <div className="flex gap-2">
          <WhatsAppButton
            customerName={data.customer_name}
            customerPhone={data.customer_phone || undefined}
            folio={getShortFolio(data.id)}
            totalAmount={data.total_amount}
            items={data.quotation_items.map((item) => {
              const inventory = item.inventory as any;
              return {
                quantity: item.quantity,
                description: `${inventory.brand} ${inventory.model} ${inventory.medida_full}`,
                subtotal: item.quantity * item.unit_price,
              };
            })}
          />
          <PrintButton />
        </div>
      </div>

      {/* Contenedor de la cotización - Imprimible */}
      <Card className="quotation-sheet">
        <CardHeader className="quotation-header">
          {/* Encabezado con nombre de empresa */}
          <div className="company-header">
            <h1 className="company-name">Roda Llantas</h1>
            <p className="company-subtitle">Especialistas en Llantas</p>
          </div>

          {/* Datos de la cotización */}
          <div className="quotation-info">
            <div className="info-row">
              <div className="info-item">
                <span className="label">Folio:</span>
                <span className="value">{getShortFolio(data.id)}</span>
              </div>
              <div className="info-item">
                <span className="label">Fecha:</span>
                <span className="value">{formatDate(data.created_at)}</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <span className="label">Cliente:</span>
                <span className="value">{data.customer_name}</span>
              </div>
              {data.customer_phone && (
                <div className="info-item">
                  <span className="label">Teléfono:</span>
                  <span className="value">{data.customer_phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="quotation-content">
          {/* Tabla de items */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-qty compact-header">CANT.</th>
                  <th className="col-desc compact-header">DESC.</th>
                  <th className="col-price compact-header">P. UNIT.</th>
                  <th className="col-total compact-header">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {data.quotation_items.map((item) => {
                  const itemTotal = item.quantity * item.unit_price;
                  const inventory = item.inventory as any;

                  return (
                    <tr key={item.id} className="item-row">
                      <td className="col-qty">{item.quantity}</td>
                      <td className="col-desc">
                        <div className="desc-content">
                          <div className="brand-model">
                            {inventory.brand} {inventory.model}
                          </div>
                          <div className="medida">{inventory.medida_full}</div>
                          {inventory.sku && (
                            <div className="sku">SKU: {inventory.sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="col-price">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="col-total">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales generales */}
          <div className="totals-section">
            <div className="total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="total-row discount-row">
                <span className="total-label">
                  Descuento (
                  {data.discount_type === "percentage"
                    ? `${data.discount_value}%`
                    : formatCurrency(data.discount_value)}
                  ):
                </span>
                <span className="total-value">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="total-row grand-total">
              <span className="total-label">Total:</span>
              <span className="total-value">{formatCurrency(data.total_amount)}</span>
            </div>
          </div>

          {/* Pie de página - Nota */}
          <div className="footer-note">
            <p>
              Esta cotización es válida por 7 días. Para efectuar la compra,
              contáctenos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
