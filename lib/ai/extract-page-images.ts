const SKIP_IMAGE_PATTERN =
  /(logo|icon|favicon|sprite|pixel|1x1|blank|avatar|badge|emoji|spacer)/i;

const IMAGE_EXT_PATTERN = /\.(jpe?g|png|webp|gif)(\?|$)/i;

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
