const MIN_EDITORIAL_WORDS = 150;

const EDITORIAL_SOURCES = new Set(["manual", "belediye"]);

export type PlaceQualityInput = {
  description: string | null;
  source: string | null;
  is_featured?: boolean | null;
  cover_image?: string | null;
};

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isEditorialSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return EDITORIAL_SOURCES.has(source);
}

/** Özgün editöryal açıklama var mı? (featured tek başına yetmez) */
export function hasEditorialContent(place: PlaceQualityInput): boolean {
  const description = place.description?.trim() ?? "";
  if (countWords(description) < MIN_EDITORIAL_WORDS) return false;
  return isEditorialSource(place.source);
}

/** Arama motoruna açılabilir mi? Editöryal metin + kapak zorunlu */
export function shouldIndexPlace(place: PlaceQualityInput): boolean {
  if (!place.cover_image?.trim()) return false;
  return hasEditorialContent(place);
}

export function getPlaceDescriptionFallback(
  placeName: string,
  cityName: string
): string {
  return `${placeName} — ${cityName}`;
}

export function getPlaceThinContentFallback(
  placeName: string,
  cityName: string
): string {
  return `${placeName} (${cityName}) için ayrıntılı tanıtım yakında eklenecektir.`;
}

export function getPlaceCardExcerpt(
  placeName: string,
  description: string | null | undefined
): string {
  const trimmed = description?.trim();
  if (trimmed && countWords(trimmed) >= 12) {
    return trimmed;
  }
  return placeName;
}

export { MIN_EDITORIAL_WORDS };
