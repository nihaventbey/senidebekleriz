import { supabaseAdmin } from "@/lib/supabase/admin";

export type PlaceData = {
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

export async function getPlacesByCity(citySlug: string): Promise<PlaceData[]> {
  const { data: city, error: cityError } = await supabaseAdmin
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (cityError || !city) {
    console.error("getPlacesByCity city error:", cityError?.message);
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("places")
    .select("*")
    .eq("city_id", city.id)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getPlacesByCity error:", error.message);
    return [];
  }

  return (data || []).map((place) => ({
    wikidata_id: place.wikidata_id || "",
    name: place.name,
    slug: place.slug,
    category: "tarihi-yer",
    description: place.description,
    address: null,
    lat: place.lat ? Number(place.lat) : 0,
    lng: place.lng ? Number(place.lng) : 0,
    source: (place.source as "wikidata") || "wikidata",
    tags: {
      type: "",
      typeLabel: "",
    },
  }));
}

export async function getPlaceBySlug(
  citySlug: string,
  placeSlug: string
): Promise<PlaceData | undefined> {
  const places = await getPlacesByCity(citySlug);
  return places.find((place) => place.slug === placeSlug);
}

export async function getAllPlaceSlugs(citySlug: string): Promise<string[]> {
  const places = await getPlacesByCity(citySlug);
  return places.map((place) => place.slug);
}

export async function getPlacesByCategory(
  categorySlug: string
): Promise<Array<PlaceData & { citySlug: string; cityName: string }>> {
  const { data: cities, error: citiesError } = await supabaseAdmin
    .from("cities")
    .select("id, name, slug")
    .eq("is_active", true);

  if (citiesError || !cities) {
    console.error("getPlacesByCategory cities error:", citiesError?.message);
    return [];
  }

  const results: Array<PlaceData & { citySlug: string; cityName: string }> = [];

  // Note: In production, use a proper category relation query.
  // For now, all seeded places are grouped under a default category.
  for (const city of cities) {
    const { data: places, error } = await supabaseAdmin
      .from("places")
      .select("*")
      .eq("city_id", city.id)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("getPlacesByCategory error:", error.message);
      continue;
    }

    for (const place of places || []) {
      results.push({
        wikidata_id: place.wikidata_id || "",
        name: place.name,
        slug: place.slug,
        category: categorySlug,
        description: place.description,
        address: null,
        lat: place.lat ? Number(place.lat) : 0,
        lng: place.lng ? Number(place.lng) : 0,
        source: (place.source as "wikidata") || "wikidata",
        tags: { type: "", typeLabel: "" },
        citySlug: city.slug,
        cityName: city.name,
      });
    }
  }

  return results;
}
