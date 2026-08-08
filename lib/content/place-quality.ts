const MIN_EDITORIAL_WORDS = 150;

const EDITORIAL_SOURCES = new Set(["manual", "belediye"]);

export type PlaceQualityInput = {
  description: string | null;
  source: string | null;
  is_featured?: boolean | null;
  cover_image?: string | null;
  wikidata_id?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
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

/** Özgün editöryal açıklama var mı? */
export function hasEditorialContent(place: PlaceQualityInput): boolean {
  const description = place.description?.trim() ?? "";
  if (countWords(description) < MIN_EDITORIAL_WORDS) return false;
  return isEditorialSource(place.source);
}

/** Akıllı SEO İndeksleme Mantığı: Kültürel değeri veya zengin verisi olan tüm mekanlar Google'a açılır */
export function shouldIndexPlace(place: PlaceQualityInput): boolean {
  if (place.is_featured) return true;
  if (place.cover_image?.trim()) return true;
  if (place.wikidata_id?.trim()) return true;
  if (place.phone?.trim() || place.website?.trim()) return true;
  
  const desc = place.description?.trim() ?? "";
  if (countWords(desc) >= 15) return true;

  // İçi tamamen boş olan tek kelimelik mahalle parkları ana şehir rehberine kanonik bağlanır
  return false;
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
