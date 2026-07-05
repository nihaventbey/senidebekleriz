import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  DiscoveredContentRow,
  DiscoveryContentType,
  DiscoveryStatus,
} from "@/lib/discovery/types";

export type AdminDiscoveryListItem = {
  id: string;
  title: string;
  source_url: string;
  source_name: string | null;
  snippet: string | null;
  content_type: DiscoveryContentType;
  status: DiscoveryStatus;
  city_slug: string | null;
  discovered_at: string;
};

export async function getDiscoveredContent(
  status?: DiscoveryStatus,
  contentType?: DiscoveryContentType
): Promise<AdminDiscoveryListItem[]> {
  let query = supabaseAdmin
    .from("discovered_content")
    .select(
      "id, title, source_url, source_name, snippet, content_type, status, city_slug, discovered_at"
    )
    .order("discovered_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  if (contentType && contentType !== "unknown" && contentType !== "skip") {
    query = query.eq("content_type", contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getDiscoveredContent error:", error.message);
    return [];
  }

  return (data || []) as AdminDiscoveryListItem[];
}

export async function countPendingDiscoveries(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("discovered_content")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) return 0;
  return count || 0;
}

export async function getDiscoveredContentById(
  id: string
): Promise<DiscoveredContentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("discovered_content")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as DiscoveredContentRow;
}
