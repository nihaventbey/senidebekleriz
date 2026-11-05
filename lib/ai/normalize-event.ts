import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";
import type { EventType, NormalizedEventDraft, RawFeedItem } from "@/lib/events/types";
import { cleanTicketUrl } from "@/lib/events/ticket-url";

const VALID_EVENT_TYPES = new Set<EventType>([
  "tiyatro",
  "konser",
  "sergi",
  "festival",
  "duyuru",
  "diger",
]);

export function sanitizeEventType(raw?: string | null, fallbackText?: string): EventType {
  if (raw) {
    const lower = raw.trim().toLocaleLowerCase("tr");
    if (VALID_EVENT_TYPES.has(lower as EventType)) {
      return lower as EventType;
    }
    if (/(tiyatro|oyun|sahne|opera|bale|müzikal|muzikal|stand-up|standup|gösteri|gosteri)/i.test(lower)) {
      return "tiyatro";
    }
    if (/(konser|müzik|muzik|resital|orkestra|senfoni|caz|jazz|dinleti)/i.test(lower)) {
      return "konser";
    }
    if (/(sergi|müze|muze|galeri|bienal|enstalasyon)/i.test(lower)) {
      return "sergi";
    }
    if (/(festival|şenlik|senlik|karnaval)/i.test(lower)) {
      return "festival";
    }
    if (/(atölye|atolye|söyleşi|soylesi|panel|sinema|film|gösterim)/i.test(lower)) {
      return "diger";
    }
  }

  if (fallbackText) {
    const t = fallbackText.toLocaleLowerCase("tr");
    if (/\b(tiyatro|oyun|sahne|perde|prömiyer|bale|opera)\b/i.test(t)) return "tiyatro";
    if (/\b(sergi|sergisi|galeri|müze|bienal)\b/i.test(t)) return "sergi";
    if (/\b(konser|konseri|resital|orkestra|senfoni)\b/i.test(t)) return "konser";
    if (/\b(festival|festivali|şenlik)\b/i.test(t)) return "festival";
  }

  return "duyuru";
}

