import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminNewsListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string;
  city_slug: string | null;
  cover_image: string | null;
  source_name: string | null;
  source_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
};

export async function getAdminNewsList(statusFilter?: string): Promise<AdminNewsListItem[]> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select("*")
    .order("updated_at", { ascending: false });

  if (statusFilter === "published") {
    query = query.eq("is_published", true);
  } else if (statusFilter === "draft") {
    query = query.eq("is_published", false);
  } else if (statusFilter === "featured") {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAdminNewsList error:", error.message);
    return [];
  }

  return (data || []) as AdminNewsListItem[];
}

export async function getAdminNewsBySlug(slug: string): Promise<AdminNewsListItem | null> {
  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as AdminNewsListItem;
}
