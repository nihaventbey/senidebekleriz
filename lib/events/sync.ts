import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { normalizeFeedItem } from "@/lib/ai/normalize-event";
import {
  eventSourceUrlExists,
  rejectedSourceUrlExists,
} from "@/lib/events/dedupe";
import { fetchKtbRssItems } from "@/lib/events/sources/ktb-rss";
import type { FeedSourceRow } from "@/lib/events/types";
import { uniqueEventSlug } from "@/lib/events/slug";
import { uploadEventImagesFromUrls } from "@/lib/storage/upload-image-from-url";

async function getActiveFeedSources(): Promise<FeedSourceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("event_feed_sources")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("getActiveFeedSources error:", error.message);
    return [];
  }

  return (data || []) as FeedSourceRow[];
}

async function insertPendingEvent(input: {
  title: string;
  slug: string;
  summary: string;
  event_type: string;
  source_name: string;
  source_url: string;
  city_slug: string | null;
  venue_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  cover_image?: string | null;
  raw_payload: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("cultural_events").insert({
    ...input,
    status: "pending_review",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }

  return true;
}

async function importEventCoverImage(input: {
  sourceUrl: string;
  slug: string;
}): Promise<{ coverImage: string | null; imageUrls: string[] }> {
  try {
    const page = await fetchUrlContent(input.sourceUrl, {
      maxTextLength: 1000,
      userAgent: "SeniDeBekleriz/1.0 (cultural events aggregator)",
    });

    const media = await uploadEventImagesFromUrls(page.imageUrls, input.slug);

    return {
      coverImage: media.coverImage,
      imageUrls: media.uploadedImages,
    };
  } catch (error) {
    console.error(
      "importEventCoverImage error:",
      error instanceof Error ? error.message : error
    );
    return { coverImage: null, imageUrls: [] };
  }
}

export type SyncEventsResult = {
  sourcesProcessed: number;
  itemsFetched: number;
  itemsQueued: number;
  itemsSkipped: number;
  errors: string[];
};

export async function syncCulturalEvents(): Promise<SyncEventsResult> {
  const result: SyncEventsResult = {
    sourcesProcessed: 0,
    itemsFetched: 0,
    itemsQueued: 0,
    itemsSkipped: 0,
    errors: [],
  };

  const sources = await getActiveFeedSources();

  for (const source of sources) {
    result.sourcesProcessed += 1;

    try {
      const items = await fetchKtbRssItems(source.feed_url, source.name);
      result.itemsFetched += items.length;

      for (const item of items) {
        try {
          if (await eventSourceUrlExists(item.link)) {
            result.itemsSkipped += 1;
            continue;
          }

          if (await rejectedSourceUrlExists(item.link)) {
            result.itemsSkipped += 1;
            continue;
          }

          const normalized = await normalizeFeedItem(item);

          if (!normalized.is_cultural_event || normalized.confidence < 0.4) {
            result.itemsSkipped += 1;
            continue;
          }

          const slug = uniqueEventSlug(normalized.title);
          const media = await importEventCoverImage({
            sourceUrl: item.link,
            slug,
          });

          const inserted = await insertPendingEvent({
            title: normalized.title,
            slug,
            summary: normalized.summary,
            event_type: normalized.event_type,
            source_name: item.sourceName,
            source_url: item.link,
            city_slug: normalized.city_slug,
            venue_name: normalized.venue_name,
            starts_at: normalized.starts_at,
            ends_at: normalized.ends_at,
            cover_image: media.coverImage,
            raw_payload: { rss: item, normalized, images: media.imageUrls },
          });

          if (inserted) {
            result.itemsQueued += 1;
          } else {
            result.itemsSkipped += 1;
          }
        } catch (itemError) {
          result.errors.push(
            `${item.link}: ${itemError instanceof Error ? itemError.message : "hata"}`
          );
        }
      }

      await supabaseAdmin
        .from("event_feed_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);
    } catch (sourceError) {
      result.errors.push(
        `${source.name}: ${sourceError instanceof Error ? sourceError.message : "hata"}`
      );
    }
  }

  return result;
}
