const SKIP_IMAGE_PATTERN =
  /(logo|icon|favicon|sprite|pixel|1x1|blank|avatar|badge|emoji|spacer)/i;

const DENY_URL_PATTERN =
  /(vali|governor|bakan|profil|personel|mudur|banner|ataturk-portre|baskan|person|portrait|staff)/i;

const IMAGE_EXT_PATTERN = /\.(jpe?g|png|webp|gif)(\?|$)/i;
const MIN_IMAGE_WIDTH = 400;
const MAX_PORTRAIT_RATIO = 1.8;

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
    lower.includes("/image") ||
    lower.includes("upload")
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

export function extractPageImageUrls(html: string, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const ordered = new Set<string>();

  extractMetaImages(html, base, ordered);

  const linkRegex =
    /<link[^>]+rel=["'](?:image_src|preload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(linkRegex)) {
    addImageUrl(ordered, match[1], base);
  }

  const imgRegex =
    /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(imgRegex)) {
    addImageUrl(ordered, match[1], base);
  }

  return [...ordered].slice(0, 8);
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