export function sanitizeIsoDate(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /^(null|undefined|belirtilmedi|yok)$/i.test(trimmed)) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  if (year < 2020 || year > 2035) return null;
  return parsed.toISOString();
}

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const SYSTEM_PROMPT = `Sen Türkiye kültür, sanat ve tarih portalı (Seni de Bekleriz) için kıdemli etkinlik editörüsün.
Girdi metnini ve kaynak verilerini derinlemesine analiz ederek SEO uyumlu, eksiksiz ve yapılandırılmış JSON üret.

Kurallar:
1. Etkinlik Filtresi: Yalnızca kültür, sanat, tiyatro, konser, sergi, festival, opera, bale, atölye veya kültürel gösteri ise is_cultural_event: true yap.
   (Genel turizm reklamı, restoran/bar tanıtımı, magazin veya siyasi haberler için is_cultural_event: false yap)

2. Şehir ve Tür:
   - city_slug yalnızca şu 81 il slug'ından biri olabilir veya tespit edilemezse null: ${CITY_SLUGS}
   - event_type: "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger"

3. Tarih ve Saat Algılama (starts_at & ends_at):
   - Metindeki etkinlik başlangıç ve bitiş tarihlerini çok dikkatli tespit et.
   - Çıktı MUTLAKA geçerli ISO 8601 (YYYY-MM-DDTHH:mm:ss+03:00) biçiminde olmalıdır.
   - Örnek: "18 Ekim 2026 Cumartesi 20:30" -> "2026-10-18T20:30:00+03:00"
   - Saat belirtilmemişse: Tiyatro/konser için "20:00:00", sergi/müze için "10:00:00", festival için "12:00:00" varsay.
   - Tarih aralığı varsa (Örn: "15 Ekim - 30 Kasım 2026"): starts_at "2026-10-15T10:00:00+03:00", ends_at "2026-11-30T19:00:00+03:00" olmalıdır.
   - Metinde hiçbir tarih geçmiyorsa starts_at ve ends_at KESİNLİKLE null olmalıdır.

4. Biletleme Servisi URL'si (ticket_url):
   - YALNIZCA metin içinde geçen gerçek bir biletleme bağlantısı (Biletix, Passo, Biletinial, Mobilet, Tixticket, Bubilet gibi bilet platformları veya salonun resmi online bilet satış sayfası) varsa URL olarak yaz.
   - ÇOK ÖNEMLİ: Haberin kendi linkini, gazete linkini veya ana sayfa linkini ASLA ticket_url yapma!
   - Bilet satın alma linki yoksa bu alan KESİNLİKLE null olmalıdır.

5. SEO Optimizasyonu ve Zengin İçerik:
   - title: Etkinliğin resmi, temiz adı. Gereksiz gazete manşeti eklerini ("Müjde", "Açıklandı", "Biletler Satışta") ayıkla.
   - summary: Arama motorlarında öne çıkacak, en fazla 160 karakterlik vurucu Türkçe özet.
   - description: Kapsamlı ve zengin Markdown metin (en az 350-550 kelime). Şu alt başlıkları mutlaka içermelidir:
     * Giriş paragrafı (etkinliğin sanatsal/kültürel önemi, teması ve şehre katkısı)
     * ## Etkinlik ve Sahne Detayları (eserin/konserin/serginin tematik detayları, repertuvar, öne çıkan anlar)
     * ## Sanatçılar ve Kadro (sahne alacak sanatçılar, yönetmen, küratör veya topluluk hakkında editoryal bilgi)
     * ## Mekân ve Katılım Rehberi (mekânın konumu, akustiği/atmosferi, ulaşım tüyoları, varsa bilet/ücretsiz katılım ve giriş kuralları)
   - meta_title: Arama sonuçlarında tıklanma sağlayan SEO başlığı (Örn: "Hamlet Oyunu | Harbiye Sahnesi İstanbul") (max 60 karakter).
   - meta_description: Arama motoru snippet'i (max 155 karakter).

Yanıt yalnızca geçerli JSON olmalıdır:
{
  "title": "...",
  "summary": "...",
  "description": "...",
  "event_type": "tiyatro",
  "city_slug": "istanbul",
  "venue_name": "Harbiye Muhsin Ertuğrul Sahnesi",
  "starts_at": "2026-10-18T20:30:00+03:00",
  "ends_at": null,
  "ticket_url": null,
  "meta_title": "...",
  "meta_description": "...",
  "is_cultural_event": true,
  "confidence": 0.95
}`;

