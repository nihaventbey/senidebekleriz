import { supabaseAdmin } from "@/lib/supabase/admin";

export async function eventSourceUrlExists(sourceUrl: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error) {
    console.error("eventSourceUrlExists error:", error.message);
    return true;
  }

  return Boolean(data);
}

export async function rejectedSourceUrlExists(
  sourceUrl: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .select("id")
    .eq("source_url", sourceUrl)
    .eq("status", "rejected")
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
