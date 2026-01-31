/**
 * Botón de WhatsApp para Compartir Cotización
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-06
 * @description Componente cliente que construye URL de WhatsApp y abre conversación
 * @ref context/SPEC-QUOTATIONS.md
 * @modified 2026-01-29: Implementación inicial con formateo de teléfono y mensaje
 */
"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WhatsAppButtonProps {
  customerName: string;
  customerPhone?: string;
  folio: string;
  totalAmount: number;
  items: Array<{
    quantity: number;
    description: string;
    subtotal: number;
  }>;
  className?: string;
}

/**
 * Limpia y normaliza número de teléfono
 * Elimina espacios, guiones, paréntesis
 * Si el número es local (sin +), asume Colombia (+57)
 */
export function normalizePhoneNumber(phone: string): string {
  // Eliminar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // Si no comienza con +, agregar +52 (México)
  if (!cleaned.startsWith("+")) {
    // Si comienza con 0, eliminarlo
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    cleaned = "52" + cleaned;
  } else {
    // Remover el + para la URL
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Construye el mensaje de WhatsApp formateado
 */
export function buildWhatsAppMessage(
  customerName: string,
  folio: string,
  items: Array<{
    quantity: number;
    description: string;
    subtotal: number;
  }>,
  totalAmount: number
): string {
  const lines: string[] = [
    `Hola ${customerName}, envío cotización *${folio}* de Roda Llantas.`,
    "",
  ];

  // Agregar items
  items.forEach((item) => {
    const formattedPrice = formatCurrency(item.subtotal);

    lines.push(`${item.quantity}x ${item.description} (${formattedPrice})`);
  });

  // Agregar total
  const formattedTotal = formatCurrency(totalAmount);

  lines.push("");
  lines.push(`*Total: ${formattedTotal}*`);

  return lines.join("\n");
}

/**
 * Botón de WhatsApp que abre una conversación con el mensaje pre-rellenado
 */
export function WhatsAppButton({
  customerName,
  customerPhone,
  folio,
  totalAmount,
  items,
  className,
}: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    // Si no hay teléfono, mostrar alerta
    if (!customerPhone) {
      alert("No hay número de teléfono disponible para esta cotización.");
      return;
    }

    // Normalizar teléfono
    const normalizedPhone = normalizePhoneNumber(customerPhone);

    // Construir mensaje
    const message = buildWhatsAppMessage(customerName, folio, items, totalAmount);

    // Construir URL de WhatsApp
    const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

    // Abrir en nueva pestaña
    window.open(waUrl, "_blank");
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className={`gap-2 ${className ?? ""}`}
      variant="outline"
    >
      <Share2 className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
