/**
 * API Route de diagnóstico temporal
 * FIX REFERENCE: FIX-20260129-SEARCH-ERR02
 * 
 * Verificar estado de search_text y búsqueda fuzzy
 * ELIMINAR DESPUÉS DE DIAGNÓSTICO
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'michilin';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    query,
    tests: {},
  };

  // 1. Verificar sesión actual
  const { data: { user } } = await supabase.auth.getUser();
  diagnostics.authenticated = !!user;
  diagnostics.userId = user?.id || null;

  // 2. Obtener muestra de inventory con search_text
  const { data: sampleItems, error: sampleError } = await supabase
    .from('inventory')
    .select('id, brand, model, medida_full, search_text')
    .limit(5);
  
  if (sampleError) {
    diagnostics.tests.sample = { error: sampleError.message };
  } else {
    diagnostics.tests.sample = {
      count: sampleItems?.length || 0,
      items: sampleItems?.map(item => ({
        brand: item.brand,
        model: item.model,
        search_text: item.search_text || '(VACÍO)',
        search_text_length: item.search_text?.length || 0,
      })),
    };
  }

  // 3. Buscar Michelin específicamente
  const { data: michelinItems, error: michelinError } = await supabase
    .from('inventory')
    .select('id, brand, model, search_text')
    .ilike('brand', '%michelin%')
    .limit(3);
  
  if (michelinError) {
    diagnostics.tests.michelin = { error: michelinError.message };
  } else {
    diagnostics.tests.michelin = {
      count: michelinItems?.length || 0,
      items: michelinItems?.map(item => ({
        brand: item.brand,
        search_text: item.search_text || '(VACÍO)',
      })),
    };
  }

  // 4. Probar RPC search_inventory con el query
  const { data: searchResults, error: searchError } = await supabase
    .rpc('search_inventory', {
      p_query: query,
      p_limit: 10,
      p_offset: 0,
    });
  
  if (searchError) {
    diagnostics.tests.search_rpc = { error: searchError.message };
  } else {
    diagnostics.tests.search_rpc = {
      query,
      results_count: searchResults?.length || 0,
      items: searchResults?.slice(0, 3).map((item: { brand: string; model: string; search_text: string }) => ({
        brand: item.brand,
        model: item.model,
        search_text: item.search_text,
      })),
    };
  }

  // 5. Probar búsqueda exacta con ILIKE
  const { data: ilikeResults, error: ilikeError } = await supabase
    .from('inventory')
    .select('id, brand, model, search_text')
    .ilike('search_text', `%${query}%`)
    .limit(5);
  
  if (ilikeError) {
    diagnostics.tests.ilike_search = { error: ilikeError.message };
  } else {
    diagnostics.tests.ilike_search = {
      query: `%${query}%`,
      results_count: ilikeResults?.length || 0,
    };
  }

  // 6. Contar registros con search_text vacío
  const { count: emptyCount } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .or('search_text.is.null,search_text.eq.');
  
  const { count: totalCount } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true });
  
  diagnostics.tests.search_text_status = {
    total_records: totalCount || 0,
    empty_search_text: emptyCount || 0,
    populated_search_text: (totalCount || 0) - (emptyCount || 0),
    percentage_populated: totalCount ? (((totalCount - (emptyCount || 0)) / totalCount) * 100).toFixed(1) + '%' : 'N/A',
  };

  // Diagnóstico final
  if ((emptyCount || 0) > 0 && emptyCount === totalCount) {
    diagnostics.diagnosis = 'TODOS los registros tienen search_text VACÍO - El backfill NO corrió';
    diagnostics.solution = 'Ejecutar UPDATE inventory SET search_text = ...';
  } else if ((emptyCount || 0) > 0) {
    diagnostics.diagnosis = 'ALGUNOS registros tienen search_text vacío';
    diagnostics.solution = 'Ejecutar UPDATE para llenar los faltantes';
  } else if (totalCount === 0) {
    diagnostics.diagnosis = 'No hay registros en inventory para este usuario';
    diagnostics.solution = 'Verificar autenticación y datos';
  } else {
    diagnostics.diagnosis = 'search_text está poblado - El problema es el threshold de similitud';
    diagnostics.solution = 'Ajustar pg_trgm.similarity_threshold en la RPC';
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
