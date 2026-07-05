import { classifyDiscoveryItem } from "@/lib/discovery/classify-content";
import {
  discoverySourceUrlExists,
  rejectedDiscoveryUrlExists,
} from "@/lib/discovery/dedupe";
import {
  cleanGoogleNewsTitle,
  isGoogleNewsArticleUrl,
  resolvePublisherUrl,
} from "@/lib/discovery/resolve-google-news-url";
import { fetchGoogleNewsItems } from "@/lib/discovery/sources/google-news-rss";
import type {
  DiscoverContentResult,
  DiscoverySourceRow,
} from "@/lib/discovery/types";
import { eventSourceUrlExists } from "@/lib/events/dedupe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_NEW_ITEMS_PER_RUN = 25;
const MIN_CONFIDENCE = 0.55;
const RESOLVE_DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getActiveDiscoverySources(): Promise<DiscoverySourceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("discovery_sources")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("getActiveDiscoverySources error:", error.message);
    return [];
  }

  return (data || []) as DiscoverySourceRow[];
}

function parsePubDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function insertDiscoveredItem(input: {
  title: string;
  source_url: string;
  source_name: string;
  snippet: string;
  content_type: string;
  city_slug: string | null;
  published_at_source: string | null;
  raw_payload: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await supabaseAdmin.from("discovered_content").insert({
    ...input,
    status: input.content_type === "skip" ? "rejected" : "pending_review",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }

  return true;
}

async function isDuplicateUrl(sourceUrl: string, googleNewsUrl?: string) {
  if (await discoverySourceUrlExists(sourceUrl)) return true;
  if (await eventSourceUrlExists(sourceUrl)) return true;
  if (await rejectedDiscoveryUrlExists(sourceUrl)) return true;

  if (googleNewsUrl && googleNewsUrl !== sourceUrl) {
    if (await discoverySourceUrlExists(googleNewsUrl)) return true;
    if (await rejectedDiscoveryUrlExists(googleNewsUrl)) return true;
  }

  return false;
}

export async function discoverContent(): Promise<DiscoverContentResult> {
  const sources = await getActiveDiscoverySources();
  const result: DiscoverContentResult = {
    sourcesProcessed: 0,
    itemsFetched: 0,
    itemsInserted: 0,
    itemsSkipped: 0,
    errors: [],
  };

  let insertedThisRun = 0;

  for (const source of sources) {
    if (insertedThisRun >= MAX_NEW_ITEMS_PER_RUN) break;

    result.sourcesProcessed += 1;

    try {
      const items = await fetchGoogleNewsItems(
        source.query_or_url,
        source.name,
        12
      );
      result.itemsFetched += items.length;

      for (const item of items) {
        if (insertedThisRun >= MAX_NEW_ITEMS_PER_RUN) break;

        const googleNewsUrl = item.link.trim();
        if (!googleNewsUrl) {
          result.itemsSkipped += 1;
          continue;
        }

        let sourceUrl = googleNewsUrl;
        if (isGoogleNewsArticleUrl(googleNewsUrl)) {
          sourceUrl = await resolvePublisherUrl(googleNewsUrl);
          if (RESOLVE_DELAY_MS > 0) {
            await sleep(RESOLVE_DELAY_MS);
          }
        }

        if (await isDuplicateUrl(sourceUrl, googleNewsUrl)) {
          result.itemsSkipped += 1;
          continue;
        }

        const publisherName = item.publisherName || undefined;
        const displayTitle = cleanGoogleNewsTitle(item.title, publisherName);

        try {
          const classified = await classifyDiscoveryItem({
            title: displayTitle,
            snippet: item.description,
            sourceName: publisherName || item.sourceName,
          });

          if (
            classified.content_type === "skip" ||
            classified.confidence < MIN_CONFIDENCE
          ) {
            result.itemsSkipped += 1;
            continue;
          }

          const inserted = await insertDiscoveredItem({
            title: displayTitle,
            source_url: sourceUrl,
            source_name: publisherName || item.sourceName,
            snippet: item.description.slice(0, 500),
            content_type: classified.content_type,
            city_slug: classified.city_slug,
            published_at_source: parsePubDate(item.pubDate),
            raw_payload: {
              feed_source_id: source.id,
              query: source.query_or_url,
              confidence: classified.confidence,
              pubDate: item.pubDate,
              google_news_url: googleNewsUrl,
              publisher_site: item.publisherSite,
            },
          });

          if (inserted) {
            result.itemsInserted += 1;
            insertedThisRun += 1;
          } else {
            result.itemsSkipped += 1;
          }
        } catch (itemError) {
          result.errors.push(
            `${displayTitle.slice(0, 40)}: ${
              itemError instanceof Error ? itemError.message : "sınıflandırma hatası"
            }`
          );
          result.itemsSkipped += 1;
        }
      }

      await supabaseAdmin
        .from("discovery_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);
    } catch (sourceError) {
      result.errors.push(
        `${source.name}: ${
          sourceError instanceof Error ? sourceError.message : "kaynak hatası"
        }`
      );
    }
  }

  return result;
}
