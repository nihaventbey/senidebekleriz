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

export type PaginatedDiscoveryResult = {
  items: AdminDiscoveryListItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
};

export async function getDiscoveredContentPaginated({
  status,
  contentType,
  page = 1,
  limit = 25,
}: {
  status?: DiscoveryStatus;
  contentType?: DiscoveryContentType;
  page?: number;
  limit?: number;
}): Promise<PaginatedDiscoveryResult> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(10, limit));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let countQuery = supabaseAdmin
    .from("discovered_content")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabaseAdmin
    .from("discovered_content")
    .select(
      "id, title, source_url, source_name, snippet, content_type, status, city_slug, discovered_at"
    )
    .order("discovered_at", { ascending: false })
    .range(from, to);

  if (status) {
    countQuery = countQuery.eq("status", status);
    dataQuery = dataQuery.eq("status", status);
  }

  if (contentType && contentType !== "unknown" && contentType !== "skip") {
    countQuery = countQuery.eq("content_type", contentType);
    dataQuery = dataQuery.eq("content_type", contentType);
  }

  const [{ count, error: countErr }, { data, error: dataErr }] =
    await Promise.all([countQuery, dataQuery]);

  if (countErr) {
    console.error("getDiscoveredContent count error:", countErr.message);
  }
  if (dataErr) {
    console.error("getDiscoveredContent data error:", dataErr.message);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    items: (data || []) as AdminDiscoveryListItem[],
    totalCount: total,
    totalPages,
    page: safePage,
    limit: safeLimit,
  };
}

export async function getDiscoveredContent(
  status?: DiscoveryStatus,
  contentType?: DiscoveryContentType
): Promise<AdminDiscoveryListItem[]> {
  const res = await getDiscoveredContentPaginated({
    status,
    contentType,
    page: 1,
    limit: 100,
  });
  return res.items;
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
