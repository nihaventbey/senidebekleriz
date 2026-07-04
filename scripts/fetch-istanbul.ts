import fs from "fs/promises";
import path from "path";

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

const WIKIDATA_QUERY = `
SELECT DISTINCT ?place ?placeLabel ?coord ?type ?typeLabel ?description WHERE {
  ?place wdt:P131* wd:Q406 .
  ?place wdt:P625 ?coord .
  ?place wdt:P31 ?type .
  OPTIONAL { ?place schema:description ?description . FILTER(LANG(?description) = "tr") }
  FILTER(?type IN (
    wd:Q570116,   # tourist attraction
    wd:Q33506,    # museum
    wd:Q1457376,  # mosque
    wd:Q22698,    # park
    wd:Q421092,   # historical site
    wd:Q811979,   # archaeological site
    wd:Q1637706,  # church building
    wd:Q15275882, # neighborhood
    wd:Q123705    # palace
  ))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}
LIMIT 200
`;

const CATEGORY_MAP: Record<string, string> = {
  "http://www.wikidata.org/entity/Q33506": "muzeler",
  "http://www.wikidata.org/entity/Q22698": "parklar",
};

const DEFAULT_CATEGORY = "tarihi-yer";

type WikidataBinding = {
  place: { value: string };
  placeLabel: { value: string; "xml:lang"?: string };
  coord: { value: string };
  type: { value: string };
  typeLabel?: { value: string };
  description?: { value: string };
};

type WikidataResponse = {
  results: {
    bindings: WikidataBinding[];
  };
};

type PlaceRecord = {
  wikidata_id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: null;
  lat: number;
  lng: number;
  source: "wikidata";
  tags: {
    type: string;
    typeLabel: string;
  };
};

function slugify(name: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "C",
    Ğ: "G",
    İ: "I",
    Ö: "O",
    Ş: "S",
    Ü: "U",
  };
  return name
    .split("")
    .map((c) => map[c] || c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCoord(wkt: string): { lat: number; lng: number } {
  const match = wkt.match(/Point\s*\(\s*([\d.\-]+)\s+([\d.\-]+)\s*\)/);
  if (!match) throw new Error(`Invalid WKT: ${wkt}`);
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

async function fetchPlaces(): Promise<PlaceRecord[]> {
  const url = new URL(WIKIDATA_SPARQL_URL);
  url.searchParams.append("query", WIKIDATA_QUERY);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "SeniDeBekleriz/1.0 (contact@senidebekleriz.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`Wikidata API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as WikidataResponse;

  const seenSlugs = new Set<string>();
  const records: PlaceRecord[] = [];

  for (const binding of data.results.bindings) {
    const name = binding.placeLabel.value.trim();
    if (!name) continue;

    const { lat, lng } = parseCoord(binding.coord.value);
    const wikidataId = binding.place.value.replace(
      "http://www.wikidata.org/entity/",
      ""
    );
    const category = CATEGORY_MAP[binding.type.value] || DEFAULT_CATEGORY;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 2;
    while (seenSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    seenSlugs.add(slug);

    records.push({
      wikidata_id: wikidataId,
      name,
      slug,
      category,
      description: binding.description?.value || null,
      address: null,
      lat,
      lng,
      source: "wikidata",
      tags: {
        type: binding.type.value,
        typeLabel: binding.typeLabel?.value || "",
      },
    });
  }

  return records;
}

async function main() {
  console.log("İstanbul mekanları Wikidata'dan çekiliyor...");
  const places = await fetchPlaces();
  console.log(`${places.length} mekan bulundu.`);

  const outputPath = path.join(process.cwd(), "data", "istanbul-places.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(places, null, 2), "utf-8");
  console.log(`Veri kaydedildi: ${outputPath}`);

  const categoryCounts = places.reduce((acc, place) => {
    acc[place.category] = (acc[place.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log("Kategori dağılımı:", categoryCounts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
