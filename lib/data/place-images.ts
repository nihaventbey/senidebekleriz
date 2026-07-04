import { getWikimediaImage, getUnsplashFallback } from "@/lib/data/wikimedia";
import type { PlaceImage } from "@/lib/data/wikimedia";

export async function getPlaceImageServerSide(
  wikidataId: string | null,
  placeName: string,
  cityName: string
): Promise<PlaceImage> {
  if (wikidataId) {
    const image = await getWikimediaImage(wikidataId);
    if (image) return image;
  }

  return getUnsplashFallback(placeName, cityName);
}
