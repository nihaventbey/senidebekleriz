"use server";

import { revalidatePath } from "next/cache";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
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

function revalidateDiscoveryPaths() {
  revalidatePath("/yonetim/kesif");
  revalidatePath("/yonetim/etkinlikler");
  revalidatePath("/yonetim/yazilar");
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

  const imported = await importEventFromUrl(publisherUrl, {
    fallbackTitle: item.title,
    fallbackText: item.snippet,
  });
  const slug = uniqueEventSlug(imported.title || item.title);

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
      cover_image: imported.cover_image,
      raw_payload: {
        discovery_id: item.id,
        image_urls: imported.image_urls,
        google_news_url: item.raw_payload?.google_news_url,
      },
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

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

  const slug = slugify(draft.title || item.title);

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: draft.title || item.title,
      slug,
      excerpt: draft.excerpt,
      content: draft.content,
      cover_image: draft.cover_image,
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
