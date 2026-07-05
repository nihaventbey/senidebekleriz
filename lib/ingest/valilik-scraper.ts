import { fetchUrlContent } from "@/lib/ai/fetch-url-content";

export type ValilikSource = {
  slug: string;
  name: string;
  baseUrl: string;
  introPaths: string[];
  discoverKeywords: string[];
};

export type ScrapedIntro = {
  slug: string;
  name: string;
  sourceUrl: string;
  title: string;
  pageText: string;
  contentHtml: string;
  summary: string;
  imageUrls: string[];
};

const USER_AGENT = "SeniDeBekleriz/1.0 (veri-zenginlestirme)";
const MIN_TEXT_LENGTH = 250;

/** Splits scraped plain text into paragraphs and wraps them as simple HTML. */
export function textToContentHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40);

  // If splitting produced nothing useful, chunk the text into sentences.
  const source =
    paragraphs.length > 0
      ? paragraphs
      : text
          .replace(/\s+/g, " ")
          .match(/[^.!?]+[.!?]+/g)
          ?.reduce<string[]>((acc, sentence) => {
            const last = acc[acc.length - 1];
            if (last && last.length < 300) {
              acc[acc.length - 1] = `${last} ${sentence.trim()}`;
            } else {
              acc.push(sentence.trim());
            }
            return acc;
          }, []) || [text];

  return source
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildSummary(text: string, maxLength = 400): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastStop = cut.lastIndexOf(".");
  return lastStop > 150 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}

function candidateUrls(source: ValilikSource): string[] {
  const urls: string[] = [];
  for (const path of source.introPaths) {
    try {
      urls.push(new URL(path, source.baseUrl).toString());
    } catch {
      // geçersiz path — atla
    }
  }
  urls.push(source.baseUrl);
  return [...new Set(urls)];
}

/**
 * Tries each known intro path for a province until one returns enough text.
 * Returns null when no candidate page yields usable content.
 */
export async function scrapeValilikIntro(
  source: ValilikSource
): Promise<ScrapedIntro | null> {
  for (const url of candidateUrls(source)) {
    try {
      const fetched = await fetchUrlContent(url, {
        maxTextLength: 8000,
        userAgent: USER_AGENT,
        minTextLength: MIN_TEXT_LENGTH,
      });

      if (fetched.pageText.length < MIN_TEXT_LENGTH) continue;

      const summary = buildSummary(fetched.pageText);
      return {
        slug: source.slug,
        name: source.name,
        sourceUrl: fetched.url,
        title: fetched.pageTitle || `${source.name} Tanıtımı`,
        pageText: fetched.pageText,
        contentHtml: textToContentHtml(fetched.pageText),
        summary,
        imageUrls: fetched.imageUrls,
      };
    } catch {
      // bu URL başarısız — sıradaki path'i dene
    }
  }

  return null;
}
