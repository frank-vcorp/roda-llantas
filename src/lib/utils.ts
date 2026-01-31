import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha ISO a formato legible (DD/MM/YYYY)
 * @param dateString Fecha en formato ISO
 * @returns Fecha formateada
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Formatea moneda a MXN garantizando:
 * - Símbolo $
 * - Coma para miles
 * - Punto para decimales
 * - 2 decimales fijos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
