import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { turkeyCities } from "../data/turkey-cities";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
};

type OverpassResponse = {
  elements: OsmElement[];
};

function slugify(text: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return text
    .replace(/[çğışüÇĞİŞÜöÖ]/g, (m) => map[m] || m)
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categorizePlace(tags: Record<string, string>): string | null {
  if (tags.tourism === "museum") return "muzeler";
  if (
    tags.tourism === "gallery" ||
    tags.tourism === "arts_centre" ||
    tags.amenity === "arts_centre" ||
    tags.amenity === "theatre" ||
    tags.amenity === "cinema"
  ) {
    return "sanat-mekanlari";
  }
  if (
    tags.historic ||
    tags.tourism === "attraction" ||
    tags.tourism === "artwork" ||
    tags.tourism === "monument"
  ) {
    return "tarihi-yer";
  }
  if (
    tags.leisure === "park" ||
    tags.leisure === "garden" ||
    tags.tourism === "viewpoint" ||
    tags.natural === "peak"
  ) {
    return "parklar";
  }
  return null;
}

function buildQuery(lat: number, lng: number, radius: number): string {
  return `[out:json][timeout:60];
(
  node["tourism"~"museum|attraction|artwork|gallery|viewpoint|monument|arts_centre"](around:${radius},${lat},${lng});
  way["tourism"~"museum|attraction|artwork|gallery|viewpoint|monument|arts_centre"](around:${radius},${lat},${lng});
  node["historic"](around:${radius},${lat},${lng});
  way["historic"](around:${radius},${lat},${lng});
  node["leisure"~"park|garden"](around:${radius},${lat},${lng});
  way["leisure"~"park|garden"](around:${radius},${lat},${lng});
  node["amenity"~"arts_centre|theatre|cinema"](around:${radius},${lat},${lng});
  way["amenity"~"arts_centre|theatre|cinema"](around:${radius},${lat},${lng});
);
out center 300;`;
}

async function fetchPlacesForCity(city: (typeof turkeyCities)[0]): Promise<void> {
  const { data: cityRow } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", city.slug)
    .single();

  if (!cityRow) {
    console.error(`  ❌ ${city.name} şehri veritabanında bulunamadı`);
    return;
  }

  const radius = 15000;
  const query = buildQuery(city.lat, city.lng, radius);

  console.log(`  🔄 Overpass sorgulanıyor: ${city.name} (r=${radius}m)...`);

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SeniDeBekleriz/1.0 (contact@senidebekleriz.com)",
    },
  });

  if (!response.ok) {
    console.error(`  ❌ Overpass hatası: ${response.status}`);
    return;
  }

  const data: OverpassResponse = await response.json();
  console.log(`  📦 ${data.elements.length} ham eleman bulundu`);

  const places: Array<{
    city_id: string;
    name: string;
    slug: string;
    description: string | null;
    lat: number;
    lng: number;
    source: string;
    wikidata_id: string | null;
    is_active: boolean;
    is_featured: boolean;
  }> = [];

  const placeCategories: Array<{ place_slug: string; category_slug: string }> = [];

  const seenSlugs = new Set<string>();

  for (const el of data.elements) {
    if (!el.tags || !el.tags.name) continue;

    const categorySlug = categorizePlace(el.tags);
    if (!categorySlug) continue;

    const lat = el.type === "way" && el.center ? el.center.lat : el.lat;
    const lng = el.type === "way" && el.center ? el.center.lon : el.lon;
    if (!lat || !lng) continue;

    let slug = slugify(el.tags.name);
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${el.id}`;
    }
    seenSlugs.add(slug);

    const description = el.tags.description || el.tags["name:en"] || el.tags.wikipedia || null;

    places.push({
      city_id: cityRow.id,
      name: el.tags.name,
      slug,
      description,
      lat: parseFloat(lat.toFixed(7)),
      lng: parseFloat(lng.toFixed(7)),
      source: "osm",
      wikidata_id: el.tags.wikidata || null,
      is_active: true,
      is_featured: false,
    });

    placeCategories.push({ place_slug: slug, category_slug: categorySlug });
  }

  if (places.length === 0) {
    console.log(`  ℹ️  ${city.name} için mekan bulunamadı`);
    return;
  }

  const { error: placeError } = await supabase
    .from("places")
    .upsert(places, { onConflict: "slug" });

  if (placeError) {
    console.error(`  ❌ Places insert hatası: ${placeError.message}`);
    return;
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, slug");

  const categoryMap = new Map(categoryRows?.map((c) => [c.slug, c.id]) || []);

  const { data: placeRows } = await supabase
    .from("places")
    .select("id, slug")
    .in("slug", places.map((p) => p.slug));

  const placeMap = new Map(placeRows?.map((p) => [p.slug, p.id]) || []);

  const pcRows: Array<{ place_id: string; category_id: string }> = [];
  for (const pc of placeCategories) {
    const placeId = placeMap.get(pc.place_slug);
    const categoryId = categoryMap.get(pc.category_slug);
    if (placeId && categoryId) {
      pcRows.push({ place_id: placeId, category_id: categoryId });
    }
  }

  if (pcRows.length > 0) {
    await supabase
      .from("place_categories")
      .upsert(pcRows, { onConflict: "place_id, category_id" });
  }

  console.log(`  ✅ ${places.length} mekan eklendi (${city.name})`);
}

async function main() {
  const target = process.argv[2];

  const cities = target && target !== "all"
    ? turkeyCities.filter((c) => c.slug === target)
    : turkeyCities;

  if (cities.length === 0) {
    console.error("Şehir bulunamadı:", target);
    process.exit(1);
  }

  console.log(`\n🚀 ${cities.length} şehir için Overpass API'den mekan çekiliyor...\n`);

  let total = 0;
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    console.log(`\n[${i + 1}/${cities.length}] ${city.name} (${city.region})`);

    try {
      await fetchPlacesForCity(city);
      total++;
    } catch (err) {
      console.error(`  ❌ Hata:`, err instanceof Error ? err.message : err);
    }

    if (i < cities.length - 1) {
      console.log("  ⏳ Rate limit için bekleniyor (3sn)...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n🎉 Tamamlandı! ${total}/${cities.length} şehir işlendi.`);
}

main().catch((err) => {
  console.error("\n❌ Fatal hata:", err);
  process.exit(1);
});
