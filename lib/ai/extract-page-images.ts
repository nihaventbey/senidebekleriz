export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SKIP_IMAGE_PATTERN =
  /(logo|icon|favicon|sprite|pixel|1x1|blank|avatar|badge|emoji|spacer|tracking|analytics|fb-yorum|yorum|share|whatsapp|twitter-icon|rss|abone|reklam|ad-banner|placeholder|default-image|fonts?|woff2?|glyph)/i;

const DENY_URL_PATTERN =
  /(vali|governor|bakan|profil|personel|mudur|banner|ataturk-portre|baskan|person|portrait|staff|yazar|author|columnist)/i;

const IMAGE_EXT_PATTERN = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;

const IMAGE_PATH_PATTERN =
  /(\/image|\/images|\/img|\/media|\/upload|\/uploads|\/contents|\/wp-content|\/static\/|\/crop\/|\/cdn\/|\/photos?\/|\/gallery\/|hurimg|teimg|wikimedia|cloudinary|ggpht|kulturportali|kulturyolu|ktb)/i;

const IMG_SRC_ATTRS =
  "src|data-src|data-lazy-src|data-original|data-url|data-image|data-iesrc|data-full-url";

const MIN_IMAGE_WIDTH = 380;
const MAX_PORTRAIT_RATIO = 1.25;
const MAX_EXTRACTED_IMAGES = 12;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function parseUrlDimensions(
  url: string
): { width: number; height: number } | null {
  // Match patterns like /640x412/, _300x250, -150x150., MilliyetSanat250x340
  const dimMatch = url.match(/(?:^|[^0-9])(\d{2,4})x(\d{2,4})(?:[^0-9]|$)/i);
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10);
    const h = parseInt(dimMatch[2], 10);
    if (w >= 16 && w <= 6000 && h >= 16 && h <= 6000) {
      return { width: w, height: h };
    }
  }
  return null;
}

