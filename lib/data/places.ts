import { supabaseAdmin } from "@/lib/supabase/admin";
import { shouldIndexPlace } from "@/lib/content/place-quality";

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
  cover_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
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

function mapPlaceRow(
  place: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    lat: number | string | null;
    lng: number | string | null;
    source: string | null;
    wikidata_id: string | null;
    cover_image: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    is_featured: boolean | null;
    photos: string[] | null;
    phone: string | null;
    website: string | null;
    opening_hours: Record<string, unknown> | null;
    rating: number | string | null;
    place_categories?: Array<{ categories: { name: string; slug: string } | null }> | null;
  },
  categoryFallback = "tarihi-yer"
): PlaceData {
  const placeCats = place.place_categories;
  const firstCat = placeCats?.[0]?.categories;

  return {
    id: place.id,
    name: place.name,
    slug: place.slug,
    category: firstCat?.slug || categoryFallback,
    description: place.description,
    address: place.address,
    lat: place.lat ? Number(place.lat) : 0,
    lng: place.lng ? Number(place.lng) : 0,
    source: place.source || "manual",
    wikidata_id: place.wikidata_id || null,
    cover_image: place.cover_image || null,
    meta_title: place.meta_title ?? null,
    meta_description: place.meta_description ?? null,
    is_featured: place.is_featured ?? false,
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
}

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
    .order("is_featured", { ascending: false })
    .order("name");

  if (error) {
    console.error("getPlacesByCity error:", error.message);
    return [];
  }

  return (data || []).map((place) => mapPlaceRow(place));
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
    ...mapPlaceRow({ ...data, place_categories: placeCats }, firstCat?.slug || "tarihi-yer"),
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
      cover_image: string | null;
      is_featured: boolean | null;
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
      ...mapPlaceRow(
        {
          ...place,
          place_categories: [{ categories: { name: "", slug: categorySlug } }],
        },
        categorySlug
      ),
      citySlug: city.slug,
      cityName: city.name,
    });
  }

  return results.sort((a, b) => {
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function getFeaturedPlaces(
  limit = 6
): Promise<Array<PlaceData & { citySlug: string; cityName: string }>> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select(`
      *,
      cities!inner(slug, name),
      place_categories(categories(name, slug))
    `)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("name")
    .limit(limit);

  if (error) {
    console.error("getFeaturedPlaces error:", error.message);
    return [];
  }

  return (data || []).map((row) => {
    const city = Array.isArray(row.cities)
      ? (row.cities[0] as { slug: string; name: string } | undefined)
      : (row.cities as { slug: string; name: string } | undefined);

    return {
      ...mapPlaceRow(row),
      citySlug: city?.slug || "",
      cityName: city?.name || "",
    };
  });
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

export async function getIndexablePlacesForSitemap(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select("slug, updated_at, description, source, is_featured, cover_image")
    .eq("is_active", true);

  if (error) {
    console.error("getIndexablePlacesForSitemap error:", error.message);
    return [];
  }

  return (data || [])
    .filter((place) =>
      shouldIndexPlace({
        description: place.description,
        source: place.source,
        is_featured: place.is_featured,
        cover_image: place.cover_image,
      })
    )
    .map((place) => ({
      slug: place.slug,
      updatedAt: place.updated_at,
    }));
}

export async function countIndexablePlacesByCitySlug(
  citySlug: string
): Promise<number> {
  const places = await getPlacesByCity(citySlug);
  return places.filter((place) =>
    shouldIndexPlace({
      description: place.description,
      source: place.source,
      is_featured: place.is_featured,
      cover_image: place.cover_image,
    })
  ).length;
}

export async function getIndexablePlaceCountsByCity(): Promise<
  Map<string, number>
> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select("description, source, is_featured, cover_image, cities!inner(slug)")
    .eq("is_active", true);

  const counts = new Map<string, number>();
  if (error) {
    console.error("getIndexablePlaceCountsByCity error:", error.message);
    return counts;
  }

  for (const row of data || []) {
    const city = Array.isArray(row.cities)
      ? (row.cities[0] as { slug: string } | undefined)
      : (row.cities as { slug: string } | undefined);
    const citySlug = city?.slug;
    if (!citySlug) continue;
    if (
      !shouldIndexPlace({
        description: row.description,
        source: row.source,
        is_featured: row.is_featured,
        cover_image: row.cover_image,
      })
    ) {
      continue;
    }
    counts.set(citySlug, (counts.get(citySlug) || 0) + 1);
  }

  return counts;
}
