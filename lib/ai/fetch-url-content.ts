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

function extractTitle(html: string): string | undefined {
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogMatch?.[1]) return decodeHtmlEntities(ogMatch[1].trim());

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1].trim()) : undefined;
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

export async function fetchUrlContent(
  url: string,
  options?: { maxTextLength?: number; userAgent?: string }
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
  const pageTitle = extractTitle(html);
  const imageUrls = extractPageImageUrls(html, url);
  const maxLength = options?.maxTextLength ?? 12000;
  const pageText = stripHtml(html).slice(0, maxLength);

  if (pageText.length < 80) {
    throw new Error("Sayfadan yeterli metin çıkarılamadı");
  }

  return { url, pageTitle, pageText, imageUrls };
}
