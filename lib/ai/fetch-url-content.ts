import { extractPageImageUrls, BROWSER_USER_AGENT } from "@/lib/ai/extract-page-images";

export type FetchedUrlContent = {
  url: string;
  pageTitle?: string;
  pageText: string;
  imageUrls: string[];
};

export function decodeHtmlEntities(text: string): string {
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
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/&bull;/g, "•")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&icirc;/g, "î")
    .replace(/&Icirc;/g, "Î")
    .replace(/&acirc;/g, "â")
    .replace(/&Acirc;/g, "Â")
    .replace(/&ucirc;/g, "û")
    .replace(/&Ucirc;/g, "Û")
    .replace(/&scedil;/g, "ş")
    .replace(/&Scedil;/g, "Ş")
    .replace(/&gbreve;/g, "ğ")
    .replace(/&Gbreve;/g, "Ğ")
    .replace(/&Idot;/g, "İ")
    .replace(/&imath;/g, "ı")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16));
      } catch {
        return "";
      }
    });
}

function stripNonContentElements(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");
}

function stripHtml(html: string): string {
  const cleaned = stripNonContentElements(html);
  return decodeHtmlEntities(cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractArticleParagraphs(html: string): string[] {
  const cleaned = stripNonContentElements(html);

  // Try to find targeted article content container first
  const containerPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class=["'][^"']*(?:article-body|news-content|entry-content|detail-content|haber-metni|icerik-detay|post-content|news-detail|content-text|story-body|article__content|article-text|haber-detay)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  let targetHtml = cleaned;
  for (const pattern of containerPatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1] && match[1].length > 300) {
      targetHtml = match[1];
      break;
    }
  }

  // Extract <p> tags
  const pMatches = [...targetHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const paragraphs: string[] = [];

  for (const match of pMatches) {
    const text = decodeHtmlEntities(
      match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    // Ignore cookie banners, share prompts, short boilerplate (<30 chars)
    if (
      text.length >= 30 &&
      !/^paylaş|fotoğraf:|yazar:|yorumlar|copyright|tüm hakları/i.test(text)
    ) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
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

export function extractPageTextFromHtml(html: string, maxLength = 16000): string {
  const articleParagraphs = extractArticleParagraphs(html);
  const jsonLd = extractJsonLdText(html);
  const ogDescription = extractMetaContent(html, "property", "og:description");
  const metaDescription = extractMetaContent(html, "name", "description");

  // If we have clean article paragraphs (>100 chars), prioritize them
  if (articleParagraphs.length > 0 && articleParagraphs.join(" ").length >= 100) {
    const paragraphsText = articleParagraphs.join("\n\n");
    const chunks = [
      paragraphsText,
      ogDescription,
      metaDescription,
      jsonLd,
    ].filter((p): p is string => Boolean(p && p.trim()));

    const unique = [...new Set(chunks)];
    return unique.join("\n\n").trim().slice(0, maxLength);
  }

  // Fallback: general stripped HTML with headers/nav removed
  const chunks = [
    stripHtml(html),
    ogDescription,
    metaDescription,
    jsonLd,
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
        options?.userAgent || BROWSER_USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-Ch-Ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    signal: AbortSignal.timeout(15000),
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
