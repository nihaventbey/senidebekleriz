import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKI_TR_API = "https://tr.wikipedia.org/w/api.php";

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "50");
const DELAY_MS = parseInt(process.env.DELAY_MS || "1000");
const MIN_CHARS = parseInt(process.env.MIN_CHARS || "50");

type WikiResult = {
  wikidata_id: string | null;
  description: string | null;
  opening_hours: Record<string, string> | null;
  phone: string | null;
  website: string | null;
  address: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchWikipedia(placeName: string, cityName: string): Promise<string | null> {
  try {
    const query = `${placeName} ${cityName} Türkiye`;
    const url = `${WIKI_TR_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.query?.search?.[0]?.title || null;
  } catch {
    return null;
  }
}

async function getWikipediaExtract(title: string): Promise<{ extract: string; thumbnail: string | null } | null> {
  try {
    const url = `${WIKI_TR_API}?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages&exintro=1&explaintext=1&exlimit=1&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const pages = data.query?.pages;
    const page = pages ? (Object.values(pages)[0] as Record<string, unknown>) : null;

    if (!page || page.missing !== undefined) return null;

    return {
      extract: (page.extract as string) || "",
      thumbnail: (page.thumbnail as { source: string })?.source || null,
    };
  } catch {
    return null;
  }
}

async function getWikidataEntity(wikidataId: string): Promise<Record<string, unknown> | null> {
  try {
    const url = `${WIKIDATA_API}?action=wbgetentities&ids=${encodeURIComponent(wikidataId)}&format=json&props=claims|sitelinks&sitefilter=trwiki`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SeniDeBekleriz/1.0 (veri-zenginlestirme)" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.entities?.[wikidataId] || null;
  } catch {
    return null;
  }
}

function extractEntityData(entity: Record<string, unknown>): Partial<WikiResult> {
  const claims = entity.claims as Record<string, unknown[]> | undefined;
  if (!claims) return {};

  const result: Partial<WikiResult> = {};

  // P18 - Image (we already handle this separately)

  // P31 - Instance of (for description)
  const instanceOf = claims.P31?.[0] as { mainsnak?: { datavalue?: { value: { id: string } } } } | undefined;
  if (instanceOf?.mainsnak?.datavalue?.value?.id) {
    // We can use this for category mapping
  }

  // P625 - Coordinate location
  // P17 - Country
  // P131 - Located in admin area

  // P11286 - Wikipedia page (already handled via sitelinks)

  return result;
}

async function enrichPlace(
  place: {
    id: string;
    name: string;
    slug: string;
    city_name: string;
    wikidata_id: string | null;
    description: string | null;
    address: string | null;
  }
): Promise<WikiResult | null> {
  let wikidataId = place.wikidata_id;
  let wikiTitle: string | null = null;

  // Step 1: Try to find Wikipedia article by name
  wikiTitle = await searchWikipedia(place.name, place.city_name);

  if (wikiTitle) {
    // Step 2: Get extract
    const extract = await getWikipediaExtract(wikiTitle);
    if (extract && extract.extract.length > MIN_CHARS) {
      return {
        wikidata_id: wikidataId,
        description: extract.extract,
        opening_hours: null,
        phone: null,
        website: null,
        address: place.address,
      };
    }
  }

  // Step 3: If we have wikidata_id, try to get more data
  if (wikidataId) {
    const entity = await getWikidataEntity(wikidataId);
    if (entity) {
      // Try to get Turkish Wikipedia title from sitelinks
      const sitelinks = entity.sitelinks as Record<string, { title: string }> | undefined;
      const trTitle = sitelinks?.trwiki?.title;

      if (trTitle && trTitle !== wikiTitle) {
        const extract = await getWikipediaExtract(trTitle);
        if (extract && extract.extract.length > MIN_CHARS) {
          return {
            wikidata_id: wikidataId,
            description: extract.extract,
            opening_hours: null,
            phone: null,
            website: null,
            address: place.address,
          };
        }
      }
    }
  }

  return null;
}

async function main() {
  console.log("=== Wikipedia Zenginleştirme Scripti ===");
  console.log(`Batch size: ${BATCH_SIZE}, Delay: ${DELAY_MS}ms, Min chars: ${MIN_CHARS}`);
  console.log("");

  // Get places that need enrichment (no description or short description)
  const { data: places, error } = await supabase
    .from("places")
    .select(`
      id, name, slug, wikidata_id, description, address, phone,
      cities!inner(name)
    `)
    .eq("is_active", true)
    .or("description.is.null,description.length.lt.100")
    .order("name")
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Veritabanı hatası:", error.message);
    return;
  }

  if (!places || places.length === 0) {
    console.log("Zenginleştirilecek mekan bulunamadı.");
    return;
  }

  console.log(`${places.length} mekan zenginleştirilecek...`);
  console.log("");

  let enriched = 0;
  let skipped = 0;

  for (const place of places) {
    const city = Array.isArray(place.cities) ? place.cities[0] : place.cities;
    const cityName = (city as { name: string })?.name || "";

    process.stdout.write(`[${place.name}] ${cityName}... `);

    const result = await enrichPlace({
      ...place,
      city_name: cityName,
    });

    if (result && result.description && result.description.length > MIN_CHARS) {
      // Update the place
      const { error: updateError } = await supabase
        .from("places")
        .update({
          description: result.description,
          address: result.address || place.address,
          phone: result.phone || place.phone || null,
          website: result.website || null,
          opening_hours: result.opening_hours || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", place.id);

      if (updateError) {
        console.log(`HATA: ${updateError.message}`);
      } else {
        console.log(`OK (${result.description.length} karakter)`);
        enriched++;
      }
    } else {
      console.log("ATLADI (veri bulunamadı)");
      skipped++;
    }

    await sleep(DELAY_MS);
  }

  console.log("");
  console.log("=== Tamamlandı ===");
  console.log(`Zenginleştirilen: ${enriched}`);
  console.log(`Atılan: ${skipped}`);
}

// Run
main().catch(console.error);
