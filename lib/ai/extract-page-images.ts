const SKIP_IMAGE_PATTERN =
  /(logo|icon|favicon|sprite|pixel|1x1|blank|avatar|badge|emoji|spacer|tracking|analytics)/i;

const DENY_URL_PATTERN =
  /(vali|governor|bakan|profil|personel|mudur|banner|ataturk-portre|baskan|person|portrait|staff)/i;

const IMAGE_EXT_PATTERN = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

const IMAGE_PATH_PATTERN =
  /(\/image|\/images|\/img|\/media|\/upload|\/uploads|\/contents|\/wp-content|\/static\/|hurimg|wikimedia|cloudinary|ggpht|kulturportali|kulturyolu|ktb)/i;

const IMG_SRC_ATTRS =
  "src|data-src|data-lazy-src|data-original|data-url|data-image|data-iesrc|data-full-url";

const MIN_IMAGE_WIDTH = 400;
const MAX_PORTRAIT_RATIO = 1.8;
const MAX_EXTRACTED_IMAGES = 24;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
  if (/\.(svg|ico)(\?|$)/.test(lower)) return false;
  if (SKIP_IMAGE_PATTERN.test(lower)) return false;
  if (DENY_URL_PATTERN.test(lower)) return false;
  return (
    IMAGE_EXT_PATTERN.test(lower) ||
    IMAGE_PATH_PATTERN.test(lower)
  );
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
    mode === "meta" ? isLikelyMetaImage(resolved) : isLikelyContentImage(resolved);
  if (ok) set.add(resolved);
}

function addSrcsetUrls(
  set: Set<string>,
  srcset: string | undefined,
  base: URL,
  mode: "meta" | "content" = "content"
) {
  if (!srcset) return;

  for (const candidate of srcset.split(",")) {
    const url = candidate.trim().split(/\s+/)[0];
    addImageUrl(set, url, base, mode);
  }
}

export function isLikelyMetaImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:")) return false;
  if (/\.(svg|ico)(\?|$)/.test(lower)) return false;
  if (SKIP_IMAGE_PATTERN.test(lower)) return false;
  if (DENY_URL_PATTERN.test(lower)) return false;
  return true;
}

function extractMetaImages(html: string, base: URL, set: Set<string>) {
  const metaRegex =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*>/gi;

  for (const tag of html.match(metaRegex) || []) {
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    addImageUrl(set, contentMatch?.[1], base, "meta");
  }

  const reverseMetaRegex =
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*>/gi;

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

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (
        typeof value === "string" &&
        /image|thumbnail|photo|url/i.test(key) &&
        (value.startsWith("http") || value.startsWith("/"))
      ) {
        addImageUrl(set, value, base, "meta");
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
  const styleRegex = /style=["'][^"']*background-image:\s*url\((['"]?)([^'")]+)\1\)/gi;
  for (const match of html.matchAll(styleRegex)) {
    addImageUrl(set, match[2], base);
  }
}

function extractImgTags(html: string, base: URL, set: Set<string>) {
  const imgTagRegex = /<img\b[^>]*>/gi;
  for (const tag of html.match(imgTagRegex) || []) {
    const attrRegex = new RegExp(
      `(?:${IMG_SRC_ATTRS})=["']([^"']+)["']`,
      "gi"
    );
    for (const match of tag.matchAll(attrRegex)) {
      addImageUrl(set, match[1], base);
    }

    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    addSrcsetUrls(set, srcsetMatch?.[1], base);
  }
}

function extractPictureAndSourceTags(html: string, base: URL, set: Set<string>) {
  const sourceRegex = /<source\b[^>]*>/gi;
  for (const tag of html.match(sourceRegex) || []) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    addImageUrl(set, srcMatch?.[1], base);

    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    addSrcsetUrls(set, srcsetMatch?.[1], base);
  }
}

export function extractPageImageUrls(html: string, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const ordered = new Set<string>();

  extractMetaImages(html, base, ordered);
  extractJsonLdImages(html, base, ordered);

  const linkRegex =
    /<link[^>]+rel=["'](?:image_src|preload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    addImageUrl(ordered, match[1], base, "meta");
  }

  extractPictureAndSourceTags(html, base, ordered);
  extractImgTags(html, base, ordered);
  extractInlineStyleImages(html, base, ordered);

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

async function fetchImageDimensions(url: string): Promise<ImageDimensions | null> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (image-filter)" },
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

/** Drops portrait or very small images when dimension headers are available. */
export async function filterImageCandidatesBySize(
  urls: string[]
): Promise<string[]> {
  const kept: string[] = [];

  for (const url of urls) {
    const dims = await fetchImageDimensions(url);
    if (!dims) {
      kept.push(url);
      continue;
    }
    if (dims.width < MIN_IMAGE_WIDTH) continue;
    if (dims.height / dims.width > MAX_PORTRAIT_RATIO) continue;
    kept.push(url);
  }

  return kept.length > 0 ? kept : urls;
}
