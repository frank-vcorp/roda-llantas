/**
 * @file purchases.ts
 * @description Server actions for purchase registration
 * @id IMPL-20260129-PURCHASES-01
 * @reference context/SPEC-PURCHASES.md
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  providerName: string;
  invoiceNumber: string;
  purchaseDate: string; // ISO date string
  totalAmount: number;
  items: PurchaseItem[];
}

export async function createPurchase(input: CreatePurchaseInput) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    // Validate input
    if (!input.providerName || !input.invoiceNumber || !input.items.length) {
      return {
        success: false,
        error: "Datos incompletos",
      };
    }

    // Validate items
    for (const item of input.items) {
      if (!item.productId || item.quantity <= 0 || item.unitCost <= 0) {
        return {
          success: false,
          error: "Items inválidos",
        };
      }
    }

    // Call RPC function
    const { data, error } = await supabase.rpc("register_purchase", {
      p_profile_id: user.id,
      p_provider_name: input.providerName,
      p_invoice_number: input.invoiceNumber,
      p_purchase_date: input.purchaseDate,
      p_total_amount: input.totalAmount,
      p_items: JSON.stringify(input.items),
    });

    if (error) {
      console.error("[purchases.ts] RPC error:", error);
      return {
        success: false,
        error: error.message || "Error al registrar compra",
      };
    }

    if (!data || !data[0]?.success) {
      return {
        success: false,
        error: "Error al registrar compra",
      };
    }

    const purchaseId = data[0].purchase_id;

    return {
      success: true,
      purchaseId,
      message: "Compra registrada exitosamente",
    };
  } catch (err) {
    console.error("[purchases.ts] Error:", err);
    return {
      success: false,
      error: "Error del servidor",
    };
  }
}
