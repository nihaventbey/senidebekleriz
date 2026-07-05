import { parseKtbRssXml } from "@/lib/events/sources/ktb-rss";
import type { RawFeedItem } from "@/lib/events/types";

export function buildGoogleNewsRssUrl(query: string): string {
  const q = encodeURIComponent(query);
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
