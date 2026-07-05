import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import type { NormalizedEventDraft, RawFeedItem } from "@/lib/events/types";

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const SYSTEM_PROMPT = `Sen Türkiye kültür/sanat/tarih platformu için etkinlik editörüsün.
Girdi metnini analiz edip yapılandırılmış JSON üret.
Kurallar:
- Yalnızca kültür, sanat, tarih, müze, tiyatro, konser, sergi, festival ile ilgili içerikleri is_cultural_event: true yap
- Restoran, yeme-içme, siyasi skandal, genel turizm reklamı → is_cultural_event: false
- city_slug yalnızca şu slug'lardan biri olabilir veya null: ${CITY_SLUGS}
- event_type: tiyatro | konser | sergi | festival | duyuru | diger
- summary en fazla 160 karakter, Türkçe
- Tarih bilinmiyorsa starts_at/ends_at null, event_type duyuru olabilir
- confidence 0 ile 1 arası
Yanıt yalnızca geçerli JSON:
{"title":"...","summary":"...","event_type":"...","city_slug":null,"venue_name":null,"starts_at":null,"ends_at":null,"is_cultural_event":true,"confidence":0.9}`;

export async function normalizeFeedItem(
  item: RawFeedItem
): Promise<NormalizedEventDraft> {
  const userPrompt = [
    `Kaynak: ${item.sourceName}`,
    `Başlık: ${item.title}`,
    `Link: ${item.link}`,
    item.pubDate ? `Yayın tarihi: ${item.pubDate}` : null,
    `İçerik özeti: ${item.description.slice(0, 2000)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const parsed = await callGeminiJson<NormalizedEventDraft>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
  });

  return {
    ...parsed,
    title: parsed.title || item.title,
    summary: (parsed.summary || item.title).slice(0, 160),
  };
}

export async function normalizeUrlContent(input: {
  url: string;
  pageTitle?: string;
  pageText: string;
}): Promise<NormalizedEventDraft & { ticket_url?: string | null }> {
  const userPrompt = [
    `URL: ${input.url}`,
    input.pageTitle ? `Sayfa başlığı: ${input.pageTitle}` : null,
    `Sayfa metni (özet): ${input.pageText.slice(0, 4000)}`,
    "Bu URL bir kültür etkinliği, tiyatro, konser, sergi veya resmi duyuru sayfası olabilir.",
  ]
    .filter(Boolean)
    .join("\n");

  const parsed = await callGeminiJson<
    NormalizedEventDraft & { ticket_url?: string | null }
  >({
    systemPrompt: `${SYSTEM_PROMPT}\nEk alan: ticket_url (bilet linki varsa URL, yoksa null)`,
    userPrompt,
    temperature: 0.3,
  });

  return parsed;
}
