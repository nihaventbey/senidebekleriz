import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminArticleData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  city_slug: string | null;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  published_at: string | null;
};

export type AdminArticleListItem = {
  id: string;
  title: string;
  slug: string;
  city_slug: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export async function getAdminArticles(): Promise<AdminArticleListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, title, slug, city_slug, is_published, published_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getAdminArticles error:", error.message);
    return [];
  }

  return data || [];
}

export async function getAdminArticleBySlug(
  slug: string
): Promise<AdminArticleData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || "",
    content: data.content || "",
    cover_image: data.cover_image,
    city_slug: data.city_slug,
    meta_title: data.meta_title || "",
    meta_description: data.meta_description || "",
    is_published: data.is_published ?? false,
    published_at: data.published_at,
  };
}
