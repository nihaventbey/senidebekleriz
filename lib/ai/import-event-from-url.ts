import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { normalizeUrlContent } from "@/lib/ai/normalize-event";

export async function importEventFromUrl(url: string) {
  const { url: sourceUrl, pageTitle, pageText } = await fetchUrlContent(url, {
    maxTextLength: 8000,
    userAgent: "SeniDeBekleriz/1.0 (cultural events aggregator)",
  });

  const normalized = await normalizeUrlContent({
    url: sourceUrl,
    pageTitle,
    pageText,
  });

  return {
    ...normalized,
    source_url: sourceUrl,
    ticket_url: normalized.ticket_url || sourceUrl,
  };
}
