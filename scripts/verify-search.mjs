
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySearch() {
    console.log('--- TEST 1: "175/70/R13" (Caso del Usuario) ---');
    // Simulamos la query del usuario. El search debe encontrar "175 70 13" en descripción con alta prioridad.
    // Nota: p_query se pasa tal cual, la función hace el lower().
    const q1 = "175/70/R13";
    const { data: res1, error: err1 } = await supabase.rpc('search_inventory', {
        p_query: q1,
        p_limit: 5
    });

    if (err1) console.error(err1);
    else {
        console.log(`Resultados para "${q1}":`);
        res1.forEach((item, i) => {
            console.log(`  ${i + 1}. [${item.sku}] ${item.description} (Rin: ${item.rim})`);
        });
    }

    console.log('\n--- TEST 2: "HIFLY" (Búsqueda por Marca/Texto) ---');
    const q2 = "HIFLY";
    const { data: res2, error: err2 } = await supabase.rpc('search_inventory', {
        p_query: q2,
        p_limit: 3
    });

    if (err2) console.error(err2);
    else {
        console.log(`Resultados para "${q2}":`);
        res2.forEach((item, i) => {
            console.log(`  ${i + 1}. [${item.sku}] ${item.description}`);
        });
    }
}

verifySearch();
