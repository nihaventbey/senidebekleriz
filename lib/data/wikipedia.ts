const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKI_TR_API = "https://tr.wikipedia.org/w/api.php";

export type WikipediaSummary = {
  title: string;
  extract: string;
  description: string | null;
  thumbnail: string | null;
  pageUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
};

const cache = new Map<string, WikipediaSummary | null>();

async function getWikiTitleFromWikidataId(
  wikidataId: string
): Promise<string | null> {
  const url = `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}&format=json&props=sitelinks&sitefilter=trwiki`;

  const res = await fetch(url, {
    headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const entity = data.entities?.[wikidataId];
  return entity?.sitelinks?.trwiki?.title || null;
}

async function fetchWikipediaPage(
  title: string
): Promise<WikipediaSummary | null> {
  const url = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages|coordinates&exintro=1&explaintext=1&exlimit=1&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;

  const res = await fetch(url, {
    headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const pages = data.query?.pages;
  const page = pages ? (Object.values(pages)[0] as Record<string, unknown>) : null;

  if (!page || page.missing !== undefined) return null;

  const coordinates = page.coordinates as
    | Array<{ lat: number; lon: number }>
    | undefined;

  return {
    title: (page.title as string) || title,
    extract: (page.extract as string) || "",
    description: null,
    thumbnail: (page.thumbnail as { source: string })?.source || null,
    pageUrl: `https://tr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    coordinates: coordinates?.[0]
      ? { lat: coordinates[0].lat, lng: coordinates[0].lon }
      : null,
  };
}

export async function getWikipediaSummary(
  wikidataId: string
): Promise<WikipediaSummary | null> {
  if (cache.has(wikidataId)) return cache.get(wikidataId) || null;

  try {
    const trTitle = await getWikiTitleFromWikidataId(wikidataId);
    if (!trTitle) {
      cache.set(wikidataId, null);
      return null;
    }

    const result = await fetchWikipediaPage(trTitle);
    cache.set(wikidataId, result);
    return result;
  } catch {
    cache.set(wikidataId, null);
    return null;
  }
}

export async function searchWikipediaByName(
  placeName: string,
  cityName: string
): Promise<WikipediaSummary | null> {
  const cacheKey = `search:${placeName}:${cityName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) || null;

  try {
    const searchQuery = `${placeName} ${cityName}`;
    const searchUrl = `${WIKI_TR_API}?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=1&format=json&origin=*`;

    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const searchData = await searchRes.json();
    const firstResult = searchData.query?.search?.[0];

    if (!firstResult?.title) {
      cache.set(cacheKey, null);
      return null;
    }

    const result = await fetchWikipediaPage(firstResult.title);
    cache.set(cacheKey, result);
    return result;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

export async function getPlaceWikipedia(
  wikidataId: string | null,
  placeName: string,
  cityName: string
): Promise<WikipediaSummary | null> {
  if (wikidataId) {
    const result = await getWikipediaSummary(wikidataId);
    if (result?.extract) return result;
  }
  return searchWikipediaByName(placeName, cityName);
}
