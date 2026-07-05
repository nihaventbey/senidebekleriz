export type DiscoverySourceType = "google_news_rss";

export type DiscoveryContentType = "event" | "article" | "unknown" | "skip";

export type DiscoveryStatus = "pending_review" | "imported" | "rejected";

export type DiscoverySourceRow = {
  id: string;
  name: string;
  source_type: DiscoverySourceType;
  query_or_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
};

export type DiscoveredContentRow = {
  id: string;
  title: string;
  source_url: string;
  source_name: string | null;
  snippet: string | null;
  content_type: DiscoveryContentType;
  status: DiscoveryStatus;
  target_table: string | null;
  target_id: string | null;
  cover_image: string | null;
  city_slug: string | null;
  published_at_source: string | null;
  raw_payload: Record<string, unknown> | null;
  discovered_at: string;
  updated_at: string;
};

export type ClassifiedDiscovery = {
  content_type: "event" | "article" | "skip";
  city_slug: string | null;
  confidence: number;
};

export type DiscoverContentResult = {
  sourcesProcessed: number;
  itemsFetched: number;
  itemsInserted: number;
  itemsSkipped: number;
  errors: string[];
};
