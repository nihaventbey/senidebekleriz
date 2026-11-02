import { parseKtbRssXml } from "@/lib/events/sources/ktb-rss";
import type { RawFeedItem } from "@/lib/events/types";
import { getCurrentQuarterInfo } from "@/lib/discovery/quarter";

export function buildGoogleNewsRssUrl(query: string, enforceQuarter = true): string {
  let finalQuery = query.trim();

  // If query doesn't specify a time operator, append active quarter boundary (e.g. after:2026-10-01)
  if (enforceQuarter && !/(\bafter:|\bwhen:|\bbefore:)/i.test(finalQuery)) {
    const qInfo = getCurrentQuarterInfo();
    finalQuery = `${finalQuery} after:${qInfo.startDateStr}`;
  }

  const q = encodeURIComponent(finalQuery);
  return `https://news.google.com/rss/search?q=${q}&hl=tr&gl=TR&ceid=TR:tr`;
}

export async function fetchGoogleNewsItems(
  query: string,
  sourceName: string,
  limit = 15
): Promise<RawFeedItem[]> {
  const feedUrl = buildGoogleNewsRssUrl(query);

  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "SeniDeBekleriz/1.0 (content discovery)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(25000),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS alınamadı: ${response.status}`);
  }

  const xml = await response.text();
  return parseKtbRssXml(xml, sourceName, limit);
}
