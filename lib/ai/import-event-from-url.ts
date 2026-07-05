import { normalizeUrlContent } from "@/lib/ai/normalize-event";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

export async function importEventFromUrl(url: string) {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Geçersiz URL");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "SeniDeBekleriz/1.0 (cultural events aggregator)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Sayfa alınamadı: ${response.status}`);
  }

  const html = await response.text();
  const pageTitle = extractTitle(html);
  const pageText = stripHtml(html).slice(0, 8000);

  if (pageText.length < 50) {
    throw new Error("Sayfadan yeterli metin çıkarılamadı");
  }

  const normalized = await normalizeUrlContent({
    url,
    pageTitle,
    pageText,
  });

  return {
    ...normalized,
    source_url: url,
    ticket_url: normalized.ticket_url || url,
  };
}
