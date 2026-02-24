import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use anon key for reading but we cannot apply DDL with it.
// Instead, let's test if anon key can read from product_stock and warehouses.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPublicAccess() {
    console.log('Testing anonymous access to product_stock...');
    const { data: stockData, error: stockError } = await supabase
        .from('product_stock')
        .select('product_id, quantity, warehouses(name, code)')
        .limit(3);

    if (stockError) {
        console.error('❌ BLOCKED - product_stock error:', stockError.message);
        console.log('→ Need to add public SELECT RLS policy to product_stock');
    } else {
        console.log('✅ OK - product_stock accessible:', stockData?.length, 'rows');
        if (stockData && stockData.length > 0) {
            console.log('Sample:', JSON.stringify(stockData[0], null, 2));
        }
    }

    console.log('\nTesting anonymous access to warehouses...');
    const { data: whData, error: whError } = await supabase
        .from('warehouses')
        .select('name, code')
        .limit(3);

    if (whError) {
        console.error('❌ BLOCKED - warehouses error:', whError.message);
        console.log('→ Need to add public SELECT RLS policy to warehouses');
    } else {
        console.log('✅ OK - warehouses accessible:', whData?.length, 'rows');
        if (whData && whData.length > 0) {
            console.log('Sample:', JSON.stringify(whData[0], null, 2));
        }
    }
}

testPublicAccess().catch(console.error);
