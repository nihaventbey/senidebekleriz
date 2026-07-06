"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { getAdminArticleBySlug } from "@/lib/data/admin-articles";
import { isValidCitySlug } from "@/lib/cities/lookup";

export type ArticleActionResult = {
  success: true;
  slug: string;
  isPublished: boolean;
};

function articleFromForm(formData: FormData) {
  const isPublished = formData.has("is_published");
  const citySlug = (formData.get("city_slug") as string) || null;
  const rawSlug = slugify((formData.get("slug") as string) || "");
  const content = (formData.get("content") as string) || "";

  if (!rawSlug) {
    throw new Error("Geçerli bir URL slug gerekli");
  }
  if (!content.trim()) {
    throw new Error("İçerik boş olamaz");
  }

  const resolvedCitySlug =
    citySlug && citySlug !== "none" ? citySlug : null;
  if (resolvedCitySlug && !isValidCitySlug(resolvedCitySlug)) {
    throw new Error("Geçersiz şehir seçimi");
  }

  return {
    title: formData.get("title") as string,
    slug: rawSlug,
    excerpt: (formData.get("excerpt") as string) || null,
    content,
    cover_image: (formData.get("cover_image") as string) || null,
    city_slug: resolvedCitySlug,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/yonetim/yazilar");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function createArticle(
  formData: FormData
): Promise<ArticleActionResult> {
  const data = articleFromForm(formData);

  const { error } = await supabaseAdmin.from("articles").insert(data);
  if (error) throw new Error(error.message);

  revalidateArticlePaths(data.slug);
  return { success: true, slug: data.slug, isPublished: data.is_published };
}

export async function updateArticle(
  slug: string,
  formData: FormData
): Promise<ArticleActionResult> {
  const existing = await getAdminArticleBySlug(slug);
  const data = articleFromForm(formData);

  if (data.is_published) {
    data.published_at =
      existing?.published_at || new Date().toISOString();
  } else {
    data.published_at = null;
  }

  const { error } = await supabaseAdmin
    .from("articles")
    .update(data)
    .eq("slug", slug);

  if (error) throw new Error(error.message);

  revalidateArticlePaths(slug);
  revalidateArticlePaths(data.slug);
  return { success: true, slug: data.slug, isPublished: data.is_published };
}

export async function deleteArticle(id: string) {
  const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateArticlePaths();
  redirect("/yonetim/yazilar");
}

export async function publishArticle(id: string) {
  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateArticlePaths();
}

export async function unpublishArticle(id: string) {
  const { error } = await supabaseAdmin
    .from("articles")
    .update({
      is_published: false,
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateArticlePaths();
}
