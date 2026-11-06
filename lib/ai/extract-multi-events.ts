import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import {
  filterImageCandidatesBySize,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import { sanitizeEventType, sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";
import { uniqueEventSlug } from "@/lib/events/slug";
import { cleanTicketUrl } from "@/lib/events/ticket-url";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import { resolveArtistOrEventCover } from "@/lib/events/artist-image-resolver";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EventType } from "@/lib/events/types";

const CITY_SLUGS = turkeyCities.map((c) => c.slug).join(", ");

export type ExtractedSubEvent = {
  title: string;
  summary: string;
  description?: string;
  event_type: EventType;
  city_slug: string | null;
  venue_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  ticket_url?: string | null;
  is_free?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
};

function buildMultiEventPrompt(): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  return `Sen Türkiye'nin kültür-sanat bülteni ve etkinlik ajandası uzmanısın. Bugünün tarihi: ${todayIso} (Yıl: ${currentYear}).
Sana verilen metin bir aylık bülten, şehir etkinlik rehberi, festival takvimi, haftalık kültür programı, biletleme sayfası veya bir etkinlik haberidir.
Görevin bu metin içindeki TÜM TEKİL VE BAĞIMSIZ Türkiye etkinliklerini (tiyatrolar, konserler, sergiler, festivaller, operalar, baleler, atölyeler, söyleşiler) ayrıştırıp bir dizi (array) olarak döndürmektir.

Kurallar:
1. Metinde birden fazla etkinlik varsa her bir farklı etkinliği ayrı bir obje olarak çıkar (en fazla 12 adet). Metinde tek bir etkinlik veya festival haberi bile olsa onu 1 elemanlı dizi olarak çıkar; ASLA boş dizi döndürme!
2. Şehir (city_slug): Metindeki Türkiye şehrini tespit et. Şu slug'lardan biri olmalıdır: ${CITY_SLUGS} (veya null).
3. event_type: "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger"
4. starts_at & ends_at: ISO 8601 (YYYY-MM-DDTHH:mm:ss+03:00) formatında olmalıdır.
   - Yıl belirtilmemişse ${currentYear} yılını kullan (Örn: "7 Kasım 21:00" -> "${currentYear}-11-07T21:00:00+03:00").
   - Saat yoksa tiyatro/konser için 20:00, sergi/müze için 10:00, festival için 12:00 varsay.
5. venue_name: Etkinliğin gerçekleştiği sahne, kültür merkezi, müze veya konser mekanının tam adı (Örn: "Harbiye Cemil Topuzlu Açıkhava Tiyatrosu", "AKM Türk Telekom Opera Salonu", "CSO Ada Ankara").
6. ticket_url: YALNIZCA o spesifik etkinliğin bilet satış linki (Biletix, Passo, Biletinial, Bubilet, Mobilet vb.) varsa yaz; yoksa null yap!
7. summary: Etkinlik için 1-2 cümlelik (max 160 karakter) temiz Türkçe özet.
8. description: Etkinliğin içeriğini, sanatçılarını, programını ve mekan atmosferini anlatan 2-3 paragraflık doyurucu Markdown açıklama.
9. meta_title: SEO başlığı (max 60 karakter).
10. meta_description: SEO açıklaması (max 155 karakter).
11. is_free: boolean. Etkinlik ücretsiz, halka açık, katılım serbest ise true; ücretli bilet satışı varsa false yap.

Yanıt yalnızca geçerli JSON olmalıdır:
{
  "events": [
    {
      "title": "...",
      "summary": "...",
      "description": "...",
      "event_type": "konser",
      "city_slug": "istanbul",
      "venue_name": "...",
      "starts_at": "${currentYear}-11-07T20:00:00+03:00",
      "ends_at": null,
      "ticket_url": null,
      "is_free": false,
      "meta_title": "...",
      "meta_description": "..."
    }
  ]
}`;
}

