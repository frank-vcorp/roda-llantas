/**
 * @file route.ts
 * @description API endpoint for inventory search
 * @id IMPL-20260129-PURCHASES-01
 * @reference context/SPEC-PURCHASES.md
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { products: [], error: "Query debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Search inventory with fuzzy matching
    const searchTerm = `%${query.toUpperCase()}%`;

    const { data, error } = await supabase
      .from("inventory")
      .select("id, brand, model, medida_full, stock, cost_price")
      .eq("profile_id", user.id)
      .or(
        `brand.ilike.${searchTerm},model.ilike.${searchTerm},medida_full.ilike.${searchTerm}`
      )
      .limit(20);

    if (error) {
      console.error("[inventory/search] Supabase error:", error);
      return NextResponse.json(
        { error: "Error al buscar productos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error("[inventory/search] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