export function resolvePageUrl(href: string, base: URL): string | null {
  const trimmed = decodeHtmlEntities(href.trim());
  if (!trimmed || trimmed.startsWith("data:")) return null;

  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

export function isLikelyContentImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:")) return false;
  if (/\.(svg|ico)(\?|#|$)/.test(lower)) return false;
  if (/\.(html?|php|asp|aspx|xml|json|m?js|css|scss|less|map|woff2?|ttf|eot|otf|mp4|webm|mp3|wav|pdf|zip)(\?|#|$)/.test(lower)) return false;
  if (SKIP_IMAGE_PATTERN.test(lower)) return false;
  if (DENY_URL_PATTERN.test(lower)) return false;

  const urlDims = parseUrlDimensions(url);
  if (urlDims) {
    if (urlDims.width < MIN_IMAGE_WIDTH) return false;
    if (urlDims.height / urlDims.width > MAX_PORTRAIT_RATIO) return false;
  }

  return IMAGE_EXT_PATTERN.test(lower) || IMAGE_PATH_PATTERN.test(lower);
}

function addImageUrl(
  set: Set<string>,
  href: string | undefined,
  base: URL,
  mode: "meta" | "content" = "content"
) {
  if (!href) return;
  const resolved = resolvePageUrl(href, base);
  if (!resolved) return;
  const ok =
    mode === "meta"
      ? isLikelyMetaImage(resolved)
      : isLikelyContentImage(resolved);
  if (ok) set.add(resolved);
}

function addSrcsetUrls(
  set: Set<string>,
  srcset: string | undefined,
  base: URL,
  mode: "meta" | "content" = "content"
) {
  if (!srcset) return;

  // Prefer largest width candidate in srcset first
  const candidates = srcset
    .split(",")
    .map((c) => {
      const parts = c.trim().split(/\s+/);
      const url = parts[0];
      const wMatch = parts[1]?.match(/^(\d+)w$/i);
      const width = wMatch ? parseInt(wMatch[1], 10) : 0;
      return { url, width };
    })
    .sort((a, b) => b.width - a.width);

  for (const candidate of candidates) {
    addImageUrl(set, candidate.url, base, mode);
  }
}

export function isLikelyMetaImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:")) return false;
  if (/\.(svg|ico)(\?|#|$)/.test(lower)) return false;
  if (/\.(html?|php|asp|aspx|xml|json|m?js|css|scss|less|map|woff2?|ttf|eot|otf|mp4|webm|mp3|wav|pdf|zip)(\?|#|$)/.test(lower)) return false;
  if (SKIP_IMAGE_PATTERN.test(lower)) return false;
  if (DENY_URL_PATTERN.test(lower)) return false;

  const urlDims = parseUrlDimensions(url);
  if (urlDims && urlDims.width < 250) return false;

  return IMAGE_EXT_PATTERN.test(lower) || IMAGE_PATH_PATTERN.test(lower);
}

function extractMetaImages(html: string, base: URL, set: Set<string>) {
  const metaRegex =
    /<meta[^>]+(?:property|name|itemprop)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?|image)["'][^>]*>/gi;

  for (const tag of html.match(metaRegex) || []) {
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    addImageUrl(set, contentMatch?.[1], base, "meta");
  }

  const reverseMetaRegex =
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?|image)["'][^>]*>/gi;

  for (const match of html.matchAll(reverseMetaRegex)) {
    addImageUrl(set, match[1], base, "meta");
  }
}

function extractJsonLdImages(html: string, base: URL, set: Set<string>) {
  const blocks =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ) || [];

  function visit(node: unknown) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const isImageObject =
      record["@type"] === "ImageObject" ||
      record["@type"] === "http://schema.org/ImageObject" ||
      record["@type"] === "https://schema.org/ImageObject";

    for (const [key, value] of Object.entries(record)) {
      if (
        typeof value === "string" &&
        (value.startsWith("http") || value.startsWith("/"))
      ) {
        const isImageKey =
          /^(?:image|thumbnail|thumbnailUrl|photo|contentUrl|leadImage)$/i.test(
            key
          );
        if (isImageKey || (isImageObject && key === "url")) {
          addImageUrl(set, value, base, "meta");
        }
      } else if (typeof value === "object") {
        visit(value);
      }
    }
  }

  for (const block of blocks) {
    const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i);
    if (!jsonMatch?.[1]) continue;
    try {
      visit(JSON.parse(jsonMatch[1].trim()));
    } catch {
      // JSON-LD parse hatası
    }
  }
}

function extractInlineStyleImages(html: string, base: URL, set: Set<string>) {
  const styleRegex =
    /style=["'][^"']*background-image:\s*url\((['"]?)([^'")]+)\1\)/gi;
  for (const match of html.matchAll(styleRegex)) {
    addImageUrl(set, match[2], base);
  }
}

function extractImgTags(html: string, base: URL, set: Set<string>) {
  const imgTagRegex = /<img\b[^>]*>/gi;
  for (const tag of html.match(imgTagRegex) || []) {
    // Skip explicit tiny width/height attributes on img tag
    const wAttr = tag.match(/\bwidth=["']?(\d+)/i);
    const hAttr = tag.match(/\bheight=["']?(\d+)/i);
    if (wAttr && parseInt(wAttr[1], 10) > 0 && parseInt(wAttr[1], 10) < 250) {
      continue;
    }
    if (hAttr && parseInt(hAttr[1], 10) > 0 && parseInt(hAttr[1], 10) < 150) {
      continue;
    }

    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    addSrcsetUrls(set, srcsetMatch?.[1], base);

    const attrRegex = new RegExp(
      `(?:${IMG_SRC_ATTRS})=["']([^"']+)["']`,
      "gi"
    );
    for (const match of tag.matchAll(attrRegex)) {
      addImageUrl(set, match[1], base);
    }
  }
}

function extractPictureAndSourceTags(
  html: string,
  base: URL,
  set: Set<string>
) {
  const sourceRegex = /<source\b[^>]*>/gi;
  for (const tag of html.match(sourceRegex) || []) {
    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    addSrcsetUrls(set, srcsetMatch?.[1], base);

    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    addImageUrl(set, srcMatch?.[1], base);
  }
}

export function extractPageImageUrls(html: string, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const ordered = new Set<string>();

  // 1. High-priority OpenGraph, Twitter Card & Schema.org JSON-LD images
  extractMetaImages(html, base, ordered);
  extractJsonLdImages(html, base, ordered);

  const linkRegex =
    /<link[^>]+rel=["'](?:image_src|preload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    addImageUrl(ordered, match[1], base, "meta");
  }

  // 2. Prioritize images inside <article> or <main> before header/sidebar
  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch?.[1]) {
    extractPictureAndSourceTags(articleMatch[1], base, ordered);
    extractImgTags(articleMatch[1], base, ordered);
  }

  // 3. Fallback to body images (excluding <header>, <footer>, <nav>, <aside>)
  const bodyWithoutChrome = html
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  extractPictureAndSourceTags(bodyWithoutChrome, base, ordered);
  extractImgTags(bodyWithoutChrome, base, ordered);
  extractInlineStyleImages(bodyWithoutChrome, base, ordered);

  const noscriptImgRegex =
    /<noscript>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>[\s\S]*?<\/noscript>/gi;
  for (const match of html.matchAll(noscriptImgRegex)) {
    addImageUrl(ordered, match[1], base);
  }

  return [...ordered].slice(0, MAX_EXTRACTED_IMAGES);
}

export function pickCoverImageUrl(imageUrls: string[]): string | undefined {
  return imageUrls[0];
}

type ImageDimensions = {
  width: number;
  height: number;
};

async function fetchImageDimensions(
  url: string
): Promise<ImageDimensions | null> {
  const urlDims = parseUrlDimensions(url);
  if (urlDims) return urlDims;

  try {
    const origin = new URL(url).origin;
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(2500),
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Referer: origin,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!head.ok) return null;

    const contentType = head.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const w = Number(
      head.headers.get("x-amz-meta-width") || head.headers.get("width")
    );
    const h = Number(
      head.headers.get("x-amz-meta-height") || head.headers.get("height")
    );
    if (w > 0 && h > 0) return { width: w, height: h };

    return null;
  } catch {
    return null;
  }
}

/** Drops portrait or very small images when dimension headers or URL dimensions are available. */
export async function filterImageCandidatesBySize(
  urls: string[]
): Promise<string[]> {
  if (urls.length === 0) return [];
  const candidates = urls.slice(0, 8);

  const results = await Promise.allSettled(
    candidates.map(async (url) => {
      const dims = await fetchImageDimensions(url);
      if (!dims) return { url, keep: true };
      if (dims.width < MIN_IMAGE_WIDTH) return { url, keep: false };
      if (dims.height / dims.width > MAX_PORTRAIT_RATIO) {
        return { url, keep: false };
      }
      return { url, keep: true };
    })
  );

  const kept: string[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && res.value.keep) {
      kept.push(res.value.url);
    }
  }

  return kept.length > 0 ? kept : urls;
}

const CATEGORY_FALLBACK_COVERS: Record<string, string[]> = {
  arkeoloji: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Ephesus_Celsus_Library_facade.jpg/1280px-Ephesus_Celsus_Library_facade.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/G%C3%B6bekli_Tepe%2C_Urfa.jpg/1280px-G%C3%B6bekli_Tepe%2C_Urfa.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Aspendos_Theatre_Antalya_Turkey.jpg/1280px-Aspendos_Theatre_Antalya_Turkey.jpg",
  ],
  restorasyon: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Ishak_Pasha_Palace_2019.jpg/1280px-Ishak_Pasha_Palace_2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg",
  ],
  muze_sergi: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Istanbul_Archaeological_Museum_main_building.jpg/1280px-Istanbul_Archaeological_Museum_main_building.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Zeugma_Mosaic_Museum_Gaziantep.jpg/1280px-Zeugma_Mosaic_Museum_Gaziantep.jpg",
  ],
  festival_haberleri: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Aspendos_Theatre_Antalya_Turkey.jpg/1280px-Aspendos_Theatre_Antalya_Turkey.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg/1280px-Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg",
  ],
  sinema: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg/1280px-Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/S%C3%BCreyya_Opera_House_interior.jpg/1280px-S%C3%BCreyya_Opera_House_interior.jpg",
  ],
  kultur_sanat: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg/1280px-Atat%C3%BCrk_Cultural_Center_Istanbul_2021.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/S%C3%BCreyya_Opera_House_interior.jpg/1280px-S%C3%BCreyya_Opera_House_interior.jpg",
  ],
  genel: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Ephesus_Celsus_Library_facade.jpg/1280px-Ephesus_Celsus_Library_facade.jpg",
  ],
};

