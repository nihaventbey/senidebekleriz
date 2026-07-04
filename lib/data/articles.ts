import { supabaseAdmin } from "@/lib/supabase/admin";
import { excerptFromMarkdown } from "@/lib/markdown";

export type ArticleData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  citySlug: string | null;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string | null;
  updatedAt: string;
};

function mapArticle(row: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  city_slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string;
}): ArticleData {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || excerptFromMarkdown(row.content),
    content: row.content,
    coverImage: row.cover_image,
    citySlug: row.city_slug,
    metaTitle: row.meta_title || row.title,
    metaDescription: row.meta_description || excerptFromMarkdown(row.content),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export async function getPublishedArticles(limit = 12): Promise<ArticleData[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublishedArticles error:", error.message);
    return [];
  }

  return (data || []).map(mapArticle);
}

export async function getArticleBySlug(
  slug: string
): Promise<ArticleData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return undefined;
  return mapArticle(data);
}

export async function getCityArticle(
  citySlug: string
): Promise<ArticleData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("city_slug", citySlug)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapArticle(data);
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("slug")
    .eq("is_published", true);

  if (error) return [];
  return (data || []).map((row) => row.slug);
}
