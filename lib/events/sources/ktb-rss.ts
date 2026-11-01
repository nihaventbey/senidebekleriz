import type { RawFeedItem } from "@/lib/events/types";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

export function stripHtmlTags(html: string): string {
  if (!html) return "";
  // Decode entities first so encoded tags (&lt;a ...&gt;) become inspectable
  let text = decodeEntities(html);
  // Strip script, style, and HTML tags
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  // Second pass in case of double entity encoding (&amp;lt;a&gt;)
  if (text.includes("&lt;") || text.includes("&gt;") || text.includes("&amp;")) {
    text = decodeEntities(text).replace(/<[^>]+>/g, " ");
  }

  return text.replace(/\s+/g, " ").trim();
}

function stripTags(html: string): string {
  return stripHtmlTags(html);
}

function getTag(block: string, tag: string): string {
  const cdata = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const cdataMatch = block.match(cdata);
  if (cdataMatch) return stripTags(cdataMatch[1]);

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
