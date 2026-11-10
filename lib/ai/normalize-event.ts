import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { cleanPublisherText, stripDatelineFromParagraph } from "@/lib/ai/clean-publisher";
import {
  CORPORATE_STYLE_GUIDE,
  buildDateContext,
  inferEventYear,
  polishMarkdown,
} from "@/lib/ai/editorial";
import type { ExtractedJsonLdEvent } from "@/lib/ai/fetch-url-content";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { formatSeoSummary } from "@/lib/utils";
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

function normalizeTurkishLower(str: string): string {
  return (str || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr-TR")
    .trim();
}

/**
 * Classifies an event type from an optional explicit raw string and fallback text/title.
 * Fixes the bug where "sahne" ("sahne alacak", "sahne atmosferi") in a concert text
 * caused concerts to be misclassified as "tiyatro".
 */
export function sanitizeEventType(
  raw?: string | null,
  fallbackText?: string,
  titleHint?: string
): EventType {
  const titleLower = normalizeTurkishLower(
    titleHint || (fallbackText ? fallbackText.split(/\n/)[0] : "")
  );

  // 1. Unambiguous title-level classification takes precedence over noisy body text
  if (titleLower) {
    if (
      /(konser|konseri|konserleri|concert|resital|resitali|senfoni|filarmoni|orkestra|orkestrası|dinleti|dinletisi|caz gecesi|akustik gece)/.test(
        titleLower
      ) &&
      !/(tiyatro|opera ve bale)/.test(titleLower)
    ) {
      return "konser";
    }
    if (/(sergi|sergisi|sergileri|bienal|bienali|retrospektif)/.test(titleLower)) {
      return "sergi";
    }
    if (/(festival|festivali|şenlik|şenliği|karnaval)/.test(titleLower)) {
      return "festival";
    }
    if (
      /(tiyatro|tiyatrosu|opera|bale|müzikal|müzikali|stand-up|standup|oyunu)/.test(
        titleLower
      )
    ) {
      return "tiyatro";
    }
  }

  // 2. Explicit valid event_type from AI / caller
  if (raw) {
    const lower = normalizeTurkishLower(raw);
    if (VALID_EVENT_TYPES.has(lower as EventType)) {
      return lower as EventType;
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
    if (/(tiyatro|oyun|opera|bale|müzikal|muzikal|stand-up|standup|gösteri|gosteri)/i.test(lower)) {
      return "tiyatro";
    }
    if (/(atölye|atolye|söyleşi|soylesi|panel|sinema|film|gösterim)/i.test(lower)) {
      return "diger";
    }
  }

  // 3. Body text fallback (checking konser/sergi/festival before tiyatro, and never matching bare "sahne")
  if (fallbackText) {
    const t = normalizeTurkishLower(fallbackText);
    if (/(sergi|sergisi|bienal|retrospektif|küratör)/.test(t)) return "sergi";
    if (/(konser|konseri|resital|resitali|orkestra|senfoni|filarmoni|dinleti)/.test(t)) {
      return "konser";
    }
    if (/(festival|festivali|şenlik|şenliği|karnaval)/.test(t)) return "festival";
    if (/(tiyatro|tiyatrosu|oyunu|perde aç|prömiyer|bale|opera|müzikal|stand-up)/.test(t)) {
      return "tiyatro";
    }
  }

  return "duyuru";
}

export function sanitizeIsoDate(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /^(null|undefined|belirtilmedi|yok)$/i.test(trimmed)) return null;
  // Support date-only strings like "2026-11-15" by defaulting to 20:00 Turkey time
  const normalizedInput = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T20:00:00+03:00`
    : trimmed;
  const parsed = new Date(normalizedInput);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  if (year < 2020 || year > 2035) return null;
  return parsed.toISOString();
}

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

const EVENT_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    event_type: {
      type: "string",
      enum: ["tiyatro", "konser", "sergi", "festival", "duyuru", "diger"],
    },
    city_slug: { type: ["string", "null"] },
    venue_name: { type: ["string", "null"] },
    starts_at: { type: ["string", "null"] },
    ends_at: { type: ["string", "null"] },
    ticket_url: { type: ["string", "null"] },
    is_free: { type: "boolean" },
    meta_title: { type: "string" },
    meta_description: { type: "string" },
    is_cultural_event: { type: "boolean" },
    confidence: { type: "number" },
  },
  required: [
    "title",
    "summary",
    "description",
    "event_type",
    "city_slug",
    "venue_name",
    "starts_at",
    "ends_at",
    "is_cultural_event",
    "confidence",
  ],
};

function buildEventSystemPrompt(dateContext: string): string {
  return `Sen Türkiye kültür, sanat ve tarih portalı "Seni de Bekleriz" (senidebekleriz.com) için kıdemli etkinlik editörüsün.
Girdi metnini ve kaynak verilerini analiz ederek kurumsal, doğru ve yapılandırılmış JSON üret.

${dateContext}

${CORPORATE_STYLE_GUIDE}

Kurallar:
1. Etkinlik Filtresi (is_cultural_event):
   - Yalnızca Türkiye'de gerçekleşen somut bir kültür, sanat, tiyatro, konser, sergi, festival, opera, bale, atölye veya söyleşi etkinliği ise is_cultural_event: true yap.
   - Genel bilet sitesi ana sayfaları ("Maç Biletleri, Konser Biletleri"), siyasi demeçler, restoran reklamları, köşe yazıları veya geçmiş etkinliklerin kapanış haberleri için is_cultural_event: false yap.

2. Şehir ve Tür:
   - city_slug yalnızca şu 81 il slug'ından biri olabilir veya tespit edilemezse null: ${CITY_SLUGS}
   - event_type: "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger"
     * Dikkat: Konser ve müzik etkinliklerinde metinde "sahne alacak" geçse bile event_type MUTLAKA "konser" olmalıdır!

3. Tarih ve Saat Algılama (starts_at & ends_at):
   - Metindeki etkinlik başlangıç ve bitiş tarihlerini eksiksiz tespit et.
   - Çıktı MUTLAKA geçerli ISO 8601 (YYYY-MM-DDTHH:mm:ss+03:00) biçiminde olmalıdır.
   - Saat belirtilmemişse: Tiyatro/konser için "20:00:00", sergi/müze için "10:00:00", festival için "12:00:00" varsay.
   - Tarih aralığı varsa ("15 Ekim - 30 Kasım 2026" veya "20 ve 21 Kasım"): starts_at ve ends_at alanlarını doldur.
   - ÇOK ÖNEMLİ (SERGİLER): Sergiler günübirlik değildir; kapanış tarihi açıkça yazmıyorsa ends_at alanını açılış tarihinden 45 gün sonrası olarak belirle.
   - Metinde hiçbir tarih geçmiyorsa starts_at ve ends_at null olmalıdır.

4. Mekân (venue_name) ve Biletleme (ticket_url, is_free):
   - venue_name: Etkinliğin gerçekleştiği sahne, kültür merkezi, müze veya salonun resmi adı (Örn: "AKM Türk Telekom Opera Salonu", "CSO Ada Ankara", "Harbiye Cemil Topuzlu Açıkhava Tiyatrosu"). Yoksa null.
   - ticket_url: Yalnızca gerçek bir online bilet satış bağlantısı (Biletix, Passo, Biletinial, Mobilet, Bubilet vb.) varsa yaz; haber sitesi linkini ASLA ticket_url yapma.
   - is_free: Etkinlik ücretsiz / halka açık ise true, biletli ise false.

5. Kurumsal Metin ve SEO Alanları:
   - title: Etkinliğin resmi, temiz adı ("Müjde", "Biletler Satışta", "| Biletix" gibi ekleri temizle).
   - summary: 110 - 155 karakter arası, tam cümleyle ve noktayla biten kurumsal Türkçe özet (asla "..." ile yarım bırakma).
   - description: Kaynaktaki somut bilgilere dayanan, 180 - 380 kelimelik kurumsal Markdown etkinlik rehberi.
     * Giriş paragrafı ("summary" alanını kelimesi kelimesine kopyalama!)
     * Ardından içeriğe özgü 2 adet "## [Konuya Özgü Alt Başlık]" altında program/eser/sanatçı bilgisi ve mekân/katılım bilgisi.
     * Kaynakta olmayan ulaşım/otobüs hattı veya uydurma bilgi EKLEME; şablon başlıklar ("## Detaylar", "## Etkinlik ve Sahne Detayları") yerine etkinliğe özgü başlıklar kullan.
   - meta_title: SEO başlığı (max 60 karakter).
   - meta_description: Arama motoru açıklaması (max 155 karakter).`;
}

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

export function extractTurkishDates(text: string): {
  starts_at: string | null;
  ends_at: string | null;
} {
  if (!text) return { starts_at: null, ends_at: null };

  // 0. Check explicit ISO dates injected from JSON-LD block first
  const isoStartMatch = text.match(/Başlangıç Tarihi \(ISO\):\s*([^\s\n]+)/i);
  const isoEndMatch = text.match(/Bitiş Tarihi \(ISO\):\s*([^\s\n]+)/i);
  if (isoStartMatch?.[1]) {
    const s = sanitizeIsoDate(isoStartMatch[1]);
    const e = isoEndMatch?.[1] ? sanitizeIsoDate(isoEndMatch[1]) : null;
    if (s) return { starts_at: s, ends_at: e };
  }

  const lower = normalizeTurkishLower(text);

  // Range pattern 1: "15-20 Ekim 2026" or "20 ve 21 Kasım"
  const rangeSameMonth = lower.match(
    /(\d{1,2})\s*(?:[-–—]|\bve\b)\s*(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/i
  );
  if (rangeSameMonth) {
    const day1 = parseInt(rangeSameMonth[1], 10);
    const day2 = parseInt(rangeSameMonth[2], 10);
    const month = TR_MONTHS[rangeSameMonth[3].toLowerCase()];
    const year = rangeSameMonth[4]
      ? parseInt(rangeSameMonth[4], 10)
      : inferEventYear(month ?? 0, day1);

    if (month !== undefined && day1 >= 1 && day1 <= 31 && day2 >= 1 && day2 <= 31) {
      return {
        starts_at: `${year}-${pad(month + 1)}-${pad(day1)}T10:00:00+03:00`,
        ends_at: `${year}-${pad(month + 1)}-${pad(day2)}T19:00:00+03:00`,
      };
    }
  }

  // Range pattern 2: "15 Ekim - 20 Kasım 2026"
  const rangeDiffMonth = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s*[-–—]\s*(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?/i
  );
  if (rangeDiffMonth) {
    const day1 = parseInt(rangeDiffMonth[1], 10);
    const month1 = TR_MONTHS[rangeDiffMonth[2].toLowerCase()];
    const day2 = parseInt(rangeDiffMonth[3], 10);
    const month2 = TR_MONTHS[rangeDiffMonth[4].toLowerCase()];
    const year = rangeDiffMonth[5]
      ? parseInt(rangeDiffMonth[5], 10)
      : inferEventYear(month1 ?? 0, day1);

    if (month1 !== undefined && month2 !== undefined) {
      const year2 = month2 < month1 ? year + 1 : year;
      return {
        starts_at: `${year}-${pad(month1 + 1)}-${pad(day1)}T10:00:00+03:00`,
        ends_at: `${year2}-${pad(month2 + 1)}-${pad(day2)}T19:00:00+03:00`,
      };
    }
  }

  // Range pattern 3: "...'den ...'e kadar/dek" e.g. "15 Ekim'de açılan sergi 30 Kasım'a kadar"
  const rangeWithKadar = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?[^\d]{1,60}?(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?(?:['’]?[a-zçğıöşü]*\s+)?(?:kadar|dek)/i
  );
  if (rangeWithKadar) {
    const day1 = parseInt(rangeWithKadar[1], 10);
    const month1 = TR_MONTHS[rangeWithKadar[2].toLowerCase()];
    const year1 = rangeWithKadar[3]
      ? parseInt(rangeWithKadar[3], 10)
      : inferEventYear(month1 ?? 0, day1);
    const day2 = parseInt(rangeWithKadar[4], 10);
    const month2 = TR_MONTHS[rangeWithKadar[5].toLowerCase()];
    const year2 = rangeWithKadar[6]
      ? parseInt(rangeWithKadar[6], 10)
      : month2 !== undefined && month1 !== undefined && month2 < month1
      ? year1 + 1
      : year1;

    if (
      month1 !== undefined &&
      month2 !== undefined &&
      day1 >= 1 &&
      day1 <= 31 &&
      day2 >= 1 &&
      day2 <= 31
    ) {
      return {
        starts_at: `${year1}-${pad(month1 + 1)}-${pad(day1)}T10:00:00+03:00`,
        ends_at: `${year2}-${pad(month2 + 1)}-${pad(day2)}T19:00:00+03:00`,
      };
    }
  }

  // Single date with "kadar/dek": "30 Kasım'a kadar açık kalacak"
  const untilOnly = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?(?:['’]?[a-zçğıöşü]*\s+)?(?:kadar|dek)/i
  );
  if (untilOnly) {
    const day = parseInt(untilOnly[1], 10);
    const month = TR_MONTHS[untilOnly[2].toLowerCase()];
    const year = untilOnly[3]
      ? parseInt(untilOnly[3], 10)
      : inferEventYear(month ?? 0, day);

    if (month !== undefined && day >= 1 && day <= 31) {
      return {
        starts_at: null,
        ends_at: `${year}-${pad(month + 1)}-${pad(day)}T19:00:00+03:00`,
      };
    }
  }

  // Single date with optional time: "18 Ekim 2026 saat 20:30" or "18 Ekim"
  const singleDate = lower.match(
    /(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+(\d{4}))?(?:[^\d\n]{0,35}?(\d{1,2})[:.](\d{2}))?/i
  );
  if (singleDate) {
    const day = parseInt(singleDate[1], 10);
    const month = TR_MONTHS[singleDate[2].toLowerCase()];
    const year = singleDate[3]
      ? parseInt(singleDate[3], 10)
      : inferEventYear(month ?? 0, day);
    const rawHour = singleDate[4] ? parseInt(singleDate[4], 10) : 20;
    const rawMin = singleDate[5] ? parseInt(singleDate[5], 10) : 0;
    const hour = rawHour >= 0 && rawHour <= 23 ? rawHour : 20;
    const min = rawMin >= 0 && rawMin <= 59 ? rawMin : 0;

    if (month !== undefined && day >= 1 && day <= 31) {
      return {
        starts_at: `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+03:00`,
        ends_at: null,
      };
    }
  }

  // Numeric date: "15.11.2026" or "15/11/2026"
  const numericDate = lower.match(/\b(\d{1,2})[./](\d{1,2})[./](202\d)\b/);
  if (numericDate) {
    const day = parseInt(numericDate[1], 10);
    const monthNum = parseInt(numericDate[2], 10);
    const year = parseInt(numericDate[3], 10);
    if (monthNum >= 1 && monthNum <= 12 && day >= 1 && day <= 31) {
      return {
        starts_at: `${year}-${pad(monthNum)}-${pad(day)}T20:00:00+03:00`,
        ends_at: null,
      };
    }
  }

  return { starts_at: null, ends_at: null };
}

/**
 * Extracts a venue/stage name from structured lines or Turkish cultural venue patterns.
 */
export function extractVenueFromText(text: string): string | null {
  if (!text) return null;

  const explicitMatch = text.match(
    /(?:Mekân\s*\/\s*Sahne|Mekân|Mekan|Yer|Sahne|Salon)\s*:\s*([^\n|]{4,80})/i
  );
  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  const iconicMatch = text.match(
    /\b(AKM Türk Telekom Opera Salonu|Atatürk Kültür Merkezi|CSO Ada Ankara|Harbiye Cemil Topuzlu Açıkhava Tiyatrosu|Harbiye Muhsin Ertuğrul Sahnesi|Zorlu PSM(?:\s*[^\n,.]{1,25})?|Volkswagen Arena|İş Sanat(?:\s+Kültür Merkezi)?|Süreyya Operası|Cemal Reşit Rey Konser Salonu|CRR Konser Salonu|Lütfi Kırdar[^\n,.]{0,25}|CerModern|Congresium|İstanbul Modern|Pera Müzesi|Sakıp Sabancı Müzesi|Bostancı Gösteri Merkezi|Maximum Uniq[^\n,.]{0,20}|DasDas|Babylon|Salon İKSV|Muammer Karaca Tiyatrosu|Cüneyt Gökçer Sahnesi|Cam Piramit[^\n,.]{0,20}|Adana Müze Kompleksi|Efes Antik Tiyatrosu|Aspendos Antik Tiyatrosu)\b/i
  );
  if (iconicMatch?.[1]) {
    return iconicMatch[1].trim();
  }

  const genericVenueMatch = text.match(
    /([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9\s’'-]{3,45}\s+(?:Kültür ve Sanat Merkezi|Kültür Merkezi|Konser Salonu|Opera Salonu|Açıkhava Tiyatrosu|Devlet Tiyatrosu|Şehir Tiyatrosu|Sanat Merkezi|Müzesi|Sahnesi|Galerisi))/
  );
  if (genericVenueMatch?.[1]) {
    const candidate = genericVenueMatch[1].trim();
    if (candidate.split(/\s+/).length <= 7) {
      return candidate;
    }
  }

  return null;
}

/**
 * Exhibitions (sergi / bienal / muze_sergi) run for weeks or months.
 * If only the opening date is known, assign ends_at to at least 45 days after starts_at
 * so that it is never marked as expired or past the day after opening.
 */
export function resolveExhibitionDates(
  eventType: string | null | undefined,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined
): { starts_at: string | null; ends_at: string | null } {
  const cleanStartsAt = sanitizeIsoDate(startsAt);
  const cleanEndsAt = sanitizeIsoDate(endsAt);

  if (
    (eventType === "sergi" || eventType === "muze_sergi") &&
    cleanStartsAt &&
    !cleanEndsAt
  ) {
    const startDate = new Date(cleanStartsAt);
    if (!Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000);
      return {
        starts_at: cleanStartsAt,
        ends_at: endDate.toISOString(),
      };
    }
  }

  return { starts_at: cleanStartsAt, ends_at: cleanEndsAt };
}

export type FullNormalizedEvent = NormalizedEventDraft & {
  ticket_url?: string | null;
  is_free?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  description?: string | null;
};

function cleanEventTitle(rawTitle: string): string {
  return (
    cleanPublisherText(rawTitle)
      .replace(
        /\s*\|\s*(Biletix|Resmi Biletix.*|Ticketmaster.*|Biletinial.*|Passo.*|Bubilet.*|Mobilet.*)$/i,
        ""
      )
      .replace(/\s*biletleri\s*$/i, "")
      .replace(/\s*[-–|]\s*[^–|-]{1,35}$/, (suffix) => {
        // Keep genuine subtitles like "- Geleneksel Yıl Sonu Konseri", only strip publisher/platform names
        if (/(konser|sergi|tiyatro|festival|resital|özel|turne|sahne|gösteri|sezon)/i.test(suffix)) {
          return suffix;
        }
        return "";
      })
      .replace(/!+$/g, "")
      .trim() || "Kültür Sanat Etkinliği"
  );
}

function buildCleanEventDescription(
  rawDescription: string | null | undefined,
  rawPageText: string,
  cleanTitle: string,
  cleanSummary: string,
  venueName: string | null
): string {
  const source = (rawDescription || rawPageText || "").trim();
  const sumNorm = cleanSummary
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü]/g, "");

  const cleanedBlocks = source
    .split(/\n{2,}/)
    .map((b) => stripDatelineFromParagraph(b.trim()))
    .filter((b) => {
      if (!b || b.length < 20) return false;
      // Drop structured metadata dump lines from the prose body
      if (/^(Başlangıç Tarihi \(ISO\)|Bitiş Tarihi \(ISO\)|Bilet Bağlantısı):/i.test(b)) {
        return false;
      }
      // Drop truncated ellipsis snippets if there are other paragraphs
      if (/[…]$|\.{3}$/.test(b) && source.length > b.length + 60) {
        return false;
      }
      return true;
    });

  // Remove first paragraph if it duplicates summary word-for-word and more paragraphs exist
  if (cleanedBlocks.length >= 2) {
    const firstNorm = cleanedBlocks[0]
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]/g, "");
    if (firstNorm && sumNorm && firstNorm === sumNorm) {
      cleanedBlocks.shift();
    }
  }

  let body = polishMarkdown(cleanedBlocks.join("\n\n"), cleanTitle);

  if (body.length < 180) {
    const venueClause = venueName ? ` ${venueName} ev sahipliğinde` : "";
    body = [
      body || cleanSummary,
      `## Program ve Katılım Bilgileri`,
      `${cleanTitle},${venueClause} sanatseverlerle buluşuyor. Etkinliğin seans saatleri, salon düzeni ve güncel katılım koşulları resmi etkinlik sayfası üzerinden takip edilebilir.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return polishMarkdown(body, cleanTitle);
}

export function heuristicNormalizeEvent(input: {
  url: string;
  pageTitle?: string;
  pageText: string;
  jsonLdEvent?: ExtractedJsonLdEvent;
}): FullNormalizedEvent {
  const combined = `${input.pageTitle || ""} ${input.pageText}`;
  const text = combined.toLocaleLowerCase("tr");
  const jEvent = input.jsonLdEvent;

  const cleanTitle = cleanEventTitle(
    jEvent?.name || input.pageTitle || input.url
  );

  // Determine city from JSON-LD locality or 81 cities word boundaries
  const detectedCity =
    normalizeCitySlug(jEvent?.cityLocality) ||
    normalizeCitySlug(detectTurkishCityInText(`${cleanTitle} ${text}`));

  // Determine event type (passing cleanTitle as titleHint so concerts never become tiyatro!)
  const eventType = sanitizeEventType(null, text, cleanTitle);

  const rawBody = (input.pageText || "").trim();
  const nonTruncatedSentences = rawBody
    .split(/\n+/)
    .map((l) => stripDatelineFromParagraph(l.trim()))
    .filter(
      (l) =>
        l.length >= 35 &&
        !/[…]$|\.{3}$/.test(l) &&
        !/^(Etkinlik Adı|Başlangıç Tarihi|Bitiş Tarihi|Mekân|Şehir|Bilet Bağlantısı):/i.test(l)
    );

  const summary = formatSeoSummary(
    nonTruncatedSentences[0] || rawBody || cleanTitle,
    160
  );

  const rawDates = extractTurkishDates(combined);
  const resolvedDates = resolveExhibitionDates(
    eventType,
    jEvent?.startDate || rawDates.starts_at,
    jEvent?.endDate || rawDates.ends_at
  );

  const venueName = jEvent?.venueName || extractVenueFromText(combined);
  const isFree =
    jEvent?.isFree ??
    /\b(ücretsiz|ücretsizdir|halka açık|katılım serbest|giriş ücretsiz)\b/i.test(
      combined
    );

  const description = buildCleanEventDescription(
    null,
    rawBody,
    cleanTitle,
    summary,
    venueName
  );

  return {
    title: cleanTitle,
    summary: summary || cleanTitle,
    description,
    event_type: eventType,
    city_slug: detectedCity,
    venue_name: venueName,
    starts_at: resolvedDates.starts_at,
    ends_at: resolvedDates.ends_at,
    is_cultural_event: true,
    confidence: 0.8,
    ticket_url:
      cleanTicketUrl(jEvent?.ticketUrl, input.url) ||
      cleanTicketUrl(input.url, ""),
    is_free: isFree,
    meta_title: `${cleanTitle} | Etkinlik Takvimi`.slice(0, 60),
    meta_description: formatSeoSummary(summary || cleanTitle, 155),
  };
}

export async function normalizeFeedItem(
  item: RawFeedItem
): Promise<NormalizedEventDraft> {
  const dateContext = buildDateContext({ sourcePublishedAt: item.pubDate });
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
      systemPrompt: buildEventSystemPrompt(dateContext),
      userPrompt,
      temperature: 0.25,
      thinking: "minimal",
      responseSchema: EVENT_RESPONSE_SCHEMA,
    });

    const cleanTitle = (parsed.title || item.title).trim();
    const combinedText = `${cleanTitle} ${item.title} ${item.description}`;
    const fallbackDates = extractTurkishDates(combinedText);
    const safeEventType = sanitizeEventType(
      parsed.event_type,
      combinedText,
      cleanTitle
    );
    const rawStartsAt =
      sanitizeIsoDate(parsed.starts_at) ||
      sanitizeIsoDate(fallbackDates.starts_at);
    const rawEndsAt =
      sanitizeIsoDate(parsed.ends_at) ||
      sanitizeIsoDate(fallbackDates.ends_at);
    const resolvedDates = resolveExhibitionDates(
      safeEventType,
      rawStartsAt,
      rawEndsAt
    );

    return {
      ...parsed,
      title: cleanTitle,
      summary: formatSeoSummary(parsed.summary || item.title, 160),
      event_type: safeEventType,
      city_slug:
        normalizeCitySlug(parsed.city_slug) ||
        normalizeCitySlug(detectTurkishCityInText(combinedText)),
      venue_name: parsed.venue_name || extractVenueFromText(combinedText),
      starts_at: resolvedDates.starts_at,
      ends_at: resolvedDates.ends_at,
      is_cultural_event: parsed.is_cultural_event ?? true,
    };
  } catch (error) {
    console.warn(
      "normalizeFeedItem AI fallback triggered:",
      error instanceof Error ? error.message : error
    );
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
  publishedAt?: string;
  jsonLdEvent?: ExtractedJsonLdEvent;
}): Promise<FullNormalizedEvent> {
  const dateContext = buildDateContext({ sourcePublishedAt: input.publishedAt });
  const userPrompt = [
    `Kaynak URL: ${input.url}`,
    input.pageTitle ? `Sayfa Başlığı: ${input.pageTitle}` : null,
    `Sayfa Metni:\n${input.pageText.slice(0, 7000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const parsed = await callGeminiJson<FullNormalizedEvent>({
      systemPrompt: buildEventSystemPrompt(dateContext),
      userPrompt,
      temperature: 0.3,
      thinking: "low",
      responseSchema: EVENT_RESPONSE_SCHEMA,
    });

    const jEvent = input.jsonLdEvent;
    const cleanTitle = cleanEventTitle(
      parsed.title || jEvent?.name || input.pageTitle || "Kültür Etkinliği"
    );
    const combinedText = `${cleanTitle} ${input.pageTitle || ""} ${input.pageText}`;
    const fallbackDates = extractTurkishDates(combinedText);
    const safeEventType = sanitizeEventType(
      parsed.event_type,
      combinedText,
      cleanTitle
    );

    const rawStartsAt =
      sanitizeIsoDate(parsed.starts_at) ||
      sanitizeIsoDate(jEvent?.startDate) ||
      sanitizeIsoDate(fallbackDates.starts_at);
    const rawEndsAt =
      sanitizeIsoDate(parsed.ends_at) ||
      sanitizeIsoDate(jEvent?.endDate) ||
      sanitizeIsoDate(fallbackDates.ends_at);
    const resolvedDates = resolveExhibitionDates(
      safeEventType,
      rawStartsAt,
      rawEndsAt
    );

    const cleanedTicket =
      cleanTicketUrl(parsed.ticket_url, input.url) ||
      cleanTicketUrl(jEvent?.ticketUrl, input.url) ||
      cleanTicketUrl(input.url, "");

    const cleanSummary = formatSeoSummary(
      stripDatelineFromParagraph(
        cleanPublisherText(parsed.summary || input.pageTitle || cleanTitle)
      ),
      160
    );

    const resolvedVenue =
      (parsed.venue_name ? String(parsed.venue_name).trim() : null) ||
      jEvent?.venueName ||
      extractVenueFromText(combinedText);

    const cleanDescription = buildCleanEventDescription(
      parsed.description,
      input.pageText,
      cleanTitle,
      cleanSummary,
      resolvedVenue
    );

    const isFree =
      typeof parsed.is_free === "boolean"
        ? parsed.is_free
        : jEvent?.isFree ??
          /\b(ücretsiz|ücretsizdir|halka açık|katılım serbest)\b/i.test(
            combinedText
          );

    return {
      ...parsed,
      title: cleanTitle,
      summary: cleanSummary,
      description: cleanDescription,
      event_type: safeEventType,
      city_slug:
        normalizeCitySlug(parsed.city_slug) ||
        normalizeCitySlug(jEvent?.cityLocality) ||
        normalizeCitySlug(detectTurkishCityInText(combinedText)),
      venue_name: resolvedVenue,
      starts_at: resolvedDates.starts_at,
      ends_at: resolvedDates.ends_at,
      ticket_url: cleanedTicket,
      is_free: isFree,
      meta_title: (parsed.meta_title || `${cleanTitle} | Etkinlik Takvimi`).slice(
        0,
        60
      ),
      meta_description: formatSeoSummary(
        parsed.meta_description || cleanSummary,
        155
      ),
      is_cultural_event: parsed.is_cultural_event ?? true,
    };
  } catch (error) {
    console.warn(
      "normalizeUrlContent AI fallback triggered:",
      error instanceof Error ? error.message : error
    );
    return heuristicNormalizeEvent(input);
  }
}
