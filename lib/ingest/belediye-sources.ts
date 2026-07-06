import { readFileSync } from "fs";
import { join } from "path";
import { turkeyCities } from "@/data/turkey-cities";

export type BelediyeSource = {
  slug: string;
  name: string;
  baseUrl: string;
  listPaths: string[];
};

type BelediyeOverride = {
  baseUrl?: string;
  listPaths?: string[];
};

const DEFAULT_LIST_PATHS = ["/gezilecek-yerler"];

function loadOverrides(): Record<string, BelediyeOverride> {
  try {
    const path = join(process.cwd(), "data", "belediye-source-overrides.json");
    return JSON.parse(readFileSync(path, "utf8")) as Record<
      string,
      BelediyeOverride
    >;
  } catch {
    return {};
  }
}

export function buildBelediyeSources(): BelediyeSource[] {
  const overrides = loadOverrides();

  return turkeyCities.map((city) => {
    const override = overrides[city.slug];
    return {
      slug: city.slug,
      name: city.name,
      baseUrl: override?.baseUrl ?? `https://${city.slug}.bel.tr`,
      listPaths: override?.listPaths ?? DEFAULT_LIST_PATHS,
    };
  });
}

export function loadBelediyeSources(): BelediyeSource[] {
  const path = join(process.cwd(), "data", "belediye-sources.json");
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BelediyeSource[];
  } catch {
    return buildBelediyeSources();
  }
}

export function getBelediyeSource(slug: string): BelediyeSource | undefined {
  return loadBelediyeSources().find((source) => source.slug === slug);
}
