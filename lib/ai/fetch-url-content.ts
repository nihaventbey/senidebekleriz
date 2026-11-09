import { fetchPublicResource } from "@/lib/security/public-fetch";
import {
  extractPageImageUrls,
  BROWSER_USER_AGENT,
} from "@/lib/ai/extract-page-images";
import {
  stripDatelineFromParagraph,
  cleanPublisherText,
} from "@/lib/ai/clean-publisher";

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
  let cleaned = html
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
    .replace(/<dialog[\s\S]*?<\/dialog>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");

  // Prune noisy wrapper sections (ads, related stories carousels, social sharing bars, comments)
  cleaned = cleaned
    .replace(
      /<(?:div|section|aside|ul|ol)\b[^>]*\b(?:class|id)=["'][^"']*\b(reklam|advertisement|banner|ad-zone|taboola|outbrain|criteo|teads)\b[^"']*["'][\s\S]*?<\/(?:div|section|aside|ul|ol)>/gi,
      " "
    )
    .replace(
      /<(?:div|section|aside|ul|ol)\b[^>]*\b(?:class|id)=["'][^"']*\b(social-share|share-buttons|paylas|sosyal-medya|bizi-takip-edin)\b[^"']*["'][\s\S]*?<\/(?:div|section|aside|ul|ol)>/gi,
      " "
    )
    .replace(
      /<(?:div|section|aside|ul|ol)\b[^>]*\b(?:class|id)=["'][^"']*\b(related-news|ilgili-haber|benzer-haber|diger-haberler|onerilen-haberler|populer-haberler|manset-haberler)\b[^"']*["'][\s\S]*?<\/(?:div|section|aside|ul|ol)>/gi,
      " "
    )
    .replace(
      /<(?:div|section|aside|ul|ol)\b[^>]*\b(?:class|id)=["'][^"']*\b(comments|yorumlar|yorum-alani|disqus)\b[^"']*["'][\s\S]*?<\/(?:div|section|aside|ul|ol)>/gi,
      " "
    );

  return cleaned;
}

export function extractBalancedTag(
  html: string,
  tag: string,
  startRegex: RegExp
): string | null {
  const match = html.match(startRegex);
  if (!match || match.index === undefined) return null;

  const startIndex = match.index;
  const tagStart = html.indexOf(">", startIndex);
  if (tagStart === -1) return null;

  let depth = 1;
  const tagRegex = new RegExp(`<(?:${tag}\\b[^>]*|\\/${tag}\\s*>)`, "gi");
  tagRegex.lastIndex = tagStart + 1;

  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    if (m[0].startsWith("</")) {
      depth--;
      if (depth === 0) {
        return html.slice(tagStart + 1, m.index);
      }
    } else if (!m[0].endsWith("/>")) {
      depth++;
    }
  }

  return html.slice(tagStart + 1);
}

function isBoilerplateParagraph(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Email-only or phone/fax/copyright lines
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return true;
  if (/»/.test(t) && t.length < 180) return true;

  // Timestamps, editor / reporter bylines
  if (
    /^(giriş(?:\s*tarihi)?|güncelleme(?:\s*tarihi)?|yayınlanma(?:\s*tarihi)?|son\s*güncelleme|tarih|saat|editör|muhabir|fotoğraf|kamera|ajans)\s*:/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}\s*-\s*\d{1,2}:\d{2}/.test(t)) {
    return true;
  }
  if (/^(yazar|muhabir|fotoğraf|kaynak)\s*:\s*[A-ZÇĞİÖŞÜa-zçğıöşü\s]{3,35}$/i.test(t)) {
    return true;
  }
  if (/^(aa|iha|dha|anka)\s*[\/–—\-]\s*[A-ZÇĞİÖŞÜa-zçğıöşü\s]{3,35}$/i.test(t)) {
    return true;
  }

  // Short navigation or category breadcrumbs
  if (
    t.length < 40 &&
    /^(ana sayfa|haberler|kültür|sanat|yaşam|gündem|güncel|türkiye|dünya)\s*(>|»|\||\/)/i.test(
      t
    )
  ) {
    return true;
  }

  // Social shares, push notifications, subscriber banners, clickbait transitions
  if (
    /^(paylaş|haberi paylaş|fotoğraf:|yazar:|yorumlar|yorum yap|yorum bırakın|copyright|tüm hakları|çerez politikası|bizi takip edin|bizi google news|google news'ten takip|whatsapp kanalımıza|bildirimleri aç|günün manşetleri|haberin devamı|haberin detayları|tıklayın|detaylar için|abone ol|ilgili haberler|etiketler\s*:|künye|yeni sayımız bayilerde|yazarlar\s+haberler|gözden kaçırmayın|bakmayı unutmayın|benzer haberler|diğer haberler|sıradaki haber|öne çıkan haberler|taka okurlarına özel|uyarı\s*:|sosyal medyada takip|yorum kuralları|görüşlerinizi paylaşın|işte o anlar|işte detaylar)/i.test(
      t
    )
  ) {
    return true;
  }

  // Publisher legal/copyright disclaimers
  if (
    /(künye\s*©|tüm hakları saklıdır|izinsiz kopyalanamaz|izinsiz ve kaynak gösterilmeden|ajansların aktardığı|yasal uyarı\s*:|demirören medya|turkuvaz medya|izinsiz kullanılamaz|tel:\s*\+?\d|faks:\s*\+?\d|yazarlar\s+haberler\s+milliyet|hakaret içeren cümleler|yorumları onaylanmamaktadır)/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function isEventOrCulturalDetail(text: string): boolean {
  return /\b(tarih|saat|yer|mekan|sahne|salon|bilet|ücretsiz|halka açık|katılım|başlangıç|bitiş|sanatçı|yönetmen|oyuncular|program)\b/i.test(
    text
  );
}

function stripHtml(html: string): string {
  const cleaned = stripNonContentElements(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)>/gi, "\n\n");

  const decoded = decodeHtmlEntities(cleaned.replace(/<[^>]+>/g, " "));
  const lines = decoded
    .split(/\n+/)
    .map((line) => stripDatelineFromParagraph(line.replace(/\s+/g, " ").trim()))
    .filter(
      (line) =>
        !isBoilerplateParagraph(line) &&
        (line.length >= 28 || (line.length >= 8 && isEventOrCulturalDetail(line)))
    );

  return lines.join("\n\n");
}

function extractBlocksFromHtml(html: string): string[] {
  const blockMatches = [
    ...html.matchAll(/<(p|h2|h3|h4|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi),
  ];
  const paragraphs: string[] = [];

  for (const match of blockMatches) {
    const tag = match[1].toLowerCase();
    // Skip <li> list items that are just links/cards (related news, menus, etc.)
    if (
      tag === "li" &&
      (/<a\b[^>]+href=/i.test(match[2]) ||
        /dh-kart|dh-haber|related|news-card/i.test(match[2]))
    ) {
      continue;
    }
    const rawText = decodeHtmlEntities(
      match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    const text = tag === "p" ? stripDatelineFromParagraph(rawText) : rawText;
    const minLen = isEventOrCulturalDetail(text)
      ? 8
      : tag.startsWith("h")
      ? 12
      : 24;
    if (text.length >= minLen && !isBoilerplateParagraph(text)) {
      paragraphs.push(text);
    }
  }

  // Some publishers (e.g. milliyetsanat.com) use <div> or <br> inside the article container instead of <p>
  if (paragraphs.length === 0) {
    const blockSeparated = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|strong|h[1-6]|li|blockquote)>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ");
    const divLines = decodeHtmlEntities(blockSeparated)
      .split(/\n+/)
      .map((line) => stripDatelineFromParagraph(line.replace(/\s+/g, " ").trim()))
      .filter(
        (line) =>
          !isBoilerplateParagraph(line) &&
          (line.length >= 28 || (line.length >= 8 && isEventOrCulturalDetail(line)))
      );
    if (divLines.length > 0) {
      return divLines;
    }
  }

  return paragraphs;
}

const TARGET_ARTICLE_CLASSES = [
  "news-content",
  "news-detail",
  "article-content",
  "article-body",
  "article-text",
  "story-body",
  "post-content",
  "entry-content",
  "content-text",
  "content-body",
  "text-content",
  "read__content",
  "article__content",
  "haber-metni",
  "haber-metin",
  "icerik-detay",
  "icerik-metin",
  "detay-metin",
  "detay-icerik",
  "detay-govde",
  "dh-detay-metin",
  "yazi-detay",
  "haber-detay",
  "detail-content",
  "hDetay",
].join("|");

function extractArticleParagraphs(html: string): string[] {
  const cleaned = stripNonContentElements(html);

  const containerSpecs: Array<{ tag: string; regex: RegExp }> = [
    // 1. Schema.org / Microdata itemprop="articleBody"
    {
      tag: "div",
      regex: /<div[^>]+itemprop=["']articleBody["']/i,
    },
    {
      tag: "section",
      regex: /<section[^>]+itemprop=["']articleBody["']/i,
    },
    {
      tag: "article",
      regex: /<article[^>]+itemprop=["']articleBody["']/i,
    },
    // 2. Specific class name tokens (delimited by whitespace or quotes)
    {
      tag: "div",
      regex: new RegExp(
        `<div[^>]+class=["'](?:[^"']*\\s)?(?:${TARGET_ARTICLE_CLASSES})(?:\\s[^"']*)?["']`,
        "i"
      ),
    },
    {
      tag: "section",
      regex: new RegExp(
        `<section[^>]+class=["'](?:[^"']*\\s)?(?:${TARGET_ARTICLE_CLASSES})(?:\\s[^"']*)?["']`,
        "i"
      ),
    },
    {
      tag: "article",
      regex: new RegExp(
        `<article[^>]+class=["'](?:[^"']*\\s)?(?:${TARGET_ARTICLE_CLASSES})(?:\\s[^"']*)?["']`,
        "i"
      ),
    },
    // 3. HTML5 semantic article / main
    {
      tag: "article",
      regex: /<article\b[^>]*>/i,
    },
    {
      tag: "main",
      regex: /<main\b[^>]*>/i,
    },
  ];

  for (const spec of containerSpecs) {
    const extracted = extractBalancedTag(cleaned, spec.tag, spec.regex);
    if (extracted && extracted.length > 250) {
      const candidates = extractBlocksFromHtml(extracted);
      if (candidates.length >= 3 || candidates.join(" ").length >= 250) {
        return candidates;
      }
    }
  }

  // Fallback: extract paragraphs from the whole cleaned HTML
  const fallbackParagraphs = extractBlocksFromHtml(cleaned);
  if (fallbackParagraphs.length > 0) {
    return fallbackParagraphs;
  }

  return [];
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

export function extractJsonLdText(html: string): {
  articleBody?: string;
  description?: string;
} {
  const blocks =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ) || [];

  const bodies: string[] = [];
  const descriptions: string[] = [];

  for (const block of blocks) {
    const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i);
    if (!jsonMatch?.[1]) continue;

    try {
      const parsed = JSON.parse(jsonMatch[1].trim()) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const record = node as Record<string, unknown>;
        if (typeof record.articleBody === "string" && record.articleBody.trim()) {
          bodies.push(
            decodeHtmlEntities(record.articleBody.replace(/\s+/g, " ").trim())
          );
        }
        if (typeof record.description === "string" && record.description.trim()) {
          descriptions.push(
            decodeHtmlEntities(record.description.replace(/\s+/g, " ").trim())
          );
        }
      }
    } catch {
      // Regex fallback for malformed JSON-LD (e.g. unescaped newlines in articleBody)
      const rawJson = jsonMatch[1];
      const bodyMatch = rawJson.match(/"articleBody"\s*:\s*"([\s\S]*?)"\s*,\s*"/);
      if (bodyMatch?.[1]) {
        bodies.push(decodeHtmlEntities(bodyMatch[1].replace(/\s+/g, " ").trim()));
      }
      const descMatch = rawJson.match(/"description"\s*:\s*"([^"]*)"/);
      if (descMatch?.[1]) {
        descriptions.push(decodeHtmlEntities(descMatch[1].replace(/\s+/g, " ").trim()));
      }
    }
  }

  return {
    articleBody: bodies.join("\n\n").trim() || undefined,
    description: descriptions.join("\n\n").trim() || undefined,
  };
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

  const articleText = articleParagraphs.join("\n\n");
  const jsonBody = jsonLd.articleBody || "";

  let bestBody: string[] = [];

  // Prioritize true article body:
  // 1. If JSON-LD has an extensive articleBody (> 300 chars longer than DOM paragraphs), prefer it
  // 2. Otherwise if DOM paragraphs exist and have >= 100 chars, use DOM paragraphs
  // 3. Otherwise if JSON-LD has articleBody (>= 100 chars), use it
  // 4. Otherwise fall back to stripped HTML
  // 5. If nothing else, fall back to JSON-LD description
  if (jsonBody.length > articleText.length + 300) {
    bestBody = jsonBody.split(/\n{2,}/);
  } else if (articleParagraphs.length > 0 && articleText.length >= 100) {
    bestBody = articleParagraphs;
  } else if (jsonBody.length >= 100) {
    bestBody = jsonBody.split(/\n{2,}/);
  } else {
    const stripped = stripHtml(html);
    if (stripped.length >= 100) {
      bestBody = stripped.split(/\n{2,}/);
    } else if (jsonLd.description && jsonLd.description.length >= 40) {
      bestBody = [jsonLd.description];
    }
  }

  if (bestBody.length > 0) {
    const rawBestText = bestBody.join(" ");
    const blocksToMerge =
      rawBestText.length >= 150
        ? bestBody
        : [ogDescription || "", metaDescription || "", ...bestBody];
    const combinedBlocks = deduplicateBlocks(blocksToMerge);
    return combinedBlocks.join("\n\n").trim().slice(0, maxLength);
  }

  // Fallback 2: general stripped HTML with headers/nav removed
  const chunks = deduplicateBlocks([
    ogDescription || "",
    metaDescription || "",
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
  if (ogTitle && ogTitle.length >= 6) return cleanPublisherText(ogTitle);

  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const cleanedH1 = decodeHtmlEntities(
      h1Match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cleanedH1.length >= 6) return cleanPublisherText(cleanedH1);
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]
    ? cleanPublisherText(decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim()))
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

  let response = await fetchPublicResource(url, {
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
    maxBytes: 2 * 1024 * 1024,
  });

  // Retry with social crawler User-Agent if blocked by WAF (e.g. 403 / 406 on Euronews, etc.)
  if (!response.ok && [403, 406, 429].includes(response.status)) {
    try {
      const retryRes = await fetchPublicResource(url, {
        headers: {
          "User-Agent": SOCIAL_BOT_USER_AGENT,
          Accept: "*/*",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
        maxBytes: 2 * 1024 * 1024,
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
