
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking inventory search_text...");
  
  // Get 5 random items
  const { data, error } = await supabase
    .from("inventory")
    .select("brand, model, search_text")
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Samples:");
  data.forEach((item) => {
    console.log(`[${item.brand}] search_text: "${item.search_text}"`);
  });

  // Test RPC call explicitly
  console.log("\nTesting RPC search_inventory with 'michilin'...");
  const { data: searchResults, error: searchError } = await supabase
    .rpc("search_inventory", { 
        p_query: "michilin",
        p_limit: 5, 
        p_offset: 0 
    });

  if (searchError) console.error("RPC Error:", searchError);
  else console.log(`RPC Results count: ${searchResults.length}`);
}

checkData();