export async function extractEventsFromBulletin(input: {
  url: string;
  fallbackTitle?: string;
  fallbackText?: string;
  sourceName?: string;
  coverImageHint?: string | null;
}): Promise<{
  extractedCount: number;
  events: Array<{
    id: string;
    title: string;
    slug: string;
    date: string | null;
  }>;
}> {
  let pageText = input.fallbackText || "";
  let imageUrls: string[] = [];

  try {
    const fetched = await fetchUrlContent(input.url, {
      maxTextLength: 16000,
      fallbackText: input.fallbackText,
      minTextLength: 20,
    });
    pageText = fetched.pageText || pageText;
    imageUrls = await filterImageCandidatesBySize(fetched.imageUrls);
  } catch (err) {
    console.warn("fetchUrlContent in extractEventsFromBulletin fallback:", err);
  }

  const combinedFallback = [input.fallbackTitle, input.fallbackText, pageText]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (pageText.length < 30) {
    pageText = combinedFallback || input.url;
  }

  const defaultCitySlug = detectTurkishCityInText(combinedFallback);

  const userPrompt = [
    `Bülten / Kaynak URL: ${input.url}`,
    input.fallbackTitle ? `Başlık: ${input.fallbackTitle}` : null,
    defaultCitySlug ? `Tespit Edilen Şehir İpucu: ${defaultCitySlug}` : null,
    `Bülten Metni:\n${pageText.slice(0, 11000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let parsedEvents: ExtractedSubEvent[] = [];

  try {
    const response = await callGeminiJson<any>({
      systemPrompt: buildMultiEventPrompt(),
      userPrompt,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    if (Array.isArray(response)) {
      parsedEvents = response;
    } else if (response && typeof response === "object") {
      parsedEvents =
        response.events ||
        response.etkinlikler ||
        response.items ||
        response.data ||
        response.sub_events ||
        [];
    }
  } catch (aiErr) {
    console.warn("extractEventsFromBulletin AI call fallback:", aiErr);
  }

  // Graceful fallback: If AI returned an empty array or failed, construct event(s) from page title & text
  if (!Array.isArray(parsedEvents) || parsedEvents.length === 0) {
    const fallbackTitle = (input.fallbackTitle || "Kültür Sanat Etkinliği")
      .replace(/\s*[-–|]\s*[^–|-]+$/, "")
      .trim();
    parsedEvents = [
      {
        title: fallbackTitle,
        summary: (input.fallbackText || pageText || fallbackTitle).slice(0, 160),
        description: pageText.slice(0, 2000),
        event_type: /\b(konser|resital|orkestra)\b/i.test(combinedFallback)
          ? "konser"
          : /\b(tiyatro|oyun|sahne|opera|bale)\b/i.test(combinedFallback)
          ? "tiyatro"
          : /\b(sergi|müze|bienal)\b/i.test(combinedFallback)
          ? "sergi"
          : /\b(festival|şenlik)\b/i.test(combinedFallback)
          ? "festival"
          : "duyuru",
        city_slug: defaultCitySlug,
        venue_name: null,
        starts_at: null,
        ends_at: null,
        meta_title: `${fallbackTitle} | Etkinlik Takvimi`.slice(0, 60),
        meta_description: (input.fallbackText || pageText || fallbackTitle).slice(
          0,
          155
        ),
      },
    ];
  }

  // Pre-upload up to 3 candidate images in parallel to avoid N sequential uploads timing out
  if (imageUrls.length === 0 && input.coverImageHint) {
    imageUrls = [input.coverImageHint];
  }
  if (imageUrls.length === 0) {
    const fallbackImg = await resolveFallbackCulturalImage({
      title: input.fallbackTitle || parsedEvents[0]?.title || "Kültür Sanat",
      cityName: defaultCitySlug,
      category: "kultur_sanat",
    });
    if (fallbackImg) imageUrls = [fallbackImg];
  }

  const storedCoversPool = (
    await Promise.all(
      imageUrls.slice(0, 3).map((imgUrl, idx) =>
        ensureStoredCoverImage(
          imgUrl,
          "events",
          `${uniqueEventSlug(input.fallbackTitle || "etkinlik")}-${idx}`
        )
      )
    )
  ).filter((u): u is string => Boolean(u));

  const savedEvents: Array<{
    id: string;
    title: string;
    slug: string;
    date: string | null;
  }> = [];
  let lastError: Error | null = null;

  for (let i = 0; i < parsedEvents.length; i++) {
    const item = parsedEvents[i];
    if (!item || !item.title) continue;

    if (isNonEventTitle(item.title)) {
      console.warn("Skipping non-event title from bulletin:", item.title);
      continue;
    }

    const baseSlug = uniqueEventSlug(item.title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: exists } = await supabaseAdmin
        .from("cultural_events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!exists) break;
      slug = `${baseSlug.slice(0, 85)}-${counter++}`;
    }

    const safeEventType: EventType = sanitizeEventType(
      item.event_type,
      `${item.title} ${item.summary || ""}`
    );

    // If there are multiple events from a bulletin, the bulletin's cover image
    // is almost always a generic flyer or municipal building. Do NOT copy it to all sub-events!
    const isMultiEventBulletin = parsedEvents.length > 1;
    const storedCover = await resolveArtistOrEventCover({
      title: item.title,
      summary: item.summary,
      event_type: safeEventType,
      sourceCover: isMultiEventBulletin ? null : storedCoversPool[0] || null,
      slug,
    });

    const cleanedTicket = cleanTicketUrl(item.ticket_url, input.url);
    const resolvedCity =
      normalizeCitySlug(item.city_slug) ||
      normalizeCitySlug(
        detectTurkishCityInText(
          `${item.title} ${item.venue_name || ""} ${item.summary || ""}`
        )
      ) ||
      normalizeCitySlug(defaultCitySlug);

    const subSourceUrl = `${input.url}#sub-${baseSlug}`;

    // Check if this subSourceUrl was already extracted before
    const { data: existingSub } = await supabaseAdmin
      .from("cultural_events")
      .select("id, title, slug, starts_at")
      .eq("source_url", subSourceUrl)
      .maybeSingle();

    if (existingSub) {
      savedEvents.push({
        id: existingSub.id,
        title: existingSub.title,
        slug: existingSub.slug,
        date: existingSub.starts_at,
      });
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from("cultural_events")
      .insert({
        title: item.title.trim(),
        slug,
        summary: (item.summary || item.title).slice(0, 160),
        description: item.description || item.summary || null,
        event_type: safeEventType,
        status: "pending_review",
        source_name: input.sourceName || "Kültür Bülteni",
        source_url: subSourceUrl,
        ticket_url: cleanedTicket,
        city_slug: resolvedCity,
        venue_name: item.venue_name || null,
        starts_at: sanitizeIsoDate(item.starts_at),
        ends_at: sanitizeIsoDate(item.ends_at),
        cover_image: storedCover,
        meta_title: (
          item.meta_title || `${item.title} | Etkinlik Takvimi`
        ).slice(0, 60),
        meta_description: (
          item.meta_description ||
          item.summary ||
          item.title
        ).slice(0, 155),
        raw_payload: {
          extracted_from_bulletin: true,
          bulletin_url: input.url,
          original_sub_index: i + 1,
          is_free: Boolean(item.is_free),
        },
        updated_at: new Date().toISOString(),
      })
      .select("id, title, slug, starts_at")
      .single();

    if (!error && data) {
      savedEvents.push({
        id: data.id,
        title: data.title,
        slug: data.slug,
        date: data.starts_at,
      });
    } else if (error) {
      console.error(`Sub-event insert failed [${item.title}]:`, error);
      lastError = new Error(error.message);
    }
  }

  if (savedEvents.length === 0 && lastError) {
    throw new Error(`Etkinlikler kaydedilemedi: ${lastError.message}`);
  }

  return {
    extractedCount: savedEvents.length,
    events: savedEvents,
  };
}
