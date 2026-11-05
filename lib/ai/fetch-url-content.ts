import {
  extractPageImageUrls,
  BROWSER_USER_AGENT,
} from "@/lib/ai/extract-page-images";

export type FetchedUrlContent = {
  url: string;
  pageTitle?: string;
  pageText: string;
  imageUrls: string[];
  siteName?: string;
};

const SOCIAL_BOT_USER_AGENT =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

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

function isBoilerplateParagraph(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Email-only or phone/fax/copyright lines
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return true;
  if (/»/.test(t) && t.length < 180) return true;
  if (
    /^(paylaş|fotoğraf:|yazar:|yorumlar|copyright|tüm hakları|çerez politikası|bizi takip edin|ilgili haberler|etiketler\s*:|künye|yeni sayımız bayilerde|yazarlar\s+haberler)/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /(künye\s*©|tüm hakları saklıdır|demirören medya|turkuvaz medya|izinsiz kullanılamaz|tel:\s*\+?\d|faks:\s*\+?\d|yazarlar\s+haberler\s+milliyet)/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function stripHtml(html: string): string {
  const cleaned = stripNonContentElements(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)>/gi, "\n\n");

  const decoded = decodeHtmlEntities(cleaned.replace(/<[^>]+>/g, " "));
  const lines = decoded
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 35 && !isBoilerplateParagraph(line));

  return lines.join("\n\n");
}

