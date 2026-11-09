"use server";

import { requireAdmin } from "@/lib/auth/admin";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { cleanPublisherText, cleanNewsSlug } from "@/lib/ai/clean-publisher";

export type NewsActionResult = {
  success: boolean;
  error?: string;
  slug?: string;
};

function revalidateNewsPaths(slug?: string) {
  revalidatePath("/haberler");
  revalidatePath("/yonetim/haberler");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/haber/${slug}`);
    revalidatePath(`/yonetim/haberler/${slug}/duzenle`);
  }
}

export async function createNews(formData: FormData): Promise<NewsActionResult> {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const category = String(formData.get("category") || "genel").trim();
  const citySlugRaw = String(formData.get("city_slug") || "").trim();
  const coverImageRaw = String(formData.get("cover_image") || "").trim() || null;
  const sourceName = String(formData.get("source_name") || "").trim() || null;
  const sourceUrl = String(formData.get("source_url") || "").trim() || null;
  const isPublished = formData.get("is_published") === "on" || formData.get("is_published") === "true";
  const isFeatured = formData.get("is_featured") === "on" || formData.get("is_featured") === "true";

  if (!title) {
    return { success: false, error: "Haber başlığı zorunludur." };
  }
  if (!content) {
    return { success: false, error: "Haber metni zorunludur." };
  }

  const cleanTitle = cleanPublisherText(title);
  const baseSlug = cleanNewsSlug(rawSlug || cleanTitle);
  let slug = baseSlug.slice(0, 100);
  let counter = 2;
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("cultural_news")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug.slice(0, 90)}-${counter++}`;
  }
  const citySlug = normalizeCitySlug(citySlugRaw === "none" ? null : citySlugRaw);

  // Transfer cover image to Supabase Storage now that user confirmed/submitted
  const coverImage = await ensureStoredCoverImage(coverImageRaw, "news", slug);

  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .insert({
      title: cleanTitle || title,
      slug,
      summary: cleanPublisherText(summary) || cleanTitle || title,
      content,
      category,
      city_slug: citySlug,
      cover_image: coverImage,
      source_name: sourceName,
      source_url: sourceUrl,
      is_published: isPublished,
      is_featured: isFeatured,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Bu URL slug zaten kullanımda" };
    }
    if (error.message?.includes("cultural_news") || error.message?.includes("schema cache")) {
      return {
        success: false,
        error: "Veritabanında 'cultural_news' tablosu eksik. Lütfen Supabase SQL Editor'da '015_cultural_news.sql' migration dosyasını çalıştırın.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidateNewsPaths(data.slug);
  return { success: true, slug: data.slug };
}

export async function updateNews(
  originalSlug: string,
  formData: FormData
): Promise<NewsActionResult> {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const category = String(formData.get("category") || "genel").trim();
  const citySlugRaw = String(formData.get("city_slug") || "").trim();
  const coverImageRaw = String(formData.get("cover_image") || "").trim() || null;
  const sourceName = String(formData.get("source_name") || "").trim() || null;
  const sourceUrl = String(formData.get("source_url") || "").trim() || null;
  const isPublished = formData.get("is_published") === "on" || formData.get("is_published") === "true";
  const isFeatured = formData.get("is_featured") === "on" || formData.get("is_featured") === "true";

  if (!title) {
    return { success: false, error: "Haber başlığı zorunludur." };
  }
  if (!content) {
    return { success: false, error: "Haber metni zorunludur." };
  }

  const cleanTitle = cleanPublisherText(title);
  const baseSlug = cleanNewsSlug(rawSlug || cleanTitle || originalSlug);
  let slug = baseSlug.slice(0, 100);
  if (slug !== originalSlug) {
    let counter = 2;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("cultural_news")
        .select("slug")
        .eq("slug", slug)
        .neq("slug", originalSlug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug.slice(0, 90)}-${counter++}`;
    }
  }
  const citySlug = normalizeCitySlug(citySlugRaw === "none" ? null : citySlugRaw);

  // Transfer cover image to Supabase Storage upon update
  const coverImage = await ensureStoredCoverImage(coverImageRaw, "news", slug);

  // Fetch existing record to ensure published_at is set properly when published
  const { data: existingNews } = await supabaseAdmin
    .from("cultural_news")
    .select("published_at")
    .eq("slug", originalSlug)
    .maybeSingle();

  let publishedAt = existingNews?.published_at || null;
  if (isPublished && !publishedAt) {
    publishedAt = new Date().toISOString();
  } else if (!isPublished) {
    publishedAt = null;
  }

  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .update({
      title: cleanTitle || title,
      slug,
      summary: cleanPublisherText(summary) || cleanTitle || title,
      content,
      category,
      city_slug: citySlug,
      cover_image: coverImage,
      source_name: sourceName,
      source_url: sourceUrl,
      is_published: isPublished,
      is_featured: isFeatured,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", originalSlug)
    .select("slug")
    .single();

  if (error) {
    if (error.message?.includes("cultural_news") || error.message?.includes("schema cache")) {
      return {
        success: false,
        error: "Veritabanında 'cultural_news' tablosu eksik. Lütfen Supabase SQL Editor'da '015_cultural_news.sql' migration dosyasını çalıştırın.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidateNewsPaths(data.slug);
  return { success: true, slug: data.slug };
}

export async function deleteNews(id: string): Promise<void> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("cultural_news").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}

export async function togglePublishNews(id: string, isPublished: boolean): Promise<void> {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_news")
    .update({
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}

export async function toggleFeaturedNews(id: string, isFeatured: boolean): Promise<void> {
  await requireAdmin();
  const { data: existing } = await supabaseAdmin
    .from("cultural_news")
    .select("is_published, published_at")
    .eq("id", id)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    is_featured: isFeatured,
    updated_at: new Date().toISOString(),
  };

  // If the news is published but published_at was null, populate it so hero ordering works seamlessly
  if (existing?.is_published && !existing.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("cultural_news")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}

export async function bulkPublishNews(ids: string[], isPublished: boolean): Promise<void> {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_news")
    .update({
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}

export async function bulkFeaturedNews(ids: string[], isFeatured: boolean): Promise<void> {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_news")
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}

export async function bulkDeleteNews(ids: string[]): Promise<void> {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_news")
    .delete()
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateNewsPaths();
}
