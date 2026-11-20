import { normalizeUrlContent, sanitizeEventType, sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { researchArtistInfoCard } from "@/lib/ai/research-artist-info";
import { getCityName, normalizeCitySlug } from "@/lib/cities/lookup";
import { getArtistCardSettings } from "@/lib/data/site-settings";
import { resolveArtistOrEventCover } from "@/lib/events/artist-image-resolver";
import { buildEventRawPayload } from "@/lib/events/event-payload";
import { uniqueEventSlug } from "@/lib/events/slug";
import {
  fetchGlobalTicketingCandidates,
  type GlobalTicketingCandidate,
} from "@/lib/events/sources/ticketing-global";
import { ensureStoredCoverImage } from "@/lib/storage/upload-image-from-url";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatSeoSummary } from "@/lib/utils";

export type GlobalTicketingSyncResult = {
  candidatesScanned: number;
  itemsInserted: number;
  itemsPublished: number;
  artistCardsEnriched: number;
  itemsSkipped: number;
  insertedTitles: string[];
  errors: string[];
};

function normalizeMatchKey(title: string): string {
  return (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLocaleLowerCase("tr-TR")
    .replace(/\b(konseri|konserleri|biletleri|world tour|tour|202\d)\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

async function isDuplicateTicketingEvent(
  candidate: GlobalTicketingCandidate,
  extraTitle?: string
): Promise<boolean> {
  const urls = [candidate.sourceUrl, candidate.ticketUrl].filter(Boolean);
  if (urls.length > 0) {
    const { data: urlMatch } = await supabaseAdmin
      .from("cultural_events")
      .select("id")
      .or(`source_url.in.(${urls.map((u) => `"${u}"`).join(",")}),ticket_url.in.(${urls.map((u) => `"${u}"`).join(",")})`)
      .limit(1);

    if (urlMatch && urlMatch.length > 0) return true;
  }

  const candKeys = [
    normalizeMatchKey(candidate.title),
    extraTitle ? normalizeMatchKey(extraTitle) : "",
    candidate.entityNameHint ? normalizeMatchKey(candidate.entityNameHint) : "",
  ].filter((k) => k.length >= 4);

  if (candKeys.length === 0) return false;

  const { data: existingRows } = await supabaseAdmin
    .from("cultural_events")
    .select("title, starts_at")
    .in("status", ["published", "pending_review"])
    .limit(150);

  for (const row of existingRows || []) {
    const rowKey = normalizeMatchKey(row.title);
    if (!rowKey) continue;
    const isSameAct = candKeys.some(
      (candKey) =>
        rowKey === candKey ||
        (candKey.length >= 6 &&
          (rowKey.includes(candKey) || candKey.includes(rowKey)))
    );
    if (!isSameAct) continue;

    // If dates are both unknown or within 7 days of each other, treat as duplicate
    if (!candidate.startsAt || !row.starts_at) return true;
    const diffMs = Math.abs(
      new Date(candidate.startsAt).getTime() - new Date(row.starts_at).getTime()
    );
    if (diffMs <= 7 * 24 * 60 * 60 * 1000) return true;
  }

  return false;
}

export async function syncGlobalTicketingEvents(options?: {
  limit?: number;
  autoPublish?: boolean;
  enrichArtistCards?: boolean;
}): Promise<GlobalTicketingSyncResult> {
  const limit = options?.limit ?? 8;
  const autoPublish = options?.autoPublish ?? false;
  const artistSettings = await getArtistCardSettings().catch(() => ({
    showArtistInfoCards: true,
    autoEnrichOnImport: true,
  }));
  const shouldEnrichCards =
    (options?.enrichArtistCards ?? true) && artistSettings.autoEnrichOnImport;

  const result: GlobalTicketingSyncResult = {
    candidatesScanned: 0,
    itemsInserted: 0,
    itemsPublished: 0,
    artistCardsEnriched: 0,
    itemsSkipped: 0,
    insertedTitles: [],
    errors: [],
  };

  const candidates = await fetchGlobalTicketingCandidates({ limit: limit + 4 });
  result.candidatesScanned = candidates.length;

  for (const candidate of candidates) {
    if (result.itemsInserted >= limit) break;

    try {
      if (await isDuplicateTicketingEvent(candidate)) {
        result.itemsSkipped += 1;
        continue;
      }

      const cityName = getCityName(candidate.citySlug);
      const structuredContext = [
        `Etkinlik Adı: ${candidate.title}`,
        candidate.startsAt ? `Başlangıç Tarihi (ISO): ${candidate.startsAt}` : null,
        candidate.endsAt ? `Bitiş Tarihi (ISO): ${candidate.endsAt}` : null,
        candidate.venueName ? `Mekân / Sahne: ${candidate.venueName}` : null,
        cityName ? `Şehir / Konum: ${cityName}` : null,
        candidate.ticketUrl ? `Bilet Bağlantısı: ${candidate.ticketUrl}` : null,
        candidate.descriptionText,
      ]
        .filter(Boolean)
        .join("\n\n");

      const normalized = await normalizeUrlContent({
        url: candidate.sourceUrl,
        pageTitle: candidate.title,
        pageText: structuredContext,
      });

      const title = normalized.title || candidate.title;
      if (await isDuplicateTicketingEvent(candidate, title)) {
        result.itemsSkipped += 1;
        continue;
      }
      const safeEventType = sanitizeEventType(
        normalized.event_type || candidate.eventTypeHint,
        `${title} ${candidate.descriptionText}`,
        title
      );
      const citySlug =
        normalizeCitySlug(candidate.citySlug) ||
        normalizeCitySlug(normalized.city_slug);
      const startsAt =
        sanitizeIsoDate(candidate.startsAt) ||
        sanitizeIsoDate(normalized.starts_at);
      const endsAt =
        sanitizeIsoDate(candidate.endsAt) || sanitizeIsoDate(normalized.ends_at);

      const baseSlug = uniqueEventSlug(title);
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const { data: exists } = await supabaseAdmin
          .from("cultural_events")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!exists) break;
        slug = `${baseSlug.slice(0, 88)}-${counter++}`;
      }

      const storedSourceCover = candidate.imageUrl
        ? await ensureStoredCoverImage(candidate.imageUrl, "events", slug)
        : null;

      const finalCoverImage = await resolveArtistOrEventCover({
        title,
        summary: normalized.summary,
        event_type: safeEventType,
        sourceCover: storedSourceCover,
        slug,
      });

      let artistCard = null;
      if (shouldEnrichCards) {
        artistCard = await researchArtistInfoCard({
          title,
          summary: normalized.summary,
          description: normalized.description,
          eventType: safeEventType,
          entityNameHint: candidate.entityNameHint,
        }).catch(() => null);
        if (artistCard) {
          result.artistCardsEnriched += 1;
        }
      }

      const isFutureEvent =
        Boolean(startsAt) &&
        new Date(startsAt as string).getTime() >= Date.now() - 12 * 3600_000;
      const canAutoPublish = Boolean(
        autoPublish &&
          isFutureEvent &&
          citySlug &&
          (normalized.description || "").length >= 300
      );

      const rawPayload = buildEventRawPayload(
        {
          ticketing_source: candidate.sourceName,
          prestige_category: candidate.prestigeCategory,
          prestige_score: candidate.prestigeScore,
          entity_name_hint: candidate.entityNameHint,
        },
        {
          isFree: candidate.isFree,
          artistInfoCard: artistCard,
        }
      );

      const { error } = await supabaseAdmin.from("cultural_events").insert({
        title,
        slug,
        summary: formatSeoSummary(normalized.summary || title, 160),
        description: normalized.description || candidate.descriptionText || null,
        event_type: safeEventType,
        status: canAutoPublish ? "published" : "pending_review",
        published_at: canAutoPublish ? new Date().toISOString() : null,
        source_name: candidate.sourceName,
        source_url: candidate.sourceUrl,
        ticket_url: candidate.ticketUrl,
        city_slug: citySlug,
        venue_name: normalized.venue_name || candidate.venueName,
        starts_at: startsAt,
        ends_at: endsAt,
        cover_image: finalCoverImage,
        meta_title: (
          normalized.meta_title || `${title} | Etkinlik Takvimi`
        ).slice(0, 60),
        meta_description: formatSeoSummary(
          normalized.meta_description || normalized.summary || title,
          155
        ),
        raw_payload: rawPayload,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          result.itemsSkipped += 1;
          continue;
        }
        throw new Error(error.message);
      }

      result.itemsInserted += 1;
      if (canAutoPublish) result.itemsPublished += 1;
      result.insertedTitles.push(title);
    } catch (err) {
      result.errors.push(
        `${candidate.title.slice(0, 40)}: ${
          err instanceof Error ? err.message : "hata"
        }`
      );
    }
  }

  try {
    await supabaseAdmin.from("sync_logs").insert({
      source: "ticketing_global",
      entity_type: "cultural_events",
      status:
        result.errors.length > 0 && result.itemsInserted === 0
          ? "error"
          : "success",
      message: `scanned=${result.candidatesScanned}, inserted=${result.itemsInserted}, published=${result.itemsPublished}, cards=${result.artistCardsEnriched}, skipped=${result.itemsSkipped}`,
    });
  } catch {
    // non-fatal log error
  }

  return result;
}
