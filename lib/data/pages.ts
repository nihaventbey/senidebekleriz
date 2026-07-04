import { supabaseAdmin } from "@/lib/supabase/admin";

export type PageData = {
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  content: string;
};

export async function getAllPages(): Promise<PageData[]> {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*")
    .eq("is_published", true)
    .order("title");

  if (error) {
    console.error("getAllPages error:", error.message);
    return [];
  }

  return (data || []).map((page) => ({
    slug: page.slug,
    title: page.title,
    meta_title: page.meta_title || page.title,
    meta_description: page.meta_description || "",
    content: page.content || "",
  }));
}

export async function getPageBySlug(slug: string): Promise<PageData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    console.error("getPageBySlug error:", error?.message);
    return undefined;
  }

  return {
    slug: data.slug,
    title: data.title,
    meta_title: data.meta_title || data.title,
    meta_description: data.meta_description || "",
    content: data.content || "",
  };
}

export async function getCityGuidePage(
  citySlug: string
): Promise<PageData | undefined> {
  return getPageBySlug(`rehber-${citySlug}`);
}

export async function getAllPageSlugs(): Promise<string[]> {
  const pages = await getAllPages();
  return pages.map((page) => page.slug);
}
