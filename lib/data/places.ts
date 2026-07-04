import { supabaseAdmin } from "@/lib/supabase/admin";

export type PlaceData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  source: string;
  wikidata_id: string | null;
  photos: string[];
  phone: string | null;
  website: string | null;
  opening_hours: Record<string, unknown> | null;
  rating: number | null;
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
    .select(`
      *,
      place_categories(categories(name, slug))
    `)
    .eq("city_id", city.id)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getPlacesByCity error:", error.message);
    return [];
  }

  return (data || []).map((place) => {
    const placeCats = place.place_categories as Array<{ categories: { name: string; slug: string } | null }> | null;
    const firstCat = placeCats?.[0]?.categories;
    return {
      id: place.id,
      name: place.name,
      slug: place.slug,
      category: firstCat?.slug || "tarihi-yer",
      description: place.description,
      address: place.address,
      lat: place.lat ? Number(place.lat) : 0,
      lng: place.lng ? Number(place.lng) : 0,
      source: place.source || "manual",
      wikidata_id: place.wikidata_id || null,
      photos: place.photos || [],
      phone: place.phone || null,
      website: place.website || null,
      opening_hours: place.opening_hours || null,
      rating: place.rating ? Number(place.rating) : null,
      tags: {
        type: "",
        typeLabel: "",
      },
    };
  });
}

export async function getPlaceBySlug(
  citySlug: string,
  placeSlug: string
): Promise<PlaceData | undefined> {
  const places = await getPlacesByCity(citySlug);
  return places.find((place) => place.slug === placeSlug);
}

export async function getAllPlaceSlugs(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select("slug")
    .eq("is_active", true);

  if (error) {
    console.error("getAllPlaceSlugs error:", error.message);
    return [];
  }

  return (data || []).map((place) => place.slug);
}

export async function getPlaceWithCityBySlug(
  slug: string
): Promise<(PlaceData & { citySlug: string; cityName: string }) | undefined> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select(`
      *,
      cities!inner(slug, name),
      place_categories(categories(name, slug))
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("getPlaceWithCityBySlug error:", error?.message);
    return undefined;
  }

  const city = Array.isArray(data.cities)
    ? (data.cities[0] as { slug: string; name: string } | undefined)
    : (data.cities as { slug: string; name: string } | undefined);

  if (!city) {
    console.error("getPlaceWithCityBySlug: city not found");
    return undefined;
  }

  const placeCats = data.place_categories as Array<{ categories: { name: string; slug: string } | null }> | null;
  const firstCat = placeCats?.[0]?.categories;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    category: firstCat?.slug || "tarihi-yer",
    description: data.description,
    address: data.address,
    lat: data.lat ? Number(data.lat) : 0,
    lng: data.lng ? Number(data.lng) : 0,
    source: data.source || "manual",
    wikidata_id: data.wikidata_id || null,
    photos: data.photos || [],
    phone: data.phone || null,
    website: data.website || null,
    opening_hours: data.opening_hours || null,
    rating: data.rating ? Number(data.rating) : null,
    tags: { type: "", typeLabel: "" },
    citySlug: city.slug,
    cityName: city.name,
  };
}

export async function getPlacesByCategory(
  categorySlug: string
): Promise<Array<PlaceData & { citySlug: string; cityName: string }>> {
  const { data: category, error: categoryError } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (categoryError || !category) {
    console.error("getPlacesByCategory category error:", categoryError?.message);
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("place_categories")
    .select(`
      place_id,
      places!inner(*, cities!inner(slug, name))
    `)
    .eq("category_id", category.id)
    .eq("places.is_active", true);

  if (error) {
    console.error("getPlacesByCategory error:", error.message);
    return [];
  }

  const results: Array<PlaceData & { citySlug: string; cityName: string }> = [];

  for (const row of data || []) {
    const place = row.places as unknown as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      address: string | null;
      lat: number;
      lng: number;
      source: string;
      wikidata_id: string | null;
      photos: string[];
      phone: string | null;
      website: string | null;
      opening_hours: Record<string, unknown> | null;
      rating: number | null;
      cities: { slug: string; name: string } | { slug: string; name: string }[];
    } | null;

    if (!place) continue;

    const city = Array.isArray(place.cities) ? place.cities[0] : place.cities;
    if (!city) continue;

    results.push({
      id: place.id,
      name: place.name,
      slug: place.slug,
      category: categorySlug,
      description: place.description,
      address: place.address,
      lat: place.lat ? Number(place.lat) : 0,
      lng: place.lng ? Number(place.lng) : 0,
      source: place.source || "manual",
      wikidata_id: place.wikidata_id || null,
      photos: place.photos || [],
      phone: place.phone || null,
      website: place.website || null,
      opening_hours: place.opening_hours || null,
      rating: place.rating ? Number(place.rating) : null,
      tags: { type: "", typeLabel: "" },
      citySlug: city.slug,
      cityName: city.name,
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlaceCategories(
  placeId: string
): Promise<Array<{ name: string; slug: string; icon: string | null }>> {
  const { data, error } = await supabaseAdmin
    .from("place_categories")
    .select("categories(name, slug, icon)")
    .eq("place_id", placeId);

  if (error || !data) return [];

  return data
    .map((row) => row.categories as unknown as { name: string; slug: string; icon: string | null } | null)
    .filter(Boolean) as Array<{ name: string; slug: string; icon: string | null }>;
}
