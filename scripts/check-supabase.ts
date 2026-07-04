import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Supabase veri kontrolü...\n");

  const tables = ["cities", "categories", "places", "pages", "ad_placements"];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("count", { count: "exact" }).single();
    if (error) {
      console.log(`❌ ${table}:`, error.message);
    } else {
      console.log(`✅ ${table}:`, data.count, "kayıt");
    }
  }
}

main();
