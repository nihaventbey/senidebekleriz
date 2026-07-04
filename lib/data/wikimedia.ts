const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export type PlaceImage = {
  url: string;
  alt: string;
  source: "wikimedia" | "unsplash" | "placeholder";
};

const cache = new Map<string, PlaceImage | null>();

function getUnsplashUrl(placeName: string, cityName: string): string {
  const query = encodeURIComponent(`${placeName} ${cityName} Turkey`);
  return `https://source.unsplash.com/800x600/?${query}`;
}

export async function getWikimediaImage(
  wikidataId: string
): Promise<PlaceImage | null> {
  if (cache.has(wikidataId)) return cache.get(wikidataId) || null;

  try {
    const url = `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}&format=json&props=claims`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      cache.set(wikidataId, null);
      return null;
    }

    const data = await res.json();
    const entity = data.entities?.[wikidataId];
    const imageClaim = entity?.claims?.P18?.[0];

    if (!imageClaim?.mainsnak?.datavalue?.value) {
      cache.set(wikidataId, null);
      return null;
    }

    const filename = imageClaim.mainsnak.datavalue.value as string;

    const thumbUrl = `${COMMONS_API}?action=query&titles=${encodeURIComponent("File:" + filename)}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json`;

    const thumbRes = await fetch(thumbUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
      next: { revalidate: 86400 },
    });

    if (!thumbRes.ok) {
      cache.set(wikidataId, null);
      return null;
    }

    const thumbData = await thumbRes.json();
    const pages = thumbData.query?.pages;
    const page = pages ? Object.values(pages)[0] as Record<string, unknown> : null;
    const imageInfo = page?.imageinfo as Array<{ url: string; thumburl: string }> | undefined;

    if (!imageInfo?.[0]) {
      cache.set(wikidataId, null);
      return null;
    }

    const result: PlaceImage = {
      url: imageInfo[0].thumburl || imageInfo[0].url,
      alt: filename.replace(/_/g, " ").replace(/\.[^.]+$/, ""),
      source: "wikimedia",
    };

    cache.set(wikidataId, result);
    return result;
  } catch {
    cache.set(wikidataId, null);
    return null;
  }
}

export async function getPlaceImage(
  wikidataId: string | null,
  placeName: string,
  cityName: string
): Promise<PlaceImage | null> {
  if (wikidataId) {
    const image = await getWikimediaImage(wikidataId);
    if (image) return image;
  }
  return getUnsplashFallback(placeName, cityName);
}

export function getUnsplashFallback(
  placeName: string,
  cityName: string
): PlaceImage {
  return {
    url: getUnsplashUrl(placeName, cityName),
    alt: `${placeName} - ${cityName}`,
    source: "unsplash",
  };
}
