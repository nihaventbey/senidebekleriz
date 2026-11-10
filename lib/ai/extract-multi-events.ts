import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { cleanPublisherText, stripDatelineFromParagraph } from "@/lib/ai/clean-publisher";
import {
  CORPORATE_STYLE_GUIDE,
  buildDateContext,
  polishMarkdown,
} from "@/lib/ai/editorial";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import {
  filterImageCandidatesBySize,
  resolveFallbackCulturalImage,
} from "@/lib/ai/extract-page-images";
import {
  extractTurkishDates,
  extractVenueFromText,
  sanitizeEventType,
   resolveExhibitionDates,
} from "@/lib/ai/normalize-event";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";
import { uniqueEventSlug } from "@/lib/events/slug";
import { cleanTicketUrl } from "@/lib/events/ticket-url";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import { resolveArtistOrEventCover } from "@/lib/events/artist-image-resolver";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatSeoSummary } from "@/lib/utils";
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

const MULTI_EVENT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
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
        ],
      },
    },
  },
  required: ["events"],
};

function buildMultiEventPrompt(publishedAt?: string): string {
  const dateContext = buildDateContext({ sourcePublishedAt: publishedAt });

  return `Sen Türkiye'nin kültür-sanat bülteni ve etkinlik ajandası uzmanısın.
Sana verilen metin bir aylık bülten, şehir etkinlik rehberi, festival takvimi, haftalık kültür programı, biletleme sayfası veya bir etkinlik haberidir.
Görevin bu metin içindeki TÜM TEKİL VE BAĞIMSIZ Türkiye etkinliklerini (tiyatrolar, konserler, sergiler, festivaller, operalar, baleler, atölyeler, söyleşiler) ayrıştırıp yapılandırılmış bir dizi olarak döndürmektir.

${dateContext}

${CORPORATE_STYLE_GUIDE}

Kurallar:
1. Metinde birden fazla etkinlik varsa her bir farklı etkinliği ayrı bir obje olarak çıkar (en fazla 12 adet). Metinde tek bir etkinlik veya festival haberi bile olsa onu 1 elemanlı dizi olarak çıkar; ASLA boş dizi döndürme.
2. Şehir (city_slug): Metindeki Türkiye şehrini tespit et. Şu slug'lardan biri olmalıdır: ${CITY_SLUGS} (veya null).
3. event_type: "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger"
   - Dikkat: Konser ve müzik etkinliklerinde metinde "sahne alacak" geçse bile event_type MUTLAKA "konser" olmalıdır!
4. starts_at & ends_at: ISO 8601 (YYYY-MM-DDTHH:mm:ss+03:00) formatında olmalıdır.
   - Saat yoksa tiyatro/konser için 20:00, sergi/müze için 10:00, festival için 12:00 varsay.
   - ÇOK ÖNEMLİ (SERGİLER): Sergiler 1 günde bitmez. Kapanış tarihi hiç verilmemişse açılış tarihinden en az 45 gün sonrasını ends_at yap.
5. venue_name: Etkinliğin gerçekleştiği sahne, kültür merkezi, müze veya konser mekanının tam adı (Örn: "Harbiye Cemil Topuzlu Açıkhava Tiyatrosu", "AKM Türk Telekom Opera Salonu", "CSO Ada Ankara").
6. ticket_url: YALNIZCA o spesifik etkinliğin bilet satış linki (Biletix, Passo, Biletinial, Bubilet, Mobilet vb.) varsa yaz; yoksa null yap.
7. summary: Etkinlik için 1-2 cümlelik (max 160 karakter), nokta ile biten kurumsal Türkçe özet.
8. description: Etkinliğin içeriğini, sanatçılarını, programını ve mekan bilgisini kaynaktaki somut verilerle anlatan 2-3 paragraflık kurumsal Markdown açıklama (summary cümlesini birebir tekrarlama).
9. meta_title: SEO başlığı (max 60 karakter).
10. meta_description: SEO açıklaması (max 155 karakter).
11. is_free: Etkinlik ücretsiz, halka açık, katılım serbest ise true; ücretli bilet satışı varsa false.`;
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
  let publishedAt: string | undefined;

  try {
    const fetched = await fetchUrlContent(input.url, {
      maxTextLength: 16000,
      fallbackText: input.fallbackText,
      minTextLength: 20,
    });
    pageText = fetched.pageText || pageText;
    publishedAt = fetched.publishedAt;
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
    `Bülten Metni:\n${pageText.slice(0, 12000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let parsedEvents: ExtractedSubEvent[] = [];

  try {
    const response = await callGeminiJson<any>({
      systemPrompt: buildMultiEventPrompt(publishedAt),
      userPrompt,
      temperature: 0.25,
      maxOutputTokens: 8192,
      thinking: "low",
      responseSchema: MULTI_EVENT_SCHEMA,
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

  // Graceful fallback: If AI returned an empty array or failed, construct event from page title & text
  if (!Array.isArray(parsedEvents) || parsedEvents.length === 0) {
    const fallbackTitle = cleanPublisherText(
      input.fallbackTitle || "Kültür Sanat Etkinliği"
    )
      .replace(/\s*[-–|]\s*[^–|-]+$/, "")
      .trim();
    const extractedDates = extractTurkishDates(combinedFallback);
    const extractedVenue = extractVenueFromText(combinedFallback);
    const fallbackType = sanitizeEventType(null, combinedFallback, fallbackTitle);

    parsedEvents = [
      {
        title: fallbackTitle,
        summary: formatSeoSummary(
          stripDatelineFromParagraph(input.fallbackText || pageText || fallbackTitle),
          160
        ),
        description: polishMarkdown(pageText.slice(0, 2500), fallbackTitle),
        event_type: fallbackType,
        city_slug: defaultCitySlug,
        venue_name: extractedVenue,
        starts_at: extractedDates.starts_at,
        ends_at: extractedDates.ends_at,
        is_free: /\b(ücretsiz|ücretsizdir|halka açık|katılım serbest)\b/i.test(
          combinedFallback
        ),
        meta_title: `${fallbackTitle} | Etkinlik Takvimi`.slice(0, 60),
        meta_description: formatSeoSummary(
          input.fallbackText || pageText || fallbackTitle,
          155
        ),
      },
    ];
  }

  // Only pre-upload genuine page images (NEVER inject Wikimedia fallback before resolveArtistOrEventCover!)
  if (imageUrls.length === 0 && input.coverImageHint) {
    imageUrls = [input.coverImageHint];
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

    const cleanItemTitle = cleanPublisherText(item.title).replace(/!+$/g, "").trim();
    if (!cleanItemTitle || isNonEventTitle(cleanItemTitle)) {
      console.warn("Skipping non-event title from bulletin:", item.title);
      continue;
    }

    const baseSlug = uniqueEventSlug(cleanItemTitle);
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
      `${cleanItemTitle} ${item.summary || ""}`,
      cleanItemTitle
    );

    // If there are multiple events from a bulletin, the bulletin's cover image
    // is almost always a generic flyer or municipal building. Do NOT copy it to all sub-events!
    const isMultiEventBulletin = parsedEvents.length > 1;
    let storedCover = await resolveArtistOrEventCover({
      title: cleanItemTitle,
      summary: item.summary,
      event_type: safeEventType,
      sourceCover: isMultiEventBulletin ? null : storedCoversPool[0] || null,
      slug,
    });

    if (!storedCover && safeEventType !== "konser") {
      const fallbackImg = await resolveFallbackCulturalImage({
        title: cleanItemTitle,
        cityName: item.city_slug || defaultCitySlug,
        category: "kultur_sanat",
      });
      storedCover = await ensureStoredCoverImage(fallbackImg, "events", slug);
    }

    const cleanedTicket = cleanTicketUrl(item.ticket_url, input.url);
    const resolvedCity =
      normalizeCitySlug(item.city_slug) ||
      normalizeCitySlug(
        detectTurkishCityInText(
          `${cleanItemTitle} ${item.venue_name || ""} ${item.summary || ""}`
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

    const itemDates = extractTurkishDates(
      `${cleanItemTitle} ${item.summary || ""} ${item.description || ""}`
    );
    const resolvedDates = resolveExhibitionDates(
      safeEventType,
      item.starts_at || itemDates.starts_at,
      item.ends_at || itemDates.ends_at
    );

    const cleanSummary = formatSeoSummary(
      stripDatelineFromParagraph(cleanPublisherText(item.summary || cleanItemTitle)),
      160
    );
    const cleanDescription = polishMarkdown(
      stripDatelineFromParagraph(item.description || cleanSummary),
      cleanItemTitle
    );

    const { data, error } = await supabaseAdmin
      .from("cultural_events")
      .insert({
        title: cleanItemTitle,
        slug,
        summary: cleanSummary,
        description: cleanDescription || null,
        event_type: safeEventType,
        status: "pending_review",
        source_name: input.sourceName || "Kültür Bülteni",
        source_url: subSourceUrl,
        ticket_url: cleanedTicket,
        city_slug: resolvedCity,
        venue_name:
          item.venue_name ||
          extractVenueFromText(`${cleanItemTitle} ${item.description || ""}`) ||
          null,
        starts_at: resolvedDates.starts_at,
        ends_at: resolvedDates.ends_at,
        cover_image: storedCover,
        meta_title: (
          item.meta_title || `${cleanItemTitle} | Etkinlik Takvimi`
        ).slice(0, 60),
        meta_description: formatSeoSummary(
          item.meta_description || cleanSummary || cleanItemTitle,
          155
        ),
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
      console.error(`Sub-event insert failed [${cleanItemTitle}]:`, error);
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
