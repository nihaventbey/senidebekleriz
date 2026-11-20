export type ArtistInfoCard = {
  enabled: boolean;
  entityName: string;
  entityType: string;
  origin: string | null;
  officialWebsite: string | null;
  summary: string;
  websiteNote: string | null;
  highlights: string[];
  sourceLabel: string | null;
  updatedAt: string | null;
};

const TICKETING_DOMAINS = [
  "biletix.com",
  "passo.com.tr",
  "biletinial.com",
  "bubilet.com.tr",
  "mobilet.com",
  "biletino.com",
];

function cleanOptionalText(val: unknown, maxLen: number): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

/**
 * Validates and normalizes an artist/ensemble official website URL.
 * Rejects non-HTTP(S) schemes (e.g. javascript:/data:) and ticketing portals.
 */
export function sanitizeOfficialWebsiteUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!host || !host.includes(".")) return null;

  if (TICKETING_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    return null;
  }

  return parsed.toString();
}

/**
 * Validates and normalizes a raw object into an ArtistInfoCard, or returns null
 * if no meaningful entity/content is present.
 */
export function normalizeArtistInfoCard(input: unknown): ArtistInfoCard | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;

  const entityName = cleanOptionalText(record.entityName ?? record.entity_name, 140) || "";
  const entityType =
    cleanOptionalText(record.entityType ?? record.entity_type, 80) || "Sanatçı / Topluluk";
  const origin = cleanOptionalText(record.origin, 80);

  const rawWebsite =
    typeof (record.officialWebsite ?? record.official_website) === "string"
      ? String(record.officialWebsite ?? record.official_website)
      : null;
  const officialWebsite = sanitizeOfficialWebsiteUrl(rawWebsite);

  const summary = cleanOptionalText(record.summary, 600) || "";
  const websiteNote = cleanOptionalText(record.websiteNote ?? record.website_note, 600);
  const sourceLabel = cleanOptionalText(record.sourceLabel ?? record.source_label, 120);
  const updatedAt = cleanOptionalText(record.updatedAt ?? record.updated_at, 64);

  const rawHighlights = Array.isArray(record.highlights)
    ? record.highlights
    : typeof record.highlights === "string"
    ? record.highlights.split(/\r?\n/)
    : [];

  const seenHighlights = new Set<string>();
  const highlights: string[] = [];
  for (const h of rawHighlights) {
    if (typeof h !== "string") continue;
    const cleaned = h.replace(/^[-•*]\s*/, "").replace(/\s+/g, " ").trim().slice(0, 140);
    if (!cleaned) continue;
    const key = cleaned.toLocaleLowerCase("tr-TR");
    if (seenHighlights.has(key)) continue;
    seenHighlights.add(key);
    highlights.push(cleaned);
    if (highlights.length >= 6) break;
  }

  if (!entityName && !summary && !websiteNote && highlights.length === 0) {
    return null;
  }

  const enabled = typeof record.enabled === "boolean" ? record.enabled : true;

  return {
    enabled,
    entityName,
    entityType,
    origin,
    officialWebsite,
    summary,
    websiteNote,
    highlights,
    sourceLabel,
    updatedAt,
  };
}

/**
 * Checks whether an ArtistInfoCard has sufficient displayable information.
 */
export function hasArtistInfoCardContent(
  card: ArtistInfoCard | null | undefined
): boolean {
  if (!card) return false;
  if (!card.entityName.trim()) return false;
  return Boolean(
    card.summary.trim() || card.websiteNote?.trim() || card.highlights.length > 0
  );
}

/**
 * Parses FormData input for artist_info_card.
 * - Returns `undefined` when the field was omitted from FormData (preserve existing).
 * - Returns `null` when explicitly cleared (`""` or `"null"`).
 * - Returns normalized `ArtistInfoCard` (or `null` if empty) otherwise.
 */
export function parseArtistInfoCardFormValue(
  raw: FormDataEntryValue | null
): ArtistInfoCard | null | undefined {
  if (raw === null) return undefined;
  if (typeof raw !== "string") return undefined;

  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null") return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return normalizeArtistInfoCard(parsed);
  } catch {
    return undefined;
  }
}
