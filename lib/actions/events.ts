"use server";

import { requireAdmin } from "@/lib/auth/admin";

import { revalidatePath } from "next/cache";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { resolveFallbackCulturalImage } from "@/lib/ai/extract-page-images";
import { sanitizeEventType, sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { polishMarkdown } from "@/lib/ai/editorial";
import { cleanPublisherText } from "@/lib/ai/clean-publisher";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import {
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { resolveArtistOrEventCover } from "@/lib/events/artist-image-resolver";
import { parseArtistInfoCardFormValue } from "@/lib/events/artist-info-card";
import { buildEventRawPayload } from "@/lib/events/event-payload";
import { getAdminEventBySlug } from "@/lib/data/admin-events";
import { slugify } from "@/lib/slugify";
import type { EventType } from "@/lib/events/types";

export type EventActionResult = {
  success: boolean;
  error?: string;
  slug?: string;
};

const VALID_EVENT_TYPES = new Set<EventType>([
  "tiyatro",
  "konser",
  "sergi",
  "festival",
  "duyuru",
  "diger",
]);

function revalidateEventPaths(slug?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/etkinlikler");
    revalidatePath("/yonetim/etkinlikler");
    if (slug) {
      revalidatePath(`/etkinlik/${slug}`);
      revalidatePath(`/yonetim/etkinlikler/${slug}/duzenle`);
    }
  } catch (err) {
    console.warn("revalidateEventPaths skipped:", err);
  }
}

async function ensureUniqueEventSlug(
  rawTitleOrSlug: string,
  ignoreId?: string
): Promise<string> {
  const baseSlug = (slugify(rawTitleOrSlug) || "etkinlik").slice(0, 100);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    let query = supabaseAdmin
      .from("cultural_events")
      .select("id")
      .eq("slug", slug);
    if (ignoreId) {
      query = query.neq("id", ignoreId);
    }
    const { data: exists } = await query.maybeSingle();
    if (!exists) return slug;
    slug = `${baseSlug.slice(0, 90)}-${counter++}`;
  }
}

async function ensureUniqueSourceUrl(
  rawSourceUrl: string | null,
  slug: string,
  ignoreId?: string
): Promise<string | null> {
  if (!rawSourceUrl || !rawSourceUrl.trim()) return null;
  const trimmed = rawSourceUrl.trim();
  let query = supabaseAdmin
    .from("cultural_events")
    .select("id")
    .eq("source_url", trimmed);
  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }
  const { data: exists } = await query.maybeSingle();
  if (!exists) return trimmed;
  return `${trimmed.replace(/#.*$/, "")}#${slug}`;
}

