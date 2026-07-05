import { getCityName } from "@/lib/cities/lookup";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CulturalEventRow, EventType } from "@/lib/events/types";

export type PublicEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  eventType: EventType;
  sourceName: string | null;
  sourceUrl: string | null;
  ticketUrl: string | null;
  citySlug: string | null;
  cityName: string | null;
  venueName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  publishedAt: string | null;
};

function mapEvent(row: CulturalEventRow): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary || row.title,
    description: row.description,
    eventType: row.event_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    ticketUrl: row.ticket_url,
    citySlug: row.city_slug,
    cityName: getCityName(row.city_slug),
    venueName: row.venue_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    coverImage: row.cover_image,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
  };
}

function publishedFilter() {
  const now = new Date().toISOString();
  return supabaseAdmin
    .from("cultural_events")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`);
}

export async function getFeaturedEvents(limit = 8): Promise<PublicEvent[]> {
  const { data, error } = await publishedFilter()
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(limit * 2);

  if (error) {
    console.error("getFeaturedEvents error:", error.message);
    return [];
  }

  const rows = (data || []) as CulturalEventRow[];
  const featured = rows.filter((r) => r.is_featured);
  const rest = rows.filter((r) => !r.is_featured);
  const merged = [...featured, ...rest].slice(0, limit);

  return merged.map(mapEvent);
}

export async function getPublishedEvents(options?: {
  citySlug?: string;
  eventType?: EventType;
  limit?: number;
}): Promise<PublicEvent[]> {
  let query = publishedFilter()
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false });

  if (options?.citySlug) {
    query = query.eq("city_slug", options.citySlug);
  }

  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPublishedEvents error:", error.message);
    return [];
  }

  return ((data || []) as CulturalEventRow[]).map(mapEvent);
}

export async function getPublishedEventSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("cultural_events")
    .select("slug, updated_at")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    console.error("getPublishedEventSlugs error:", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}

export async function getEventBySlug(
  slug: string
): Promise<PublicEvent | undefined> {
  const { data, error } = await publishedFilter()
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapEvent(data as CulturalEventRow);
}
