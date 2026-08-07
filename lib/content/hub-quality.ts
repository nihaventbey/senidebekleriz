/** Şehir/kategori hub sayfalarının indeks ve reklam eşiği */
export const MIN_HUB_INDEXABLE_PLACES = 3;

export function shouldIndexCityHub(input: {
  hasGuide: boolean;
  indexablePlaceCount: number;
}): boolean {
  return input.hasGuide || input.indexablePlaceCount >= MIN_HUB_INDEXABLE_PLACES;
}

export function shouldIndexCategoryHub(input: {
  placeCount: number;
  indexablePlaceCount: number;
  descriptionLength: number;
}): boolean {
  if (input.placeCount === 0) return false;
  if (input.indexablePlaceCount >= MIN_HUB_INDEXABLE_PLACES) return true;
  return input.descriptionLength >= 80 && input.indexablePlaceCount >= 1;
}
