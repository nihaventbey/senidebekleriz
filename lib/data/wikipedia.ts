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

    const url = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(trTitle)}&prop=extracts|pageimages|coordinates&exintro=1&explaintext=1&exlimit=1&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (gezi-rehberi)" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      cache.set(wikidataId, null);
      return null;
    }

    const data = await res.json();
    const pages = data.query?.pages;
    const page = pages ? Object.values(pages)[0] as Record<string, unknown> : null;

    if (!page || page.missing !== undefined) {
      cache.set(wikidataId, null);
      return null;
    }

    const coordinates = page.coordinates as Array<{ lat: number; lon: number }> | undefined;

    const result: WikipediaSummary = {
      title: (page.title as string) || trTitle,
      extract: (page.extract as string) || "",
      description: null,
      thumbnail: (page.thumbnail as { source: string })?.source || null,
      pageUrl: `https://tr.wikipedia.org/wiki/${encodeURIComponent(trTitle)}`,
      coordinates: coordinates?.[0]
        ? { lat: coordinates[0].lat, lng: coordinates[0].lon }
        : null,
    };

    cache.set(wikidataId, result);
    return result;
  } catch {
    cache.set(wikidataId, null);
    return null;
  }
}
