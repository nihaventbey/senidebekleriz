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

export function sortEventsByClosestUpcoming(events: PublicEvent[]): PublicEvent[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  return [...events].sort((a, b) => {
    const timeA = a.startsAt ? new Date(a.startsAt).getTime() : null;
    const timeB = b.startsAt ? new Date(b.startsAt).getTime() : null;

    const isUpcomingA = timeA !== null && timeA >= todayStartMs;
    const isUpcomingB = timeB !== null && timeB >= todayStartMs;

    // 1. Both are upcoming: closest future date first (ascending)
    if (isUpcomingA && isUpcomingB) {
      return (timeA as number) - (timeB as number);
    }
    // 2. Upcoming event comes before past/null event
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;

    // 3. If neither is upcoming: most recent past event first
    if (timeA !== null && timeB !== null) {
      return timeB - timeA;
    }
    if (timeA !== null) return -1;
    if (timeB !== null) return 1;

    return 0;
  });
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
    .order("published_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    console.error("getFeaturedEvents error:", error.message);
    return [];
  }

  const rows = (data || []) as CulturalEventRow[];
  const mapped = rows.map(mapEvent);

  const featured = mapped.filter((r) => r.isFeatured);
  const rest = mapped.filter((r) => !r.isFeatured);

  const sortedFeatured = sortEventsByClosestUpcoming(featured);
  const sortedRest = sortEventsByClosestUpcoming(rest);

  return [...sortedFeatured, ...sortedRest].slice(0, limit);
}

export async function getPublishedEvents(options?: {
  citySlug?: string;
  eventType?: EventType;
  limit?: number;
}): Promise<PublicEvent[]> {
  let query = publishedFilter()
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

  const mapped = ((data || []) as CulturalEventRow[]).map(mapEvent);
  return sortEventsByClosestUpcoming(mapped);
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
