import {
  getCurrentQuarterInfo,
  isDateInActiveQuarter,
  hasPastYearInTitle,
  hasPastDateInText,
  type QuarterInfo,
} from "@/lib/discovery/quarter";
import {
  classifyDiscoveryBatch,
  isRejectedNonTurkishOrCommercialContent,
  type BatchClassifyInput,
} from "@/lib/discovery/classify-content";
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
import { fetchKtbRssItems, stripHtmlTags } from "@/lib/events/sources/ktb-rss";
import type { RawFeedItem } from "@/lib/events/types";
import type {
  DiscoverContentResult,
  DiscoverySourceRow,
} from "@/lib/discovery/types";
import { eventSourceUrlExists } from "@/lib/events/dedupe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_NEW_ITEMS_PER_RUN = 35;
const MIN_CONFIDENCE = 0.55;
const ITEMS_PER_SOURCE = 8;
const MAX_CLASSIFY_BATCH = 6;

async function getActiveDiscoverySources(): Promise<DiscoverySourceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("discovery_sources")
    .select("*")
    .eq("is_active", true)
    .order("source_type", { ascending: true }); // Prioritize direct 'rss' feeds first

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
  cover_image: string | null;
  published_at_source: string | null;
  raw_payload: Record<string, unknown>;
}): Promise<boolean> {
  const payloadToInsert = {
    ...input,
    status: input.content_type === "skip" ? "rejected" : "pending_review",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("discovered_content")
    .insert(payloadToInsert);

  if (error) {
    if (error.code === "23505") return false; // Duplicate source_url
    if (error.code === "23514" && input.content_type === "news") {
      const fallbackPayload = {
        ...payloadToInsert,
        content_type: "article",
        raw_payload: {
          ...input.raw_payload,
          inferred_content_type: "news",
        },
      };
      const { error: retryError } = await supabaseAdmin
        .from("discovered_content")
        .insert(fallbackPayload);
      if (!retryError) return true;
      if (retryError.code === "23505") return false;
      throw new Error(retryError.message);
    }
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

async function cleanupOutdatedPendingDiscoveries(quarterInfo: QuarterInfo) {
  try {
    // 1. Mark pending items published before the active quarter start as rejected
    await supabaseAdmin
      .from("discovered_content")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending_review")
      .lt("published_at_source", quarterInfo.startDateStr);

    // 2. Reject pending items that mention past years or non-Turkish/commercial content
    const { data: pendingItems } = await supabaseAdmin
      .from("discovered_content")
      .select("id, title, snippet, source_url, source_name")
      .eq("status", "pending_review");

    if (pendingItems) {
      const rejectIds = pendingItems
        .filter(
          (it) =>
            hasPastYearInTitle(it.title, quarterInfo.year) ||
            hasPastDateInText(`${it.title} ${it.snippet || ""}`) ||
            isRejectedNonTurkishOrCommercialContent({
              title: it.title,
              snippet: it.snippet || undefined,
              sourceUrl: it.source_url,
              sourceName: it.source_name || undefined,
            })
        )
        .map((it) => it.id);

      if (rejectIds.length > 0) {
        await supabaseAdmin
          .from("discovered_content")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .in("id", rejectIds);
      }
    }
  } catch (err) {
    console.warn("cleanupOutdatedPendingDiscoveries skipped:", err);
  }
}

export async function discoverContent(): Promise<DiscoverContentResult> {
  const quarterInfo = getCurrentQuarterInfo();
  await cleanupOutdatedPendingDiscoveries(quarterInfo);

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
      let rawItems: RawFeedItem[] = [];
      const isDirectRss = source.source_type === "rss";

      if (isDirectRss) {
        rawItems = await fetchKtbRssItems(
          source.query_or_url,
          source.name,
          ITEMS_PER_SOURCE
        );
      } else {
        rawItems = await fetchGoogleNewsItems(
          source.query_or_url,
          source.name,
          ITEMS_PER_SOURCE
        );
      }

      result.itemsFetched += rawItems.length;

      type PreparedCandidate = {
        item: RawFeedItem;
        sourceUrl: string;
        googleNewsUrl?: string;
        displayTitle: string;
        publisherName?: string;
      };

      const candidates: PreparedCandidate[] = [];

      for (const item of rawItems) {
        if (insertedThisRun + candidates.length >= MAX_NEW_ITEMS_PER_RUN) break;

        const rawUrl = item.link.trim();
        if (!rawUrl) {
          result.itemsSkipped += 1;
          continue;
        }

        // Active Quarter check: Skip past years or dates before current quarter
        if (hasPastYearInTitle(item.title, quarterInfo.year)) {
          result.itemsSkipped += 1;
          continue;
        }
        if (hasPastDateInText(`${item.title} ${item.description || ""}`)) {
          result.itemsSkipped += 1;
          continue;
        }
        if (!isDateInActiveQuarter(item.pubDate)) {
          result.itemsSkipped += 1;
          continue;
        }

        // Reject obvious non-Turkish or commercial painting sales pages early
        if (
          isRejectedNonTurkishOrCommercialContent({
            title: item.title,
            snippet: item.description,
            sourceUrl: rawUrl,
            sourceName: item.publisherName || item.sourceName,
          })
        ) {
          result.itemsSkipped += 1;
          continue;
        }

        // Quick check before resolving
        if (await isDuplicateUrl(rawUrl)) {
          result.itemsSkipped += 1;
          continue;
        }

        let sourceUrl = rawUrl;
        const isGNews = !isDirectRss && isGoogleNewsArticleUrl(rawUrl);

        if (isGNews) {
          try {
            sourceUrl = await resolvePublisherUrl(rawUrl);
          } catch {
            sourceUrl = rawUrl;
          }
          if (await isDuplicateUrl(sourceUrl, rawUrl)) {
            result.itemsSkipped += 1;
            continue;
          }
        }

        const publisherName = item.publisherName || undefined;
        const displayTitle = isGNews
          ? cleanGoogleNewsTitle(item.title, publisherName)
          : item.title.trim();

        if (
          isRejectedNonTurkishOrCommercialContent({
            title: displayTitle,
            snippet: item.description,
            sourceUrl,
            sourceName: publisherName || item.sourceName,
          })
        ) {
          result.itemsSkipped += 1;
          continue;
        }

        candidates.push({
          item,
          sourceUrl,
          googleNewsUrl: isGNews ? rawUrl : undefined,
          displayTitle,
          publisherName,
        });

        if (candidates.length >= MAX_CLASSIFY_BATCH) break;
      }

      if (candidates.length === 0) {
        continue;
      }

      // Batch classify using Gemini in a single prompt
      const batchInput: BatchClassifyInput[] = candidates.map((c, index) => ({
        id: index,
        title: c.displayTitle,
        snippet: stripHtmlTags(c.item.description).slice(0, 500),
        sourceName: c.publisherName || c.item.sourceName,
        sourceUrl: c.sourceUrl,
      }));

      const classifications = await classifyDiscoveryBatch(batchInput);

      for (let i = 0; i < candidates.length; i++) {
        if (insertedThisRun >= MAX_NEW_ITEMS_PER_RUN) break;

        const cand = candidates[i];
        const classified = classifications.get(i);

        if (
          !classified ||
          classified.content_type === "skip" ||
          classified.confidence < MIN_CONFIDENCE
        ) {
          result.itemsSkipped += 1;
          continue;
        }

        try {
          const inserted = await insertDiscoveredItem({
            title: cand.displayTitle,
            source_url: cand.sourceUrl,
            source_name: cand.publisherName || cand.item.sourceName,
            snippet: stripHtmlTags(cand.item.description).slice(0, 500),
            content_type: classified.content_type,
            city_slug: classified.city_slug,
            cover_image: cand.item.imageUrl || null,
            published_at_source: parsePubDate(cand.item.pubDate),
            raw_payload: {
              feed_source_id: source.id,
              query: source.query_or_url,
              confidence: classified.confidence,
              pubDate: cand.item.pubDate,
              google_news_url: cand.googleNewsUrl,
              publisher_site: cand.item.publisherSite,
              image_url: cand.item.imageUrl || null,
            },
          });

          if (inserted) {
            result.itemsInserted += 1;
            insertedThisRun += 1;
          } else {
            result.itemsSkipped += 1;
          }
        } catch (insertErr) {
          result.errors.push(
            `${cand.displayTitle.slice(0, 35)}: ${
              insertErr instanceof Error ? insertErr.message : "Kayıt hatası"
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
