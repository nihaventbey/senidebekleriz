import type { RawFeedItem } from "@/lib/events/types";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function getTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = block.match(cdata);
  if (cdataMatch) return decodeEntities(cdataMatch[1]);

  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const plainMatch = block.match(plain);
  return plainMatch ? stripTags(plainMatch[1]) : "";
}

function getSourceBlock(block: string): { url?: string; name?: string } {
  const match = block.match(
    /<source(?:\s+url=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/source>/i
  );
  if (!match) return {};

  return {
    url: match[1] || undefined,
    name: match[2] ? stripTags(match[2]) : undefined,
  };
}

export function parseKtbRssXml(
  xml: string,
  sourceName: string,
  limit = 20
): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];

  for (const block of matches.slice(0, limit)) {
    const title = getTag(block, "title");
    const link = getTag(block, "link");
    const description =
      getTag(block, "description") || getTag(block, "content:encoded");
    const pubDate = getTag(block, "pubDate") || getTag(block, "dc:date");
    const publisher = getSourceBlock(block);

    if (!title || !link) continue;

    items.push({
      title,
      link,
      description: description.slice(0, 3000),
      pubDate: pubDate || undefined,
      sourceName,
      publisherName: publisher.name,
      publisherSite: publisher.url,
    });
  }

  return items;
}

export async function fetchKtbRssItems(
  feedUrl: string,
  sourceName: string,
  limit = 20
): Promise<RawFeedItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "SeniDeBekleriz/1.0 (RSS reader)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(20000),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`RSS alınamadı (${feedUrl}): ${response.status}`);
  }

  const xml = await response.text();
  return parseKtbRssXml(xml, sourceName, limit);
}
