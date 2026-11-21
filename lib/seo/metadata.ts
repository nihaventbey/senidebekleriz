export const SEO_LIMITS = {
  newsTitle: { min: 40, max: 65, hardMax: 72 },
  newsSummary: { min: 130, max: 190, hardMax: 205 },
  eventTitle: { min: 20, max: 60, hardMax: 68 },
  eventSummary: { min: 100, max: 155, hardMax: 160 },
  articleTitle: { min: 35, max: 65, hardMax: 72 },
  articleExcerpt: { min: 110, max: 160, hardMax: 165 },
  metaTitle: { min: 30, max: 55 },
  metaDescription: { min: 120, max: 155 },
} as const;

const TRAILING_DANGLING_WORDS_RE =
  /\s+(?:ve|veya|ile|için|icin|gibi|olarak|kadar|göre|gore|üzere|uzere|da|de|ta|te|ki|ya|dağ|bir|bu|şu|o|her|en|mi|mı|mu|mü)$/i;

const TRAILING_PUNCT_RE = /[-–—:|,.;!?…"'“”‘’(\[{/\s]+$/;

/**
 * Strips raw HTML comments/tags, common entities, and ticketing boilerplate
 * fragments that sometimes leak from scraped feeds or WordPress editors.
 */
export function stripHtmlAndBoilerplate(text?: string | null): string {
  if (!text) return "";

  let clean = text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  // Ticketing & platform boilerplate fragments
  clean = clean
    .replace(
      /\s*\|\s*(?:Resmi\s+)?(?:Biletix(?:\s+Sitesi)?|Ticketmaster\s+Türkiye|Passo(?:\.com\.tr)?|Biletinial|Bubilet|Mobilet)\.?\s*(?=\||$)/gi,
      ""
    )
    .replace(/\s*\|\s*Aradığın\s+tüm\s+maç\s+biletleri.*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove orphaned leading/trailing pipes created after fragment removal
  clean = clean.replace(/^[|\s]+|[|\s]+$/g, "").trim();
  return clean;
}

/**
 * Strips redundant site brand or generic category suffixes (e.g. "| Seni de Bekleriz",
 * "| Seni de Bekleriz — Kültür, Sanat ve Şehir Ajandası", "| Etkinlik Takvimi")
 * because Next.js RootLayout applies `template: "%s | Seni de Bekleriz"`.
 */
export function stripSiteBrandSuffix(title?: string | null): string {
  if (!title) return "";
  let clean = stripHtmlAndBoilerplate(title);

  let prev = "";
  while (clean !== prev) {
    prev = clean;
    clean = clean
      .replace(
        /\s*(?:\||—|–|-)\s*Seni\s+de\s+Bekleriz(?:\s*(?:\||—|–|-)\s*.*)?$/i,
        ""
      )
      .replace(
        /\s*(?:\||—|–|-)\s*(?:Etkinlik\s+Takvimi|Kültür\s*(?:&|ve)?\s*Sanat(?:\s+Haberleri)?|Kültür\s+Takvimi)$/i,
        ""
      )
      .replace(/[\s|—–-]+$/g, "")
      .trim();
  }

  return clean;
}

function cleanDanglingEnd(text: string): string {
  let out = text.replace(TRAILING_PUNCT_RE, "").trim();

  // If trimming left an unclosed opening quote, drop from that quote onwards
  const openDouble = (out.match(/“/g) || []).length;
  const closeDouble = (out.match(/”/g) || []).length;
  if (openDouble > closeDouble) {
    const idx = out.lastIndexOf("“");
    if (idx >= 16) out = out.slice(0, idx).replace(TRAILING_PUNCT_RE, "").trim();
  }

  const straightQuotes = (out.match(/"/g) || []).length;
  if (straightQuotes % 2 === 1) {
    const idx = out.lastIndexOf('"');
    if (idx >= 16) out = out.slice(0, idx).replace(TRAILING_PUNCT_RE, "").trim();
  }

  let prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(TRAILING_DANGLING_WORDS_RE, "").replace(TRAILING_PUNCT_RE, "").trim();
  }

  return out;
}

/**
 * Formats an SEO title/meta_title cleanly without cutting mid-word or leaving
 * dangling Turkish conjunctions, unclosed quotes, or duplicate brand suffixes.
 */
export function formatSeoTitle(
  raw?: string | null,
  maxChars: number = SEO_LIMITS.metaTitle.max
): string {
  const clean = stripSiteBrandSuffix(raw);
  if (!clean) return "";
  if (clean.length <= maxChars) return clean;

  // Prefer breaking cleanly before secondary pipe/dash clause tags if substantial
  const clauseMatches = [...clean.matchAll(/\s+(?:\||—|–)\s+/g)];
  for (let i = clauseMatches.length - 1; i >= 0; i--) {
    const idx = clauseMatches[i].index;
    if (typeof idx === "number" && idx >= 24 && idx <= maxChars) {
      const candidate = cleanDanglingEnd(clean.slice(0, idx));
      if (candidate.length >= 20) return candidate;
    }
  }

  // Otherwise break on last word boundary <= maxChars
  const sub = clean.slice(0, maxChars + 1);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace >= 20) {
    const candidate = cleanDanglingEnd(sub.slice(0, lastSpace));
    if (candidate.length >= 16) return candidate;
  }

  return clean.slice(0, maxChars).trim();
}

/**
 * Builds the `title` passed to Next.js `Metadata` so `RootLayout`'s
 * `template: "%s | Seni de Bekleriz"` always adds the brand suffix exactly once
 * and keeps total SERP title length optimal.
 */
export function buildPageMetadataTitle(
  rawTitle?: string | null,
  opts?: { fallback?: string; maxChars?: number }
): string {
  const clean = stripSiteBrandSuffix(rawTitle);
  if (!clean) return opts?.fallback || "Seni de Bekleriz";
  return formatSeoTitle(clean, opts?.maxChars ?? 58) || opts?.fallback || "Seni de Bekleriz";
}

/**
 * Formats an SEO description/meta_description cleanly: strips HTML/boilerplate,
 * prefers ending on a complete sentence inside `maxChars`, or trims at a word
 * boundary with `…` without ever exceeding `maxChars`.
 */
export function formatSeoDescription(
  raw?: string | null,
  maxChars: number = SEO_LIMITS.metaDescription.max
): string {
  const clean = stripHtmlAndBoilerplate(raw);
  if (!clean) return "";
  if (clean.length <= maxChars) return clean;

  const sub = clean.slice(0, maxChars);
  const lastPunct = Math.max(sub.lastIndexOf("."), sub.lastIndexOf("!"), sub.lastIndexOf("?"));
  if (lastPunct >= Math.min(85, Math.floor(maxChars * 0.55))) {
    return sub.slice(0, lastPunct + 1).trim();
  }

  const budget = Math.max(20, maxChars - 1);
  const subForEllipsis = clean.slice(0, budget + 1);
  const lastSpace = subForEllipsis.lastIndexOf(" ");
  if (lastSpace >= Math.min(70, Math.floor(maxChars * 0.45))) {
    const trimmed = cleanDanglingEnd(subForEllipsis.slice(0, lastSpace));
    if (trimmed) return `${trimmed}…`;
  }

  return clean.slice(0, maxChars).trim();
}
