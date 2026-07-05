import { readFileSync } from "node:fs";
import { join } from "node:path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWikimediaImage } from "@/lib/data/wikimedia";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKI_TR_API = "https://tr.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PROVINCE_OF_TURKEY = "Q15284";
const USER_AGENT = "SeniDeBekleriz/1.0 (veri-zenginlestirme)";

export type CityCoverSource =
  | "override"
  | "wikidata"
  | "wikipedia"
  | "featured";

export type CityCoverCandidate = {
  url: string;
  source: CityCoverSource;
  note?: string;
};

type CityCoverOverride = {
  url?: string;
  commonsFile?: string;
  credit?: string;
  note?: string;
};

type OverridesMap = Record<string, CityCoverOverride>;

let overridesCache: OverridesMap | null = null;

function loadOverrides(): OverridesMap {
  if (overridesCache) return overridesCache;
  try {
    const path = join(process.cwd(), "data", "city-cover-overrides.json");
    overridesCache = JSON.parse(readFileSync(path, "utf8")) as OverridesMap;
  } catch {
    overridesCache = {};
  }
  return overridesCache;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function resolveCommonsFile(filename: string): Promise<string | null> {
  const apiUrl = `${COMMONS_API}?action=query&titles=${encodeURIComponent(
    `File:${filename}`
  )}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`;

  const data = await fetchJson<{
    query?: {
      pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url: string }> }>;
    };
  }>(apiUrl);

  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

async function resolveOverride(slug: string): Promise<CityCoverCandidate | null> {
  const entry = loadOverrides()[slug];
  if (!entry) return null;

  if (entry.url) {
    return {
      url: entry.url,
      source: "override",
      note: entry.note,
    };
  }

  if (entry.commonsFile) {
    const url = await resolveCommonsFile(entry.commonsFile);
    if (!url) return null;
    return {
      url,
      source: "override",
      note: entry.note,
    };
  }

  return null;
}

async function findProvinceWikidataId(cityName: string): Promise<string | null> {
  const searchUrl = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(
    `${cityName} ili`
  )}&language=tr&format=json&limit=8`;

  const searchData = await fetchJson<{
    search?: Array<{ id: string; label: string }>;
  }>(searchUrl);

  const ids = searchData?.search?.map((item) => item.id) || [];
  if (ids.length === 0) return null;

  const entitiesUrl = `${WIKIDATA_API}?action=wbgetentities&ids=${ids.join(
    "|"
  )}&props=claims&format=json`;

  const entitiesData = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P31?: Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>;
        };
      }
    >;
  }>(entitiesUrl);

  for (const id of ids) {
    const claims = entitiesData?.entities?.[id]?.claims?.P31 || [];
    const isProvince = claims.some(
      (claim) => claim.mainsnak?.datavalue?.value?.id === PROVINCE_OF_TURKEY
    );
    if (isProvince) return id;
  }

  return ids[0] || null;
}

async function resolveWikidataCover(
  cityName: string,
  wikidataId?: string | null
): Promise<CityCoverCandidate | null> {
  const entityId = wikidataId || (await findProvinceWikidataId(cityName));
  if (!entityId) return null;

  const image = await getWikimediaImage(entityId);
  if (!image) return null;

  return {
    url: image.url,
    source: "wikidata",
    note: image.alt,
  };
}

async function resolveWikipediaCover(
  cityName: string
): Promise<CityCoverCandidate | null> {
  const queries = [`${cityName} ili`, cityName];

  for (const query of queries) {
    const searchUrl = `${WIKI_TR_API}?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=1&format=json&origin=*`;

    const searchData = await fetchJson<{
      query?: { search?: Array<{ title: string }> };
    }>(searchUrl);

    const title = searchData?.query?.search?.[0]?.title;
    if (!title) continue;

    const pageUrl = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(
      title
    )}&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;

    const pageData = await fetchJson<{
      query?: { pages?: Record<string, { thumbnail?: { source: string } }> };
    }>(pageUrl);

    const pages = pageData?.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    const thumbnail = page?.thumbnail?.source;
    if (!thumbnail) continue;

    return {
      url: thumbnail,
      source: "wikipedia",
      note: title,
    };
  }

  return null;
}

async function resolveFeaturedPlaceCover(
  citySlug: string
): Promise<CityCoverCandidate | null> {
  const { data: city } = await supabaseAdmin
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!city) return null;

  const { data: place } = await supabaseAdmin
    .from("places")
    .select("cover_image, name")
    .eq("city_id", city.id)
    .eq("is_active", true)
    .eq("is_featured", true)
    .not("cover_image", "is", null)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (!place?.cover_image) return null;

  return {
    url: place.cover_image,
    source: "featured",
    note: place.name,
  };
}

export type ResolveCityCoverInput = {
  slug: string;
  name: string;
  wikidataId?: string | null;
};

/**
 * Hybrid resolver: override JSON → Wikidata P18 → TR Wikipedia → featured place.
 */
export async function resolveCityCoverImage(
  input: ResolveCityCoverInput
): Promise<CityCoverCandidate | null> {
  const resolvers = [
    () => resolveOverride(input.slug),
    () => resolveWikidataCover(input.name, input.wikidataId),
    () => resolveWikipediaCover(input.name),
    () => resolveFeaturedPlaceCover(input.slug),
  ];

  for (const resolve of resolvers) {
    const candidate = await resolve();
    if (candidate?.url) return candidate;
  }

  return null;
}