/**
 * When a publisher page blocks scraping (403/406) or has no usable image,
 * searches Turkish Wikipedia for the subject/city to find a relevant photo,
 * and falls back to Wikimedia Commons Turkish cultural photography.
 */
export async function resolveFallbackCulturalImage(input: {
  title: string;
  cityName?: string | null;
  category?: string | null;
}): Promise<string | null> {
  const queries: string[] = [];

  // Extract notable proper nouns / venue names from title
  const cleanedTitle = input.title
    .replace(/['"“”‘’!?:;,.()-]/g, " ")
    .replace(/\b(başladı|açıldı|yeniden|ilk|kez|bulundu|keşfedildi|sergileniyor|sahnede|konseri|etkinlikleri|takvimi|festivali)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedTitle.length >= 5) {
    queries.push(cleanedTitle.split(" ").slice(0, 4).join(" "));
  }
  if (input.cityName) {
    queries.push(`${input.cityName} müzesi`);
    queries.push(`${input.cityName}`);
  }

  for (const q of queries) {
    try {
      const searchUrl = `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&srlimit=2&format=json`;
      const sRes = await fetch(searchUrl, {
        headers: { "User-Agent": "SeniDeBekleriz/1.0 (kultur-portali)" },
        signal: AbortSignal.timeout(3500),
      });
      if (!sRes.ok) continue;
      const sData = await sRes.json();
      const hits = sData?.query?.search || [];
      if (hits.length === 0) continue;

      const titles = hits.map((h: { title: string }) => h.title).join("|");
      const imgUrl = `https://tr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        titles
      )}&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json`;
      const iRes = await fetch(imgUrl, {
        headers: { "User-Agent": "SeniDeBekleriz/1.0 (kultur-portali)" },
        signal: AbortSignal.timeout(3500),
      });
      if (!iRes.ok) continue;
      const iData = await iRes.json();
      const pages = iData?.query?.pages || {};
      for (const page of Object.values(pages) as Array<{
        thumbnail?: { source?: string; width?: number; height?: number };
      }>) {
        const src = page?.thumbnail?.source;
        if (src && isLikelyContentImage(src)) {
          return src;
        }
      }
    } catch {
      // Ignore Wikipedia lookup timeout
    }
  }

  const catKey = input.category && CATEGORY_FALLBACK_COVERS[input.category]
    ? input.category
    : "genel";
  const pool = CATEGORY_FALLBACK_COVERS[catKey] || CATEGORY_FALLBACK_COVERS.genel;
  const hash = input.title
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return pool[hash % pool.length];
}
