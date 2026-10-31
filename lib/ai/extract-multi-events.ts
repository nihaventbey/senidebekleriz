import { turkeyCities } from "@/data/turkey-cities";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { filterImageCandidatesBySize } from "@/lib/ai/extract-page-images";
import { uniqueEventSlug } from "@/lib/events/slug";
import { cleanTicketUrl } from "@/lib/events/ticket-url";
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
  meta_title?: string | null;
  meta_description?: string | null;
};

const MULTI_EVENT_PROMPT = `Sen bir kültür-sanat bülteni ve etkinlik ajandası uzmanısın.
Sana verilen metin bir aylık bülten, şehir etkinlik rehberi, festival takvimi veya haftalık kültür programıdır.
Görevin bu metin içindeki TÜM TEKİL VE BAĞIMSIZ etkinlikleri (tiyatrolar, konserler, sergiler, festivaller, atölyeler) ayrıştırıp bir dizi (array) olarak döndürmektir.

Kurallar:
1. Metindeki her bir farklı etkinliği ayrı bir obje olarak çıkar (en fazla 15 adet en önemli etkinliği al).
2. Şehir (city_slug): Metindeki şehri tespit et. Şu slug'lardan biri olmalıdır: ${CITY_SLUGS} (veya null).
3. event_type: "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger"
4. starts_at & ends_at: ISO 8601 (YYYY-MM-DDTHH:mm:ss+03:00) formatında olmalıdır.
   - Belirtilen gün ve saatleri kesinlikle çevir (Örn: "15 Ekim 20:00" -> "2026-10-15T20:00:00+03:00").
   - Saat yoksa tiyatro/konser 20:00, sergi 10:00 varsay.
5. ticket_url: YALNIZCA o spesifik etkinliğin bilet satış linki (Biletix, Passo, Biletinial, Mobilet vb.) varsa yaz; yoksa null yap!
6. summary: Etkinlik için 1-2 cümlelik (max 160 karakter) temiz Türkçe özet.
7. meta_title: SEO başlığı (max 60 karakter).
8. meta_description: SEO açıklaması (max 155 karakter).

Yanıt yalnızca geçerli JSON olmalıdır:
{
  "events": [
    {
      "title": "...",
      "summary": "...",
      "description": "...",
      "event_type": "tiyatro",
      "city_slug": "istanbul",
      "venue_name": "...",
      "starts_at": "2026-10-15T20:00:00+03:00",
      "ends_at": null,
      "ticket_url": null,
      "meta_title": "...",
      "meta_description": "..."
    }
  ]
}`;

export async function extractEventsFromBulletin(input: {
  url: string;
  fallbackTitle?: string;
  fallbackText?: string;
  sourceName?: string;
}): Promise<{
  extractedCount: number;
  events: Array<{ id: string; title: string; slug: string; date: string | null }>;
}> {
  let pageText = input.fallbackText || "";
  let imageUrls: string[] = [];

  try {
    const fetched = await fetchUrlContent(input.url, {
      maxTextLength: 16000,
      fallbackText: input.fallbackText,
    });
    pageText = fetched.pageText || pageText;
    imageUrls = await filterImageCandidatesBySize(fetched.imageUrls);
  } catch (err) {
    console.warn("fetchUrlContent in extractEventsFromBulletin fallback:", err);
  }

  if (pageText.length < 50) {
    throw new Error("Bülten sayfasından yeterli metin okunamadı");
  }

  const userPrompt = [
    `Bülten URL: ${input.url}`,
    input.fallbackTitle ? `Başlık: ${input.fallbackTitle}` : null,
    `Bülten Metni:\n${pageText.slice(0, 10000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await callGeminiJson<{ events: ExtractedSubEvent[] }>({
    systemPrompt: MULTI_EVENT_PROMPT,
    userPrompt,
    temperature: 0.3,
  });

  const parsedEvents = response.events || [];
  if (parsedEvents.length === 0) {
    throw new Error("Metin içinde tekil etkinlikler ayrıştırılamadı");
  }

  const savedEvents: Array<{ id: string; title: string; slug: string; date: string | null }> = [];

  for (let i = 0; i < parsedEvents.length; i++) {
    const item = parsedEvents[i];
    if (!item.title) continue;

    // Unique slug
    let slug = uniqueEventSlug(item.title);
    let counter = 1;
    while (true) {
      const { data: exists } = await supabaseAdmin
        .from("cultural_events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!exists) break;
      slug = `${uniqueEventSlug(item.title)}-${counter++}`;
    }

    // Assign image if candidate available
    const candidateImage = imageUrls[i % imageUrls.length] || null;
    const storedCover = await ensureStoredCoverImage(candidateImage, "events", slug);
    const cleanedTicket = cleanTicketUrl(item.ticket_url, input.url);

    const { data, error } = await supabaseAdmin
      .from("cultural_events")
      .insert({
        title: item.title,
        slug,
        summary: (item.summary || item.title).slice(0, 160),
        description: item.description || null,
        event_type: item.event_type || "duyuru",
        status: "pending_review",
        source_name: input.sourceName || "Kültür Bülteni",
        source_url: input.url,
        ticket_url: cleanedTicket,
        city_slug: item.city_slug || null,
        venue_name: item.venue_name || null,
        starts_at: item.starts_at || null,
        ends_at: item.ends_at || null,
        cover_image: storedCover,
        meta_title: item.meta_title || `${item.title} | Etkinlik Takvimi`,
        meta_description: item.meta_description || item.summary,
        raw_payload: {
          extracted_from_bulletin: true,
          bulletin_url: input.url,
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
    }
  }

  return {
    extractedCount: savedEvents.length,
    events: savedEvents,
  };
}
