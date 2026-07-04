const MIN_EDITORIAL_LENGTH = 150;

type PlaceQualityInput = {
  description: string | null;
  source: string | null;
  is_featured?: boolean | null;
};

export function hasEditorialContent(place: PlaceQualityInput): boolean {
  const description = place.description?.trim() ?? "";
  if (place.is_featured) return true;
  if (place.source === "manual" && description.length >= MIN_EDITORIAL_LENGTH) {
    return true;
  }
  return false;
}

export function shouldIndexPlace(place: PlaceQualityInput): boolean {
  return hasEditorialContent(place);
}

export function getPlaceDescriptionFallback(
  placeName: string,
  cityName: string
): string {
  return `${placeName}, ${cityName}'da görülmeye değer bir mekandır.`;
}

export function getPlaceThinContentFallback(
  placeName: string,
  cityName: string
): string {
  return `${placeName}, ${cityName}'da bulunan görülmeye değer bir mekandır. Daha detaylı bilgi yakında eklenecektir.`;
}
