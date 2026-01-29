/**
 * Script de debug para listar marcas en inventario
 * FIX-20260129-11: Mejorado para diagnóstico de RLS
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Diagnóstico de keys
console.log("=== DIAGNÓSTICO DE CONEXIÓN ===");
console.log("URL:", supabaseUrl ? "✅ Configurada" : "❌ Falta");
console.log("SERVICE_ROLE_KEY:", serviceRoleKey ? "✅ Usando (bypass RLS)" : "❌ No encontrada");
console.log("ANON_KEY:", anonKey ? "✅ Disponible" : "❌ Falta");

if (!serviceRoleKey) {
  console.warn("\n⚠️  ADVERTENCIA: Sin SERVICE_ROLE_KEY, el script usará ANON_KEY.");
  console.warn("   Con RLS activo y sin sesión, probablemente verás 0 resultados.");
  console.warn("   Solución: Agregar SUPABASE_SERVICE_ROLE_KEY a .env.local\n");
}

const supabaseKey = serviceRoleKey || anonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listBrands() {
  console.log("Listing available brands...");
  
  const { data, error } = await supabase
    .from("inventory")
    .select("brand")
    .limit(100);

  if (error) {
    console.error("Error:", error);
    return;
  }

  const brands = [...new Set(data.map(item => item.brand))];
  console.log("Brands found:", brands);
}

listBrands();
