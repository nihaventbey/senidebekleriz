"use server";

import { revalidatePath } from "next/cache";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { sanitizeEventType, sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { generateNewsDraft } from "@/lib/ai/generate-news";
import { generateArticleDraft } from "@/lib/ai/generate-article";
import { resolveFallbackCulturalImage } from "@/lib/ai/extract-page-images";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import { getDiscoveredContentById } from "@/lib/data/admin-discovery";
import { discoverContent } from "@/lib/discovery/sync";
import {
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { extractEventsFromBulletin } from "@/lib/ai/extract-multi-events";

function revalidateDiscoveryPaths() {
  try {
    revalidatePath("/yonetim/kesif");
    revalidatePath("/yonetim/etkinlikler");
    revalidatePath("/yonetim/yazilar");
    revalidatePath("/yonetim/haberler");
    revalidatePath("/haberler");
    revalidatePath("/etkinlikler");
    revalidatePath("/");
  } catch (err) {
    console.warn("revalidateDiscoveryPaths skipped:", err);
  }
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
      summary: (item.snippet || item.title).trim(),
      description: item.snippet || null,
      event_type: "duyuru",
      city_slug: item.city_slug,
      venue_name: null,
      starts_at: null,
      ends_at: null,
      cover_image: item.cover_image || null,
      image_urls: item.cover_image ? [item.cover_image] : [],
      ticket_url: null,
    };
  }

  const baseSlug = slugify(imported.title || item.title || "etkinlik") || "etkinlik";
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

  const resolvedCity = normalizeCitySlug(imported.city_slug || item.city_slug);

  let rawCover =
    imported.cover_image ||
    item.cover_image ||
    (item.raw_payload as any)?.image_url ||
    null;

  if (!rawCover) {
    rawCover = await resolveFallbackCulturalImage({
      title: imported.title || item.title,
      cityName: getCityName(resolvedCity),
      category: "kultur_sanat",
    });
  }

  const storedCoverImage = await ensureStoredCoverImage(rawCover, "events", slug);
  const safeTitle = (imported.title || item.title || "Kültür Etkinliği").trim();

  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .insert({
      title: safeTitle,
      slug,
      summary: (imported.summary || item.snippet || safeTitle).trim(),
      description: imported.description || item.snippet || null,
      event_type: sanitizeEventType(imported.event_type, `${safeTitle} ${item.snippet || ""}`),
      status: "pending_review",
      source_name: item.source_name,
      source_url: publisherUrl,
      ticket_url: imported.ticket_url || null,
      city_slug: resolvedCity,
      venue_name: imported.venue_name || null,
      starts_at: sanitizeIsoDate(imported.starts_at),
      ends_at: sanitizeIsoDate(imported.ends_at),
      cover_image: storedCoverImage,
      meta_title: imported.meta_title ? String(imported.meta_title).slice(0, 60) : null,
      meta_description: (
        imported.meta_description ||
        imported.summary ||
        item.snippet ||
        safeTitle
      ).slice(0, 155),
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

  let rawCover =
    draft.cover_image ||
    item.cover_image ||
    (item.raw_payload as any)?.image_url ||
    null;

  if (!rawCover) {
    rawCover = await resolveFallbackCulturalImage({
      title: draft.title || item.title,
      cityName,
      category: "genel",
    });
  }

  const storedCoverImage = await ensureStoredCoverImage(
    rawCover,
    "articles",
    slug
  );

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

  const publisherUrl = await resolveDiscoveryUrl(item);

  // Check if news with this source_url already exists
  const { data: existingNews } = await supabaseAdmin
    .from("cultural_news")
    .select("id, slug, content, cover_image")
    .eq("source_url", publisherUrl)
    .maybeSingle();

  const existingWordCount = existingNews?.content
    ? existingNews.content.trim().split(/\s+/).length
    : 0;

  if (existingNews && existingWordCount >= 150 && existingNews.cover_image) {
    await markDiscoveryImported(id, "cultural_news", existingNews.id);
    revalidateDiscoveryPaths();
    return { slug: existingNews.slug };
  }

  const cityName = getCityName(item.city_slug) || undefined;
  const coverImageHint =
    item.cover_image || (item.raw_payload as any)?.image_url || null;

  const draft = await generateNewsDraft({
    topic: item.title,
    sourceUrl: publisherUrl,
    fallbackText: item.snippet || undefined,
    cityName,
    coverImageHint,
  });

  if (existingNews) {
    const rawCover =
      draft.cover_image || existingNews.cover_image || coverImageHint || null;
    const storedCoverImage = await ensureStoredCoverImage(
      rawCover,
      "news",
      existingNews.slug
    );

    const { error: updateErr } = await supabaseAdmin
      .from("cultural_news")
      .update({
        title: draft.title || item.title,
        summary: draft.summary,
        content: draft.content,
        cover_image: storedCoverImage,
        category: draft.category || "genel",
        city_slug: normalizeCitySlug(item.city_slug || draft.city_slug),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingNews.id);

    if (updateErr) throw new Error(updateErr.message);

    await markDiscoveryImported(id, "cultural_news", existingNews.id);
    revalidateDiscoveryPaths();
    return { slug: existingNews.slug };
  }

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

  const rawCover = draft.cover_image || coverImageHint || null;
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
      city_slug: normalizeCitySlug(item.city_slug || draft.city_slug),
      source_name: item.source_name,
      source_url: publisherUrl,
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    if (
      error.message?.includes("cultural_news") ||
      error.message?.includes("schema cache")
    ) {
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

export async function bulkImportDiscovery(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0, errors: [] };

  let importedCount = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      const item = await getDiscoveredContentById(id);
      if (!item || item.status !== "pending_review") continue;

      if (item.content_type === "event") {
        await importDiscoveryAsEvent(id);
        importedCount++;
      } else if (item.content_type === "article") {
        await importDiscoveryAsArticle(id);
        importedCount++;
      } else {
        await importDiscoveryAsNews(id);
        importedCount++;
      }
    } catch (err: any) {
      console.error(`bulkImportDiscovery error for ${id}:`, err);
      errors.push(err.message || String(err));
    }
  }

  revalidateDiscoveryPaths();
  return { success: true, count: importedCount, errors };
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

export async function disaggregateDiscoveryBulletin(id: string) {
  const item = await getDiscoveredContentById(id);
  if (!item) throw new Error("Keşif kaydı bulunamadı");

  const publisherUrl = await resolveDiscoveryUrl(item);
  const coverImageHint =
    item.cover_image || (item.raw_payload as any)?.image_url || null;

  const res = await extractEventsFromBulletin({
    url: publisherUrl,
    fallbackTitle: item.title,
    fallbackText: item.snippet || undefined,
    sourceName: item.source_name || undefined,
    coverImageHint,
  });

  if (res.extractedCount > 0) {
    await markDiscoveryImported(id, "cultural_events", res.events[0].id);
    revalidateDiscoveryPaths();
  }

  return res;
}
