import { supabaseAdmin } from "@/lib/supabase/admin";

export async function discoverySourceUrlExists(sourceUrl: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("discovered_content")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error) {
    console.error("discoverySourceUrlExists error:", error.message);
    return true;
  }

  return Boolean(data);
}

export async function rejectedDiscoveryUrlExists(
  sourceUrl: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("discovered_content")
    .select("id")
    .eq("source_url", sourceUrl)
    .eq("status", "rejected")
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
