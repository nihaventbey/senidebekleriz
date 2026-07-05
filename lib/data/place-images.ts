import { getWikimediaImage, getUnsplashFallback } from "@/lib/data/wikimedia";
import type { PlaceImage } from "@/lib/data/wikimedia";
import { getPlaceWikipedia } from "@/lib/data/wikipedia";

export async function getPlaceImageServerSide(
  wikidataId: string | null,
  placeName: string,
  cityName: string,
  coverImage?: string | null,
  options?: { allowUnsplashFallback?: boolean }
): Promise<PlaceImage | null> {
  if (coverImage) {
    return {
      url: coverImage,
      alt: placeName,
      source: "manual",
    };
  }

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

  // Unsplash is a generic stock fallback; keep it off indexable pages so that
  // Google-facing content only shows real, place-specific imagery.
  if (options?.allowUnsplashFallback === false) return null;

  return getUnsplashFallback(placeName, cityName);
}
