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

/**
 * Checks if a news agency / syndicate duplicate with a very similar title already exists
 * in pending_review or imported state, to prevent wire stories (AA, DHA, İHA) from cluttering the queue.
 */
export async function isTitleAlreadyDiscovered(title: string): Promise<boolean> {
  if (!title || title.length < 15) return false;
  // Normalize Turkish characters and punctuation
  const clean = title
    .toLocaleLowerCase("tr")
    .replace(/['"“”‘’!?:;,.()-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Search exact or prefix similarity
  const prefix = clean.slice(0, 40);
  const { data } = await supabaseAdmin
    .from("discovered_content")
    .select("title")
    .ilike("title", `%${prefix.slice(0, 25)}%`)
    .limit(5);

  if (!data || data.length === 0) return false;

  for (const row of data) {
    const existingClean = row.title
      .toLocaleLowerCase("tr")
      .replace(/['"“”‘’!?:;,.()-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // If more than 75% character match / prefix match
    if (
      existingClean === clean ||
      existingClean.startsWith(clean.slice(0, 35)) ||
      clean.startsWith(existingClean.slice(0, 35))
    ) {
      return true;
    }
  }

  return false;
}
