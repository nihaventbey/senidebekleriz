import { extractPageImageUrls } from "@/lib/ai/extract-page-images";

export type FetchedUrlContent = {
  url: string;
  pageTitle?: string;
  pageText: string;
  imageUrls: string[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMetaContent(
  html: string,
  attr: "property" | "name",
  value: string
): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${value}["'][^>]+content="([^"]*)"`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+${attr}=["']${value}["'][^>]+content='([^']*)'`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content="([^"]*)"[^>]+${attr}=["']${value}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content='([^']*)'[^>]+${attr}=["']${value}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim());
    }
  }

  return undefined;
}

function extractJsonLdText(html: string): string {
  const blocks =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ) || [];

  const parts: string[] = [];

  for (const block of blocks) {
    const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i);
    if (!jsonMatch?.[1]) continue;

    try {
      const parsed = JSON.parse(jsonMatch[1].trim()) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const record = node as Record<string, unknown>;
        for (const key of ["articleBody", "description", "headline"]) {
          const value = record[key];
          if (typeof value === "string" && value.trim()) {
            parts.push(decodeHtmlEntities(value.replace(/\s+/g, " ").trim()));
          }
        }
      }
    } catch {
      // JSON-LD parse hatası — sessizce atla
    }
  }

  return parts.join("\n\n");
}

export function extractPageTextFromHtml(html: string, maxLength = 12000): string {
  const chunks = [
    stripHtml(html),
    extractMetaContent(html, "property", "og:description"),
    extractMetaContent(html, "name", "description"),
    extractMetaContent(html, "name", "twitter:description"),
    extractJsonLdText(html),
  ].filter((part): part is string => Boolean(part && part.trim()));

  const unique = [...new Set(chunks)];
  return unique.join("\n\n").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function extractTitle(html: string): string | undefined {
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogMatch?.[1]) return decodeHtmlEntities(ogMatch[1].trim());

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1].trim()) : undefined;
}

function mergeTextParts(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchUrlContent(
  url: string,
  options?: {
    maxTextLength?: number;
    userAgent?: string;
    fallbackText?: string;
    minTextLength?: number;
  }
): Promise<FetchedUrlContent> {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Geçersiz URL");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        options?.userAgent ||
        "SeniDeBekleriz/1.0 (content research; admin draft)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Sayfa alınamadı: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml")
  ) {
    throw new Error("URL HTML sayfası döndürmedi");
  }

  const html = await response.text();
  const resolvedUrl = response.url || url;
  const pageTitle = extractTitle(html);
  const imageUrls = extractPageImageUrls(html, resolvedUrl);
  const maxLength = options?.maxTextLength ?? 12000;
  const pageText = mergeTextParts(
    extractPageTextFromHtml(html, maxLength),
    options?.fallbackText
  ).slice(0, maxLength);

  const minLength = options?.minTextLength ?? 80;
  if (pageText.length < minLength) {
    throw new Error("Sayfadan yeterli metin çıkarılamadı");
  }

  return { url: resolvedUrl, pageTitle, pageText, imageUrls };
}

export function buildTextFromFallback(input: {
  title?: string | null;
  text?: string | null;
}): string {
  return mergeTextParts(input.title || undefined, input.text || undefined);
}
