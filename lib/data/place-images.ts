import { getWikimediaImage, getUnsplashFallback } from "@/lib/data/wikimedia";
import type { PlaceImage } from "@/lib/data/wikimedia";
import { getPlaceWikipedia } from "@/lib/data/wikipedia";

export async function getPlaceImageServerSide(
  wikidataId: string | null,
  placeName: string,
  cityName: string
): Promise<PlaceImage> {
  if (wikidataId) {
    const image = await getWikimediaImage(wikidataId);
    if (image) return image;
  }

  const wiki = await getPlaceWikipedia(wikidataId, placeName, cityName);
  if (wiki?.thumbnail) {
    return {
      url: wiki.thumbnail,
      alt: wiki.title || placeName,
      source: "wikimedia",
    };
  }

  return getUnsplashFallback(placeName, cityName);
}
