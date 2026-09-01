import { getCityName } from "@/lib/cities/lookup";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type NewsCategory =
  | "arkeoloji"
  | "restorasyon"
  | "muze_sergi"
  | "kultur_sanat"
  | "festival_haberleri"
  | "genel";

export type PublicNewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  citySlug: string | null;
  cityName: string | null;
  category: NewsCategory;
  sourceName: string | null;
  sourceUrl: string | null;
  isFeatured: boolean;
  publishedAt: string;
  updatedAt: string;
};

export type CulturalNewsRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  city_slug: string | null;
  category: string;
  source_name: string | null;
  source_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapNews(row: CulturalNewsRow): PublicNewsArticle {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary || row.title,
    content: row.content,
    coverImage: row.cover_image,
    citySlug: row.city_slug,
    cityName: getCityName(row.city_slug),
    category: (row.category as NewsCategory) || "genel",
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    isFeatured: row.is_featured,
    publishedAt: row.published_at || row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFeaturedNews(limit = 5): Promise<PublicNewsArticle[]> {
  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .select("*")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedNews error:", error.message);
    return [];
  }

  return (data || []).map((r) => mapNews(r as CulturalNewsRow));
}

export async function getPublishedNews(options?: {
  category?: string;
  citySlug?: string;
  limit?: number;
}): Promise<PublicNewsArticle[]> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }

  if (options?.citySlug && options.citySlug !== "all") {
    query = query.eq("city_slug", options.citySlug);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublishedNews error:", error.message);
    return [];
  }

  return (data || []).map((r) => mapNews(r as CulturalNewsRow));
}

export async function getNewsBySlug(slug: string): Promise<PublicNewsArticle | undefined> {
  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapNews(data as CulturalNewsRow);
}

export async function getRelatedNews(
  currentSlug: string,
  category?: string,
  limit = 4
): Promise<PublicNewsArticle[]> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select("*")
    .eq("is_published", true)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map((r) => mapNews(r as CulturalNewsRow));
}

export async function getNewsSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .select("slug, updated_at")
    .eq("is_published", true);

  if (error) return [];
  return (data || []).map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}