function eventFromForm(formData: FormData) {
  const citySlug = (formData.get("city_slug") as string) || null;
  const rawTitle = ((formData.get("title") as string) || "").trim() || "Etkinlik";
  const title = cleanPublisherText(rawTitle) || rawTitle;
  const rawSlug = ((formData.get("slug") as string) || "").trim() || title;
  const startsAt = sanitizeIsoDate((formData.get("starts_at") as string) || null);
  const endsAt = sanitizeIsoDate((formData.get("ends_at") as string) || null);
  const expiresAt = sanitizeIsoDate(
    (formData.get("expires_at") as string) || null
  );
  const sourceName = ((formData.get("source_name") as string) || "").trim() || null;
  const rawDescription = ((formData.get("description") as string) || "").trim();
  const description = rawDescription
    ? polishMarkdown(rawDescription, title, sourceName || undefined)
    : null;
  const rawEventType = String(formData.get("event_type") || "").trim() as EventType;
  const eventType = VALID_EVENT_TYPES.has(rawEventType)
    ? rawEventType
    : sanitizeEventType(rawEventType || "duyuru", title);

  const isFree =
    formData.get("is_free") === "on" ||
    formData.get("is_free") === "true";
  const artistInfoCard = parseArtistInfoCardFormValue(
    formData.get("artist_info_card")
  );

  // NOTE: `is_free` is a PostgreSQL GENERATED ALWAYS column derived from `raw_payload`,
  // so it must NEVER be included in top-level INSERT/UPDATE columns.
  return {
    columns: {
      title,
      slug: slugify(rawSlug) || "etkinlik",
      summary: cleanPublisherText((formData.get("summary") as string) || title) || title,
      description,
      event_type: eventType,
      source_name: sourceName,
      source_url: ((formData.get("source_url") as string) || "").trim() || null,
      ticket_url: ((formData.get("ticket_url") as string) || "").trim() || null,
      city_slug: citySlug && citySlug !== "none" ? normalizeCitySlug(citySlug) : null,
      venue_name: ((formData.get("venue_name") as string) || "").trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      cover_image: ((formData.get("cover_image") as string) || "").trim() || null,
      meta_title: ((formData.get("meta_title") as string) || "").trim() || null,
      meta_description: ((formData.get("meta_description") as string) || "").trim() || null,
      is_featured:
        formData.get("is_featured") === "on" ||
        formData.get("is_featured") === "true",
      sort_order: parseInt((formData.get("sort_order") as string) || "0", 10) || 0,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    isFree,
    artistInfoCard,
  };
}

export async function createEvent(formData: FormData): Promise<EventActionResult> {
  await requireAdmin();
  const rawTitle = String(formData.get("title") || "").trim();
  if (!rawTitle) {
    return { success: false, error: "Etkinlik başlığı zorunludur." };
  }

  const { columns, isFree, artistInfoCard } = eventFromForm(formData);
  const publishNow =
    formData.get("publish_now") === "on" ||
    formData.get("publish_now") === "true" ||
    formData.get("is_published") === "on" ||
    formData.get("is_published") === "true";

  const uniqueSlug = await ensureUniqueEventSlug(columns.slug || columns.title);
  const uniqueSourceUrl = await ensureUniqueSourceUrl(
    columns.source_url,
    uniqueSlug
  );

  const storedCoverImage = await ensureStoredCoverImage(
    columns.cover_image,
    "events",
    uniqueSlug
  );

  const finalCoverImage = await resolveArtistOrEventCover({
    title: columns.title,
    summary: columns.summary,
    event_type: columns.event_type,
    sourceCover: storedCoverImage,
    slug: uniqueSlug,
  });

  const { error } = await supabaseAdmin.from("cultural_events").insert({
    ...columns,
    slug: uniqueSlug,
    source_url: uniqueSourceUrl,
    cover_image: finalCoverImage,
    raw_payload: buildEventRawPayload(null, { isFree, artistInfoCard }),
    status: publishNow ? "published" : "pending_review",
    published_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Bu URL slug veya kaynak adresi zaten kullanımda." };
    }
    return { success: false, error: error.message };
  }

  revalidateEventPaths(uniqueSlug);
  return { success: true, slug: uniqueSlug };
}

export async function updateEvent(
  slug: string,
  formData: FormData
): Promise<EventActionResult> {
  await requireAdmin();
  const rawTitle = String(formData.get("title") || "").trim();
  if (!rawTitle) {
    return { success: false, error: "Etkinlik başlığı zorunludur." };
  }

  const { columns, isFree, artistInfoCard } = eventFromForm(formData);
  const existing = await getAdminEventBySlug(slug);
  const wantsPublished =
    formData.get("is_published") === "on" ||
    formData.get("is_published") === "true";

  const uniqueSlug = await ensureUniqueEventSlug(
    columns.slug || slug,
    existing?.id
  );
  const uniqueSourceUrl = await ensureUniqueSourceUrl(
    columns.source_url,
    uniqueSlug,
    existing?.id
  );

  const storedCoverImage = await ensureStoredCoverImage(
    columns.cover_image,
    "events",
    uniqueSlug
  );

  const statusUpdate: {
    status?: "published" | "pending_review";
    published_at?: string | null;
  } = {};

  if (existing) {
    if (wantsPublished && existing.status !== "published") {
      statusUpdate.status = "published";
      statusUpdate.published_at = new Date().toISOString();
    } else if (!wantsPublished && existing.status === "published") {
      statusUpdate.status = "pending_review";
      statusUpdate.published_at = null;
    }
  }

  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      ...columns,
      slug: uniqueSlug,
      source_url: uniqueSourceUrl,
      cover_image: storedCoverImage,
      raw_payload: buildEventRawPayload(existing?.raw_payload, {
        isFree,
        artistInfoCard,
      }),
      ...statusUpdate,
    })
    .eq("slug", slug);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Bu URL slug veya kaynak adresi zaten kullanımda." };
    }
    return { success: false, error: error.message };
  }

  if (uniqueSlug !== slug) {
    revalidateEventPaths(slug);
  }
  revalidateEventPaths(uniqueSlug);
  return { success: true, slug: uniqueSlug };
}