const TR_MONTHS: Record<string, number> = {
  ocak: 0,
  subat: 1,
  şubat: 1,
  mart: 2,
  nisan: 3,
  mayis: 4,
  mayıs: 4,
  haziran: 5,
  temmuz: 6,
  agustos: 7,
  ağustos: 7,
  eylul: 8,
  eylül: 8,
  ekim: 9,
  kasim: 10,
  kasım: 10,
  aralik: 11,
  aralık: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function extractTurkishDates(text: string): {
  starts_at: string | null;
  ends_at: string | null;
} {
  const currentYear = new Date().getFullYear();
  const lower = text.toLocaleLowerCase("tr");

  // Range pattern 1: "15-20 Ekim 2026" or "15 - 20 Ekim"
  const rangeSameMonth = lower.match(
    /(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/i
  );
  if (rangeSameMonth) {
    const day1 = parseInt(rangeSameMonth[1], 10);
    const day2 = parseInt(rangeSameMonth[2], 10);
    const month = TR_MONTHS[rangeSameMonth[3].toLowerCase()];
    const year = rangeSameMonth[4] ? parseInt(rangeSameMonth[4], 10) : currentYear;

    if (month !== undefined && day1 >= 1 && day1 <= 31 && day2 >= 1 && day2 <= 31) {
      return {
        starts_at: `${year}-${pad(month + 1)}-${pad(day1)}T10:00:00+03:00`,
        ends_at: `${year}-${pad(month + 1)}-${pad(day2)}T19:00:00+03:00`,
      };
    }
  }

  // Range pattern 2: "15 Ekim - 20 Kasım 2026"
  const rangeDiffMonth = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s*[-–]\s*(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/i
  );
  if (rangeDiffMonth) {
    const day1 = parseInt(rangeDiffMonth[1], 10);
    const month1 = TR_MONTHS[rangeDiffMonth[2].toLowerCase()];
    const day2 = parseInt(rangeDiffMonth[3], 10);
    const month2 = TR_MONTHS[rangeDiffMonth[4].toLowerCase()];
    const year = rangeDiffMonth[5] ? parseInt(rangeDiffMonth[5], 10) : currentYear;

    if (month1 !== undefined && month2 !== undefined) {
      return {
        starts_at: `${year}-${pad(month1 + 1)}-${pad(day1)}T10:00:00+03:00`,
        ends_at: `${year}-${pad(month2 + 1)}-${pad(day2)}T19:00:00+03:00`,
      };
    }
  }

  // Single date with optional time: "18 Ekim 2026 saat 20:30" or "18 Ekim"
  const singleDate = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?(?:.*?(\d{1,2})[:.](\d{2}))?/i
  );
  if (singleDate) {
    const day = parseInt(singleDate[1], 10);
    const month = TR_MONTHS[singleDate[2].toLowerCase()];
    const year = singleDate[3] ? parseInt(singleDate[3], 10) : currentYear;
    const hour = singleDate[4] ? parseInt(singleDate[4], 10) : 20;
    const min = singleDate[5] ? parseInt(singleDate[5], 10) : 0;

    if (month !== undefined && day >= 1 && day <= 31) {
      return {
        starts_at: `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+03:00`,
        ends_at: null,
      };
    }
  }

  return { starts_at: null, ends_at: null };
}

export type FullNormalizedEvent = NormalizedEventDraft & {
  ticket_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  description?: string | null;
};

export function heuristicNormalizeEvent(input: {
  url: string;
  pageTitle?: string;
  pageText: string;
}): FullNormalizedEvent {
  const combined = `${input.pageTitle || ""} ${input.pageText}`;
  const text = combined.toLocaleLowerCase("tr");

  // Determine city from 81 cities safely with word boundaries
  const detectedCity = normalizeCitySlug(detectTurkishCityInText(text));

  // Determine event type
  const eventType = sanitizeEventType(null, text);

  const cleanTitle = (input.pageTitle || input.url)
    .replace(/\s*\|\s*(Biletix|Resmi Biletix.*|Ticketmaster.*|Biletinial.*|Passo.*)$/i, "")
    .replace(/\s*biletleri\s*$/i, "")
    .replace(/\s*[-–|]\s*[^–|-]{1,35}$/, "")
    .trim() || "Kültür Sanat Etkinliği";

  const rawBody = (input.pageText || "").trim();
  const summary = (rawBody || cleanTitle).slice(0, 160).trim();
  const dates = extractTurkishDates(text);

  const description =
    rawBody.length >= 250
      ? rawBody.slice(0, 2500)
      : [
          `${cleanTitle}, kültür ve sanat takviminde öne çıkan etkinlikler arasında yer alıyor.`,
          rawBody ? `\n${rawBody}` : "",
          `\n## Etkinlik ve Katılım Detayları`,
          `Etkinlik programı, seans saatleri ve güncel katılım koşulları için resmi etkinlik kaynağını veya biletleme bağlantısını kontrol edebilirsiniz.`,
        ]
          .filter(Boolean)
          .join("\n");

  return {
    title: cleanTitle,
    summary: summary || cleanTitle,
    description,
    event_type: eventType,
    city_slug: detectedCity,
    venue_name: null,
    starts_at: sanitizeIsoDate(dates.starts_at),
    ends_at: sanitizeIsoDate(dates.ends_at),
    is_cultural_event: true,
    confidence: 0.8,
    ticket_url: cleanTicketUrl(input.url, ""),
    meta_title: `${cleanTitle} | Kültür Sanat Etkinliği`.slice(0, 60),
    meta_description: (summary || cleanTitle).slice(0, 155),
  };
}

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

  try {
    const parsed = await callGeminiJson<FullNormalizedEvent>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
    });

    const fallbackDates = extractTurkishDates(`${item.title} ${item.description}`);

    return {
      ...parsed,
      title: (parsed.title || item.title).trim(),
      summary: (parsed.summary || item.title).slice(0, 160),
      event_type: sanitizeEventType(parsed.event_type, `${item.title} ${item.description}`),
      city_slug:
        normalizeCitySlug(parsed.city_slug) ||
        normalizeCitySlug(detectTurkishCityInText(`${item.title} ${item.description}`)),
      starts_at: sanitizeIsoDate(parsed.starts_at) || sanitizeIsoDate(fallbackDates.starts_at),
      ends_at: sanitizeIsoDate(parsed.ends_at) || sanitizeIsoDate(fallbackDates.ends_at),
      is_cultural_event: parsed.is_cultural_event ?? true,
    };
  } catch (error) {
    console.warn("normalizeFeedItem AI fallback triggered:", error instanceof Error ? error.message : error);
    return heuristicNormalizeEvent({
      url: item.link,
      pageTitle: item.title,
      pageText: item.description,
    });
  }
}

