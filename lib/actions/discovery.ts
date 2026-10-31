"use server";

import { revalidatePath } from "next/cache";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { generateNewsDraft } from "@/lib/ai/generate-news";
import { generateArticleDraft } from "@/lib/ai/generate-article";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import { getDiscoveredContentById } from "@/lib/data/admin-discovery";
import { uniqueEventSlug } from "@/lib/events/slug";
import { discoverContent } from "@/lib/discovery/sync";
import {
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";

function revalidateDiscoveryPaths() {
  revalidatePath("/yonetim/kesif");
  revalidatePath("/yonetim/etkinlikler");
  revalidatePath("/yonetim/yazilar");
  revalidatePath("/yonetim/haberler");
  revalidatePath("/");
}

async function markDiscoveryImported(
  id: string,
  targetTable: string,
  targetId: string
) {
  const { error } = await supabaseAdmin
    .from("discovered_content")
    .update({
      status: "imported",
      target_table: targetTable,
      target_id: targetId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function resolveDiscoveryUrl(item: {
  id: string;
  source_url: string;
  raw_payload: Record<string, unknown> | null;
}): Promise<string> {
  if (!isGoogleNewsArticleUrl(item.source_url)) {
    return item.source_url;
  }

  const fromPayload = item.raw_payload?.google_news_url;
  const googleUrl =
    typeof fromPayload === "string" && fromPayload
      ? fromPayload
      : item.source_url;

  const resolved = await resolvePublisherUrl(googleUrl);
  if (resolved !== item.source_url) {
    await supabaseAdmin
      .from("discovered_content")
      .update({
        source_url: resolved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  return resolved;
}

export async function runDiscoverySync() {
  const result = await discoverContent();
  revalidateDiscoveryPaths();
  return result;
}

export async function rejectDiscovery(id: string) {
  const { error } = await supabaseAdmin
    .from("discovered_content")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateDiscoveryPaths();
}

export async function importDiscoveryAsEvent(id: string) {
  const item = await getDiscoveredContentById(id);
  if (!item) throw new Error("Keşif kaydı bulunamadı");
  if (item.status !== "pending_review") {
    throw new Error("Bu kayıt zaten işlendi");
  }

  const publisherUrl = await resolveDiscoveryUrl(item);

  // Check if an event with this source_url already exists (idx_cultural_events_source_url is unique)
  const { data: existingEvent } = await supabaseAdmin
    .from("cultural_events")
    .select("id, slug")
    .eq("source_url", publisherUrl)
    .maybeSingle();

  if (existingEvent) {
    await markDiscoveryImported(id, "cultural_events", existingEvent.id);
    revalidateDiscoveryPaths();
    return { slug: existingEvent.slug };
  }

  let imported: any;
  try {
    imported = await importEventFromUrl(publisherUrl, {
      fallbackTitle: item.title,
      fallbackText: item.snippet,
    });
  } catch (err) {
    console.warn("importEventFromUrl fallback in action:", err);
    imported = {
      title: item.title,
      summary: (item.snippet || item.title).slice(0, 160),
      event_type: "duyuru",
      city_slug: item.city_slug,
      venue_name: null,
      starts_at: null,
      ends_at: null,
      cover_image: item.cover_image || null,
      image_urls: item.cover_image ? [item.cover_image] : [],
      ticket_url: publisherUrl,
    };
  }

  // Generate guaranteed unique slug
  const baseSlug = slugify(imported.title || item.title || "etkinlik");
  let slug = baseSlug.slice(0, 100);
  let counter = 1;
  while (true) {
    const { data: slugExists } = await supabaseAdmin
      .from("cultural_events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!slugExists) break;
    slug = `${baseSlug.slice(0, 90)}-${counter++}`;
  }

  const rawCover = imported.cover_image || item.cover_image || (item.raw_payload as any)?.image_url || null;
  const storedCoverImage = await ensureStoredCoverImage(rawCover, "events", slug);

  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .insert({
      title: imported.title || item.title,
      slug,
      summary: (imported.summary || item.snippet || item.title).slice(0, 160),
      event_type: imported.event_type || "duyuru",
      status: "pending_review",
      source_name: item.source_name,
      source_url: publisherUrl,
      ticket_url: imported.ticket_url || publisherUrl,
      city_slug: imported.city_slug || item.city_slug,
      venue_name: imported.venue_name,
      starts_at: imported.starts_at,
      ends_at: imported.ends_at,
      cover_image: storedCoverImage,
      raw_payload: {
        discovery_id: item.id,
        image_urls: imported.image_urls,
        google_news_url: item.raw_payload?.google_news_url,
      },
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("importDiscoveryAsEvent insert error:", error);
    throw new Error(`Etkinlik kaydedilemedi: ${error.message}`);
  }

  await markDiscoveryImported(id, "cultural_events", data.id);
  revalidateDiscoveryPaths();
  return { slug: data.slug };
}

export async function importDiscoveryAsArticle(id: string) {
  const item = await getDiscoveredContentById(id);
  if (!item) throw new Error("Keşif kaydı bulunamadı");
  if (item.status !== "pending_review") {
    throw new Error("Bu kayıt zaten işlendi");
  }

  const publisherUrl = await resolveDiscoveryUrl(item);
  const cityName = getCityName(item.city_slug) || undefined;
  const draft = await generateArticleDraft({
    topic: item.title,
    sourceUrl: publisherUrl,
    fallbackText: item.snippet || undefined,
    cityName,
    type: "guide",
  });

  const baseSlug = slugify(draft.title || item.title || "yazi");
  let slug = baseSlug.slice(0, 100);
  let counter = 1;
  while (true) {
    const { data: slugExists } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!slugExists) break;
    slug = `${baseSlug.slice(0, 90)}-${counter++}`;
  }

  const rawCover = draft.cover_image || item.cover_image || (item.raw_payload as any)?.image_url || null;
  const storedCoverImage = await ensureStoredCoverImage(rawCover, "articles", slug);

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: draft.title || item.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.content,
      cover_image: storedCoverImage,
      city_slug: normalizeCitySlug(item.city_slug),
      meta_description: draft.meta_description,
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  await markDiscoveryImported(id, "articles", data.id);
  revalidateDiscoveryPaths();
  return { slug: data.slug };
}

export async function importDiscoveryAsNews(id: string) {
  const item = await getDiscoveredContentById(id);
  if (!item) throw new Error("Keşif kaydı bulunamadı");
  if (item.status !== "pending_review") {
    throw new Error("Bu kayıt zaten işlendi");
  }

  const publisherUrl = await resolveDiscoveryUrl(item);

  // Check if news with this source_url already exists
  const { data: existingNews } = await supabaseAdmin
    .from("cultural_news")
    .select("id, slug")
    .eq("source_url", publisherUrl)
    .maybeSingle();

  if (existingNews) {
    await markDiscoveryImported(id, "cultural_news", existingNews.id);
    revalidateDiscoveryPaths();
    return { slug: existingNews.slug };
  }

  const cityName = getCityName(item.city_slug) || undefined;
  const draft = await generateNewsDraft({
    topic: item.title,
    sourceUrl: publisherUrl,
    fallbackText: item.snippet || undefined,
    cityName,
  });

  const baseSlug = slugify(draft.title || item.title || "haber");
  let slug = baseSlug.slice(0, 100);
  let counter = 1;
  while (true) {
    const { data: slugExists } = await supabaseAdmin
      .from("cultural_news")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!slugExists) break;
    slug = `${baseSlug.slice(0, 90)}-${counter++}`;
  }

  const rawCover = draft.cover_image || item.cover_image || (item.raw_payload as any)?.image_url || null;
  const storedCoverImage = await ensureStoredCoverImage(rawCover, "news", slug);

  const { data, error } = await supabaseAdmin
    .from("cultural_news")
    .insert({
      title: draft.title || item.title,
      slug,
      summary: draft.summary,
      content: draft.content,
      cover_image: storedCoverImage,
      category: draft.category || "genel",
      city_slug: normalizeCitySlug(item.city_slug),
      source_name: item.source_name,
      source_url: publisherUrl,
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.message?.includes("cultural_news") || error.message?.includes("schema cache")) {
      throw new Error(
        "Veritabanında 'cultural_news' tablosu eksik. Lütfen Supabase SQL Editor'da '015_cultural_news.sql' migration dosyasını çalıştırın."
      );
    }
    throw new Error(error.message);
  }

  await markDiscoveryImported(id, "cultural_news", data.id);
  revalidateDiscoveryPaths();
  return { slug: data.slug };
}

export async function bulkRejectDiscovery(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };

  const { error } = await supabaseAdmin
    .from("discovered_content")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) throw new Error(error.message);

  revalidateDiscoveryPaths();
  return { success: true, count: ids.length };
}

export async function bulkDeleteDiscovery(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };

  const { error } = await supabaseAdmin
    .from("discovered_content")
    .delete()
    .in("id", ids);

  if (error) throw new Error(error.message);

  revalidateDiscoveryPaths();
  return { success: true, count: ids.length };
}

export async function deleteAllDiscoveredContentByFilter(status?: string) {
  let query = supabaseAdmin.from("discovered_content").delete();
  if (status && status !== "all") {
    query = query.eq("status", status);
  } else {
    query = query.neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidateDiscoveryPaths();
  return { success: true };
}

