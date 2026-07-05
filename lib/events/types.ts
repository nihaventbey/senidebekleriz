export type EventType =
  | "tiyatro"
  | "konser"
  | "sergi"
  | "festival"
  | "duyuru"
  | "diger";

export type EventStatus =
  | "pending_review"
  | "published"
  | "rejected"
  | "expired";

export type RawFeedItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  sourceName: string;
  publisherName?: string;
  publisherSite?: string;
};

export type NormalizedEventDraft = {
  title: string;
  summary: string;
  event_type: EventType;
  city_slug: string | null;
  venue_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_cultural_event: boolean;
  confidence: number;
};

export type FeedSourceRow = {
  id: string;
  name: string;
  source_type: string;
  feed_url: string;
  is_active: boolean;
  sync_interval_hours: number;
  last_synced_at: string | null;
};

export type CulturalEventRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  event_type: EventType;
  status: EventStatus;
  source_name: string | null;
  source_url: string | null;
  ticket_url: string | null;
  city_slug: string | null;
  venue_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  cover_image: string | null;
  is_featured: boolean;
  sort_order: number;
  raw_payload: Record<string, unknown> | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
