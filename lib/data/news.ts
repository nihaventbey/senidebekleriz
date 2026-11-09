import { cache } from "react";
import { getCityName } from "@/lib/cities/lookup";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type NewsCategory =
  | "arkeoloji"
  | "restorasyon"
  | "muze_sergi"
  | "sinema"
  | "kultur_sanat"
  | "festival_haberleri"
  | "genel";

const NEWS_CARD_FIELDS =
  "id, title, slug, summary, cover_image, city_slug, category, source_name, source_url, is_published, is_featured, published_at, created_at, updated_at";

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
    content: row.content || "",
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

export async function getFeaturedNews(limit = 4): Promise<PublicNewsArticle[]> {
  // 1. Fetch news explicitly marked as featured (Manşet) and published
  const { data: featuredRows, error: featuredErr } = await supabaseAdmin
    .from("cultural_news")
    .select(NEWS_CARD_FIELDS)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (featuredErr) {
    console.error("getFeaturedNews featured error:", featuredErr.message);
  }

  const featured = (featuredRows || []).map((r) => mapNews(r as CulturalNewsRow));

  // If we have enough featured news to fill the hero slots, return them directly
  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }

  // 2. Otherwise, fill the remaining slots with the freshest published news
  const remainingSlots = limit - featured.length;
  const existingIds = new Set(featured.map((f) => f.id));

  const { data: latestRows, error: latestErr } = await supabaseAdmin
    .from("cultural_news")
    .select(NEWS_CARD_FIELDS)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (latestErr) {
    console.error("getFeaturedNews latest fill error:", latestErr.message);
  }

  const filler = (latestRows || [])
    .filter((r) => !existingIds.has(r.id))
    .slice(0, remainingSlots)
    .map((r) => mapNews(r as CulturalNewsRow));

  return [...featured, ...filler];
}

export async function getPublishedNews(options?: {
  category?: string;
  citySlug?: string;
  citySlugs?: string[];
  limit?: number;
}): Promise<PublicNewsArticle[]> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select(NEWS_CARD_FIELDS)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }

  if (options?.citySlugs && options.citySlugs.length > 0) {
    query = query.in("city_slug", options.citySlugs);
  } else if (options?.citySlug && options.citySlug !== "all") {
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

export const getNewsBySlug = cache(
  async (slug: string): Promise<PublicNewsArticle | undefined> => {
    const { data, error } = await supabaseAdmin
      .from("cultural_news")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return undefined;
    return mapNews(data as CulturalNewsRow);
  }
);

export async function getRelatedNews(
  currentSlug: string,
  category?: string,
  limit = 4
): Promise<PublicNewsArticle[]> {
  let query = supabaseAdmin
    .from("cultural_news")
    .select(NEWS_CARD_FIELDS)
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

export async function getNewsGroupedByCategory(
  limitPerCategory = 10
): Promise<Record<NewsCategory, PublicNewsArticle[]>> {
  // 1. Try high-performance RPC function from migration 018
  const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc(
    "get_news_rails",
    { limit_per_cat: limitPerCategory }
  );

  let rows = rpcData;

  // 2. Fallback: select only card fields with a safe limit if RPC is not yet applied
  if (rpcErr || !rows || rows.length === 0) {
    const { data } = await supabaseAdmin
      .from("cultural_news")
      .select(NEWS_CARD_FIELDS)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limitPerCategory * 12);
    rows = data;
  }

  if (!rows) return {} as Record<NewsCategory, PublicNewsArticle[]>;

  const grouped: Partial<Record<NewsCategory, PublicNewsArticle[]>> = {};

  for (const row of rows) {
    const item = mapNews(row as CulturalNewsRow);
    const cat = item.category || "genel";
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    if ((grouped[cat]?.length || 0) < limitPerCategory) {
      grouped[cat]!.push(item);
    }
  }

  return grouped as Record<NewsCategory, PublicNewsArticle[]>;
}
