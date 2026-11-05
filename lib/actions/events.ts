"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { importEventFromUrl } from "@/lib/ai/import-event-from-url";
import { resolveFallbackCulturalImage } from "@/lib/ai/extract-page-images";
import { sanitizeEventType, sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import {
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { getAdminEventBySlug } from "@/lib/data/admin-events";
import { slugify } from "@/lib/slugify";
import type { EventType } from "@/lib/events/types";

function revalidateEventPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/etkinlikler");
    revalidatePath("/yonetim/etkinlikler");
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
  const title = ((formData.get("title") as string) || "").trim() || "Etkinlik";
  const rawSlug = ((formData.get("slug") as string) || "").trim() || title;
  const startsAt = sanitizeIsoDate((formData.get("starts_at") as string) || null);
  const endsAt = sanitizeIsoDate((formData.get("ends_at") as string) || null);
  const expiresAt = sanitizeIsoDate(
    (formData.get("expires_at") as string) || null
  );

  return {
    title,
    slug: slugify(rawSlug) || "etkinlik",
    summary: (((formData.get("summary") as string) || title).trim()).slice(0, 160),
    description: (formData.get("description") as string) || null,
    event_type: sanitizeEventType(
      (formData.get("event_type") as EventType) || "duyuru",
      title
    ),
    source_name: (formData.get("source_name") as string) || null,
    source_url: (formData.get("source_url") as string) || null,
    ticket_url: (formData.get("ticket_url") as string) || null,
    city_slug: citySlug && citySlug !== "none" ? normalizeCitySlug(citySlug) : null,
    venue_name: (formData.get("venue_name") as string) || null,
    starts_at: startsAt,
    ends_at: endsAt,
    cover_image: (formData.get("cover_image") as string) || null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    is_featured:
      formData.get("is_featured") === "on" ||
      formData.get("is_featured") === "true",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10) || 0,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };
}

export async function createEvent(formData: FormData) {
  const data = eventFromForm(formData);
  const publishNow =
    formData.get("publish_now") === "on" ||
    formData.get("publish_now") === "true";

  const uniqueSlug = await ensureUniqueEventSlug(data.slug || data.title);
  const uniqueSourceUrl = await ensureUniqueSourceUrl(
    data.source_url,
    uniqueSlug
  );

  const storedCoverImage = await ensureStoredCoverImage(
    data.cover_image,
    "events",
    uniqueSlug
  );

  const { error } = await supabaseAdmin.from("cultural_events").insert({
    ...data,
    slug: uniqueSlug,
    source_url: uniqueSourceUrl,
    cover_image: storedCoverImage,
    status: publishNow ? "published" : "pending_review",
    published_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) throw new Error(error.message);

  revalidateEventPaths();
  redirect("/yonetim/etkinlikler");
}

export async function updateEvent(slug: string, formData: FormData) {
  const data = eventFromForm(formData);
  const existing = await getAdminEventBySlug(slug);
  const wantsPublished =
    formData.get("is_published") === "on" ||
    formData.get("is_published") === "true";

  const uniqueSlug = await ensureUniqueEventSlug(
    data.slug || slug,
    existing?.id
  );
  const uniqueSourceUrl = await ensureUniqueSourceUrl(
    data.source_url,
    uniqueSlug,
    existing?.id
  );

  const storedCoverImage = await ensureStoredCoverImage(
    data.cover_image,
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
      ...data,
      slug: uniqueSlug,
      source_url: uniqueSourceUrl,
      cover_image: storedCoverImage,
      ...statusUpdate,
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);

  revalidateEventPaths();
  if (existing?.status === "published" || statusUpdate.status === "published") {
    revalidatePath(`/etkinlik/${uniqueSlug}`);
  }
  redirect("/yonetim/etkinlikler");
}

export async function approveEvent(id: string) {
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
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
  redirect("/yonetim/etkinlikler");
}

export async function bulkUpdateEventsStatus(
  ids: string[],
  status: "published" | "pending_review" | "rejected"
) {
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
  if (!ids || ids.length === 0) return;
  const { error } = await supabaseAdmin
    .from("cultural_events")
    .delete()
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidateEventPaths();
}

export async function importEventFromUrlAction(rawUrl: string) {
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

    let rawCover = imported.cover_image || null;
    if (!rawCover) {
      rawCover = await resolveFallbackCulturalImage({
        title,
        cityName: getCityName(citySlug),
        category: "kultur_sanat",
      });
    }

    const storedCoverImage = await ensureStoredCoverImage(
      rawCover,
      "events",
      slug
    );

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
        summary: (imported.summary || title).slice(0, 160),
        description: imported.description || imported.summary || null,
        event_type: sanitizeEventType(imported.event_type, title),
        status: "pending_review",
        source_name: sourceName,
        source_url: url,
        ticket_url: imported.ticket_url || null,
        city_slug: citySlug,
        venue_name: imported.venue_name || null,
        starts_at: sanitizeIsoDate(imported.starts_at),
        ends_at: sanitizeIsoDate(imported.ends_at),
        cover_image: storedCoverImage,
        meta_title: (imported.meta_title || `${title} | Etkinlik Takvimi`).slice(0, 60),
        meta_description: (
          imported.meta_description ||
          imported.summary ||
          title
        ).slice(0, 155),
        raw_payload: { imported },
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
