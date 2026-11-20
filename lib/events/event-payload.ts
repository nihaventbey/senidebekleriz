import type { ArtistInfoCard } from "@/lib/events/artist-info-card";

/**
 * Builds the `raw_payload` JSONB object for `cultural_events`.
 *
 * PostgreSQL's `cultural_events.is_free` is a GENERATED ALWAYS STORED column derived from:
 *   COALESCE((raw_payload->>'is_free')::boolean, FALSE) OR
 *   COALESCE(raw_payload->>'price_type' = 'free', FALSE)
 * Therefore, we never write `is_free` as a top-level column; instead we synchronize
 * both `raw_payload.is_free` and `raw_payload.price_type` while preserving existing keys.
 */
export function buildEventRawPayload(
  existingPayload: Record<string, unknown> | null | undefined,
  options: {
    isFree: boolean;
    artistInfoCard?: ArtistInfoCard | null;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> =
    existingPayload && typeof existingPayload === "object"
      ? { ...existingPayload }
      : {};

  payload.is_free = Boolean(options.isFree);
  payload.price_type = options.isFree ? "free" : "paid";

  if (options.artistInfoCard === null) {
    delete payload.artist_info_card;
  } else if (options.artistInfoCard !== undefined) {
    payload.artist_info_card = options.artistInfoCard;
  }

  return payload;
}