export async function approveEvent(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function unpublishEvent(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "pending_review",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function rejectEvent(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function toggleFeaturedEvent(id: string, isFeatured: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function bulkFeaturedEvents(ids: string[], isFeatured: boolean) {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function bulkUpdateEventsStatus(
  ids: string[],
  status: "published" | "pending_review" | "rejected"
) {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function bulkDeleteEvents(ids: string[]) {
  await requireAdmin();
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .delete()
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function importEventFromUrlAction(rawUrl: string) {
  await requireAdmin();
  try {
    let url = rawUrl.trim();
    if (isGoogleNewsArticleUrl(url)) {
      url = await resolvePublisherUrl(url);
    }

    // Check if an event with this source_url already exists
    const { data: existingEvent } = await supabaseAdmin
      .from("cultural_events")
      .select("slug")
      .eq("source_url", url)
      .maybeSingle();

    if (existingEvent) {
      return { success: true, slug: existingEvent.slug };
    }

    const imported = await importEventFromUrl(url);
    const title = (imported.title || "Kültür Sanat Etkinliği").trim();
    const slug = await ensureUniqueEventSlug(title);
    const citySlug = normalizeCitySlug(imported.city_slug);

    const safeEventType = sanitizeEventType(imported.event_type, title);

    const storedCoverImage = await ensureStoredCoverImage(
      imported.cover_image || null,
      "events",
      slug
    );

    let finalCoverImage = await resolveArtistOrEventCover({
      title,
      summary: imported.summary,
      event_type: safeEventType,
      sourceCover: storedCoverImage,
      slug,
    });

    if (
      !finalCoverImage &&
      safeEventType !== "konser" &&
      !title.toLowerCase().includes("konser")
    ) {
      const rawCover = await resolveFallbackCulturalImage({
        title,
        cityName: getCityName(citySlug),
        category: "kultur_sanat",
      });
      finalCoverImage = await ensureStoredCoverImage(rawCover, "events", slug);
    }

    let sourceName = "Etkinlik Kaynağı";
    try {
      sourceName = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // ignore invalid URL hostname
    }

    const { data, error } = await supabaseAdmin
      .from("cultural_events")
      .insert({
        title,
        slug,
        summary: (imported.summary || title).trim(),
        description: imported.description || imported.summary || null,
        event_type: safeEventType,
        status: "pending_review",
        source_name: sourceName,
        source_url: url,
        ticket_url: imported.ticket_url || null,
        city_slug: citySlug,
        venue_name: imported.venue_name || null,
        starts_at: sanitizeIsoDate(imported.starts_at),
        ends_at: sanitizeIsoDate(imported.ends_at),
        cover_image: finalCoverImage,
        meta_title: (imported.meta_title || `${title} | Etkinlik Takvimi`).slice(0, 60),
        meta_description: (
          imported.meta_description ||
          imported.summary ||
          title
        ).slice(0, 155),
        raw_payload: {
          imported,
          is_free: Boolean(imported.is_free),
          price_type: imported.is_free ? "free" : "paid",
        },
        updated_at: new Date().toISOString(),
      })
      .select("slug")
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidateEventPaths();
    return { success: true, slug: data.slug };
  } catch (err: any) {
    console.error("importEventFromUrlAction error:", err);
    return { error: err?.message || "Etkinlik üretilirken hata oluştu." };
  }
}