export async function normalizeUrlContent(input: {
  url: string;
  pageTitle?: string;
  pageText: string;
}): Promise<FullNormalizedEvent> {
  const userPrompt = [
    `Kaynak URL: ${input.url}`,
    input.pageTitle ? `Sayfa Başlığı: ${input.pageTitle}` : null,
    `Sayfa Metni:\n${input.pageText.slice(0, 5000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const parsed = await callGeminiJson<FullNormalizedEvent>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
    });

    const combinedText = `${input.pageTitle || ""} ${input.pageText}`;
    const fallbackDates = extractTurkishDates(combinedText);
    const cleanedTicket =
      cleanTicketUrl(parsed.ticket_url, input.url) ||
      cleanTicketUrl(input.url, "");

    const cleanTitle = (parsed.title || input.pageTitle || "Kültür Etkinliği").trim();
    const cleanSummary = (parsed.summary || input.pageTitle || cleanTitle).trim();

    return {
      ...parsed,
      title: cleanTitle,
      summary: cleanSummary,
      description: parsed.description || input.pageText.slice(0, 3500) || cleanSummary,
      event_type: sanitizeEventType(parsed.event_type, combinedText),
      city_slug:
        normalizeCitySlug(parsed.city_slug) ||
        normalizeCitySlug(detectTurkishCityInText(combinedText)),
      venue_name: parsed.venue_name ? String(parsed.venue_name).trim() : null,
      starts_at: sanitizeIsoDate(parsed.starts_at) || sanitizeIsoDate(fallbackDates.starts_at),
      ends_at: sanitizeIsoDate(parsed.ends_at) || sanitizeIsoDate(fallbackDates.ends_at),
      ticket_url: cleanedTicket,
      meta_title: (parsed.meta_title || `${cleanTitle} | Etkinlik Takvimi`).slice(0, 60),
      meta_description: (parsed.meta_description || cleanSummary).slice(0, 155),
      is_cultural_event: parsed.is_cultural_event ?? true,
    };
  } catch (error) {
    console.warn("normalizeUrlContent AI fallback triggered:", error instanceof Error ? error.message : error);
    return heuristicNormalizeEvent(input);
  }
}
