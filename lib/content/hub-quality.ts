/** Şehir/kategori hub sayfalarının indeks ve reklam eşiği */
export const MIN_HUB_INDEXABLE_PLACES = 3;

export function shouldIndexCityHub(input: {
  hasGuide: boolean;
  indexablePlaceCount: number;
}): boolean {
  return true;
}

export function shouldIndexCategoryHub(input: {
  placeCount: number;
  indexablePlaceCount: number;
  descriptionLength: number;
}): boolean {
  return true;
}