function extractArticleParagraphs(html: string): string[] {
  const cleaned = stripNonContentElements(html);

  // Try to find targeted article content container first
  const containerPatterns = [
    /<div[^>]+class=["'][^"']*hDetay[^"']*["'][^>]*>([\s\S]*?)(?:<div[^>]+class=["'][^"']*(?:etiketler|fbYorum)|<\/body>)/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class=["'][^"']*(?:article-body|news-content|entry-content|detail-content|haber-metni|icerik-detay|post-content|news-detail|content-text|story-body|article__content|article-text|haber-detay|detay-icerik|yazi-detay)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  let targetHtml = cleaned;
  let matchedTargetedContainer = false;
  for (const pattern of containerPatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1] && match[1].length > 300) {
      targetHtml = match[1];
      matchedTargetedContainer = true;
      break;
    }
  }

  // Extract <p>, <h2>, <h3>, <h4>, <li> blocks in order
  const blockMatches = [
    ...targetHtml.matchAll(/<(p|h2|h3|h4|li)\b[^>]*>([\s\S]*?)<\/\1>/gi),
  ];
  const paragraphs: string[] = [];

  for (const match of blockMatches) {
    const tag = match[1].toLowerCase();
    const text = decodeHtmlEntities(
      match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    const minLen = tag.startsWith("h") ? 12 : 30;
    if (text.length >= minLen && !isBoilerplateParagraph(text)) {
      paragraphs.push(text);
    }
  }

  // Some publishers (e.g. milliyetsanat.com) use <div> or <br> inside the article container instead of <p>
  if (paragraphs.join(" ").length < 200 && matchedTargetedContainer) {
    const blockSeparated = targetHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|strong|h[1-6]|li|blockquote)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ");
    const divLines = decodeHtmlEntities(blockSeparated)
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length >= 35 && !isBoilerplateParagraph(line));
    if (divLines.length > 0) {
      return divLines;
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

function deduplicateBlocks(blocks: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of blocks) {
    const trimmed = raw.replace(/\s+/g, " ").trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
    if (key.length < 8) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function extractPageTextFromHtml(
  html: string,
  maxLength = 16000
): string {
  const articleParagraphs = deduplicateBlocks(extractArticleParagraphs(html));
  const jsonLd = extractJsonLdText(html);
  const ogDescription = extractMetaContent(html, "property", "og:description");
  const metaDescription = extractMetaContent(html, "name", "description");

  // If we have clean article paragraphs (>100 chars), prioritize them and deduplicate against meta/jsonLd
  if (
    articleParagraphs.length > 0 &&
    articleParagraphs.join(" ").length >= 100
  ) {
    const combinedBlocks = deduplicateBlocks([
      ogDescription || "",
      metaDescription || "",
      ...articleParagraphs,
      ...jsonLd.split(/\n{2,}/),
    ]);

    return combinedBlocks.join("\n\n").trim().slice(0, maxLength);
  }

  // Fallback: general stripped HTML with headers/nav removed
  const chunks = deduplicateBlocks([
    ogDescription || "",
    metaDescription || "",
    ...jsonLd.split(/\n{2,}/),
    stripHtml(html),
  ]);

  return chunks
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function extractTitle(html: string): string | undefined {
  const ogTitle =
    extractMetaContent(html, "property", "og:title") ||
    extractMetaContent(html, "name", "twitter:title");
  if (ogTitle && ogTitle.length >= 6) return ogTitle;

  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const cleanedH1 = decodeHtmlEntities(
      h1Match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cleanedH1.length >= 6) return cleanedH1;
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]
    ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim())
    : undefined;
}

function extractSiteName(html: string, pageUrl: string): string | undefined {
  const ogSite =
    extractMetaContent(html, "property", "og:site_name") ||
    extractMetaContent(html, "name", "application-name");
  if (ogSite && ogSite.trim().length >= 2) {
    return ogSite.trim();
  }
  try {
    const host = new URL(pageUrl).hostname.replace(/^www\./i, "");
    const knownHosts: Record<string, string> = {
      "cumhuriyet.com.tr": "Cumhuriyet",
      "aa.com.tr": "Anadolu Ajansı",
      "dha.com.tr": "Demirören Haber Ajansı",
      "trthaber.com": "TRT Haber",
      "ntv.com.tr": "NTV",
      "haberturk.com": "Habertürk",
      "hurriyet.com.tr": "Hürriyet",
      "milliyet.com.tr": "Milliyet",
      "milliyetsanat.com": "Milliyet Sanat",
      "sozcu.com.tr": "Sözcü",
      "birgun.net": "BirGün",
      "diken.com.tr": "Diken",
      "gazeteduvar.com.tr": "Gazete Duvar",
      "t24.com.tr": "T24",
      "bianet.org": "Bianet",
      "tr.euronews.com": "Euronews Türkçe",
      "kulturportali.gov.tr": "Türkiye Kültür Portalı",
      "ktb.gov.tr": "Kültür ve Turizm Bakanlığı",
      "muze.gov.tr": "T.C. Kültür ve Turizm Bakanlığı Müzeler",
      "kulturyolufestivali.com": "Türkiye Kültür Yolu Festivali",
      "artfulliving.com.tr": "Artful Living",
      "argonotlar.com": "Argonotlar",
      "sanatatak.com": "Sanat Atak",
      "arkitera.com": "Arkitera",
      "arkeofili.com": "Arkeofili",
    };
    return knownHosts[host] || host;
  } catch {
    return undefined;
  }
}

function mergeTextParts(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
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

  let response = await fetch(url, {
    headers: {
      "User-Agent": options?.userAgent || BROWSER_USER_AGENT,
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
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });

  // Retry with social crawler User-Agent if blocked by WAF (e.g. 403 / 406 on Euronews, etc.)
  if (!response.ok && [403, 406, 429].includes(response.status)) {
    try {
      const retryRes = await fetch(url, {
        headers: {
          "User-Agent": SOCIAL_BOT_USER_AGENT,
          Accept: "*/*",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      if (retryRes.ok) {
        response = retryRes;
      }
    } catch {
      // Keep original response
    }
  }

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
  const siteName = extractSiteName(html, resolvedUrl);
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

  return { url: resolvedUrl, pageTitle, pageText, imageUrls, siteName };
}

export function buildTextFromFallback(input: {
  title?: string | null;
  text?: string | null;
}): string {
  return mergeTextParts(input.title || undefined, input.text || undefined);
}
