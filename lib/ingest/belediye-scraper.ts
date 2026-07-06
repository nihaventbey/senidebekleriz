import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { slugify } from "@/lib/slugify";
import type { BelediyeSource } from "@/lib/ingest/belediye-sources";

export type ScrapedBelediyePlace = {
  citySlug: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  website: string | null;
  sourceUrl: string;
};

const USER_AGENT = "SeniDeBekleriz/1.0 (veri-zenginlestirme)";

const DETAIL_PATH_HINTS = [
  "gezilecek",
  "turizm",
  "mekan",
  "detay",
  "yer",
  "tarih",
  "kultur",
  "kültür",
  "muze",
  "müze",
  "camii",
  "kale",
  "park",
];

const SKIP_EXTENSIONS =
  /\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|doc|docx|xls|xlsx)(\?|$)/i;

const SKIP_PATH_FRAGMENTS = [
  "/wp-content/",
  "/wp-json/",
  "/feed",
  "/rss",
  "/arama",
  "/search",
  "/iletisim",
  "/contact",
  "/haber",
  "/duyuru",
  "/etkinlik",
  "/login",
  "/giris",
  "/javascript:",
  "#",
];

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeLinkText(text: string): string {
  return decodeHtmlEntities(text.replace(/\s+/g, " ").trim());
}

function isLikelyDetailPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower === "/" || lower.length < 4) return false;
  return DETAIL_PATH_HINTS.some((hint) => lower.includes(hint));
}

function shouldSkipUrl(url: URL): boolean {
  const lower = url.pathname.toLowerCase() + url.search.toLowerCase();
  if (SKIP_EXTENSIONS.test(lower)) return true;
  return SKIP_PATH_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

export function extractListPageLinks(
  html: string,
  pageUrl: string,
  options?: { maxLinks?: number }
): string[] {
  const base = new URL(pageUrl);
  const maxLinks = options?.maxLinks ?? 40;
  const links = new Map<string, string>();

  const anchorRegex = /<a\b[^>]*\bhref=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1]?.trim();
    if (!href) continue;

    try {
      const resolved = new URL(href, base);
      if (resolved.hostname !== base.hostname) continue;
      if (shouldSkipUrl(resolved)) continue;

      const path = resolved.pathname.toLowerCase();
      if (!isLikelyDetailPath(path)) continue;
      if (path === base.pathname.toLowerCase()) continue;

      const text = normalizeLinkText(match[2].replace(/<[^>]+>/g, " "));
      if (text.length < 3 || text.length > 120) continue;

      const url = resolved.toString();
      if (!links.has(url)) {
        links.set(url, text);
      }
    } catch {
      // geçersiz URL
    }

    if (links.size >= maxLinks) break;
  }

  return [...links.keys()];
}

async function fetchHtml(url: string): Promise<{ html: string; url: string }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
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

  return { html: await response.text(), url: response.url || url };
}

function buildDescription(text: string, maxLength = 500): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 40) return null;
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastStop = cut.lastIndexOf(".");
  return lastStop > 120 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}

function placeSlugForCity(citySlug: string, name: string): string {
  const base = slugify(name);
  const prefixed = `${citySlug}-${base}`;
  return prefixed.length > 2 ? prefixed : `${citySlug}-mekan`;
}

export async function scrapeBelediyePlaceDetail(
  source: BelediyeSource,
  detailUrl: string,
  linkTitle?: string
): Promise<ScrapedBelediyePlace | null> {
  try {
    const fetched = await fetchUrlContent(detailUrl, {
      userAgent: USER_AGENT,
      minTextLength: 60,
      maxTextLength: 6000,
    });

    const rawTitle = fetched.pageTitle || linkTitle || "";
    const name = rawTitle
      .replace(/\s*[-|–].*$/u, "")
      .replace(new RegExp(source.name, "i"), "")
      .trim();

    if (!name || name.length < 3) return null;

    const coverImage = fetched.imageUrls[0] ?? null;

    return {
      citySlug: source.slug,
      name,
      slug: placeSlugForCity(source.slug, name),
      description: buildDescription(fetched.pageText),
      coverImage,
      website: fetched.url,
      sourceUrl: fetched.url,
    };
  } catch {
    return null;
  }
}

export async function scrapeBelediyePlaces(
  source: BelediyeSource,
  options?: { maxPlaces?: number; onListUrl?: (url: string) => void }
): Promise<ScrapedBelediyePlace[]> {
  const maxPlaces = options?.maxPlaces ?? 25;
  const detailUrls = new Set<string>();

  for (const listPath of source.listPaths) {
    const listUrl = new URL(listPath, source.baseUrl).toString();
    options?.onListUrl?.(listUrl);

    try {
      const { html, url } = await fetchHtml(listUrl);
      for (const link of extractListPageLinks(html, url)) {
        detailUrls.add(link);
      }
    } catch {
      // liste sayfası alınamadı — sonraki path
    }
  }

  const places: ScrapedBelediyePlace[] = [];
  const seenSlugs = new Set<string>();

  for (const detailUrl of detailUrls) {
    if (places.length >= maxPlaces) break;

    const place = await scrapeBelediyePlaceDetail(source, detailUrl);
    if (!place || seenSlugs.has(place.slug)) continue;

    seenSlugs.add(place.slug);
    places.push(place);
  }

  return places;
}
