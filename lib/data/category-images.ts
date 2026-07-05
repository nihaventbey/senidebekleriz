import { readFileSync } from "node:fs";
import { join } from "node:path";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "SeniDeBekleriz/1.0 (kategori-kapak)";

export type CategoryCover = {
  url: string;
  note?: string;
};

type CategoryCoverOverride = {
  url?: string;
  commonsFile?: string;
  note?: string;
};

type OverridesMap = Record<string, CategoryCoverOverride>;

let overridesCache: OverridesMap | null = null;

function loadOverrides(): OverridesMap {
  if (overridesCache) return overridesCache;
  try {
    const path = join(process.cwd(), "data", "category-cover-overrides.json");
    overridesCache = JSON.parse(readFileSync(path, "utf8")) as OverridesMap;
  } catch {
    overridesCache = {};
  }
  return overridesCache;
}

async function resolveCommonsFile(filename: string): Promise<string | null> {
  const apiUrl = `${COMMONS_API}?action=query&titles=${encodeURIComponent(
    `File:${filename}`
  )}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`;

  try {
    const res = await fetch(apiUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { imageinfo?: Array<{ thumburl?: string; url: string }> }
        >;
      };
    };

    const pages = data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    const info = page?.imageinfo?.[0];
    return info?.thumburl || info?.url || null;
  } catch {
    return null;
  }
}

/**
 * Resolves a category cover from data/category-cover-overrides.json.
 */
export async function resolveCategoryCoverImage(
  slug: string
): Promise<CategoryCover | null> {
  const entry = loadOverrides()[slug];
  if (!entry) return null;

  if (entry.url) {
    return { url: entry.url, note: entry.note };
  }

  if (entry.commonsFile) {
    const url = await resolveCommonsFile(entry.commonsFile);
    if (!url) return null;
    return { url, note: entry.note };
  }

  return null;
}

/**
 * Resolves covers for all known category slugs in the overrides file.
 */
export async function resolveAllCategoryCovers(): Promise<
  Record<string, CategoryCover>
> {
  const overrides = loadOverrides();
  const result: Record<string, CategoryCover> = {};

  await Promise.all(
    Object.keys(overrides).map(async (slug) => {
      const cover = await resolveCategoryCoverImage(slug);
      if (cover) result[slug] = cover;
    })
  );

  return result;
}
