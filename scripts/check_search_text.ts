/**
 * Script de diagnóstico: check_search_text.ts
 * FIX REFERENCE: FIX-20260129-SEARCH-ERR02
 * 
 * Verifica si la columna search_text está poblada en inventory
 * y prueba el score de similitud con pg_trgm
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('=== DIAGNÓSTICO FIX-20260129-SEARCH-ERR02 ===\n')
  
  // 1. Verificar si search_text está poblado
  console.log('1. Verificando columna search_text en inventory...')
  const { data: sampleItems, error: sampleError } = await supabase
    .from('inventory')
    .select('id, brand, model, medida_full, sku, search_text')
    .limit(10)
  
  if (sampleError) {
    console.error('Error al consultar inventory:', sampleError.message)
    return
  }
  
  if (!sampleItems || sampleItems.length === 0) {
    console.log('❌ No hay registros en inventory')
    return
  }
  
  console.log(`   Encontrados ${sampleItems.length} registros de muestra:\n`)
  
  let emptyCount = 0
  let populatedCount = 0
  
  for (const item of sampleItems) {
    const hasSearchText = item.search_text && item.search_text.trim() !== ''
    if (hasSearchText) {
      populatedCount++
    } else {
      emptyCount++
    }
    console.log(`   - ${item.brand} ${item.model}: search_text = "${item.search_text || '(VACÍO)'}"`)
  }
  
  console.log(`\n   Resumen: ${populatedCount} poblados, ${emptyCount} vacíos\n`)
  
  // 2. Buscar específicamente Michelin
  console.log('2. Buscando registros Michelin...')
  const { data: michelinItems, error: michelinError } = await supabase
    .from('inventory')
    .select('id, brand, model, search_text')
    .ilike('brand', '%michelin%')
    .limit(5)
  
  if (michelinError) {
    console.error('Error buscando Michelin:', michelinError.message)
  } else if (!michelinItems || michelinItems.length === 0) {
    console.log('   ⚠️ No hay registros con brand LIKE %michelin%')
  } else {
    console.log(`   Encontrados ${michelinItems.length} registros Michelin:`)
    for (const item of michelinItems) {
      console.log(`   - Brand: "${item.brand}", search_text: "${item.search_text || '(VACÍO)'}"`)
    }
  }
  
  // 3. Probar la RPC search_inventory
  console.log('\n3. Probando RPC search_inventory con "michilin"...')
  const { data: searchResults, error: searchError } = await supabase
    .rpc('search_inventory', {
      p_query: 'michilin',
      p_limit: 10,
      p_offset: 0
    })
  
  if (searchError) {
    console.error('Error en RPC search_inventory:', searchError.message)
    console.log('   (Esto puede ser normal si no hay usuario autenticado)')
  } else {
    console.log(`   Resultados: ${searchResults?.length || 0}`)
    if (searchResults && searchResults.length > 0) {
      for (const item of searchResults.slice(0, 3)) {
        console.log(`   - ${item.brand} ${item.model}`)
      }
    }
  }
  
  // 4. Contar registros con search_text vacío
  console.log('\n4. Contando registros con search_text vacío o null...')
  const { count: emptySearchTextCount, error: countError } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .or('search_text.is.null,search_text.eq.')
  
  if (countError) {
    console.error('Error contando:', countError.message)
  } else {
    console.log(`   Registros con search_text vacío/null: ${emptySearchTextCount || 0}`)
  }
  
  // 5. Contar total
  const { count: totalCount } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   Total de registros en inventory: ${totalCount || 0}`)
  
  // Diagnóstico final
  console.log('\n=== DIAGNÓSTICO FINAL ===')
  if (emptySearchTextCount && emptySearchTextCount > 0) {
    console.log('⚠️ HAY REGISTROS CON search_text VACÍO')
    console.log('   SOLUCIÓN: Ejecutar UPDATE para llenar search_text')
  } else if (populatedCount > 0 && emptyCount === 0) {
    console.log('✅ search_text está poblado correctamente')
    console.log('   PROBLEMA PROBABLE: El threshold de similitud es muy estricto')
    console.log('   SOLUCIÓN: Ajustar pg_trgm.similarity_threshold en la RPC')
  }
}

main().catch(console.error)
