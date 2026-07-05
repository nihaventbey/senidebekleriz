import { supabaseAdmin } from "@/lib/supabase/admin";
import { shouldIndexPlace } from "@/lib/content/place-quality";

export type AdminCityData = {
  id: string;
  name: string;
  slug: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  population: number;
  cover_image: string | null;
  cover_image_source: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
};

export async function getAdminCityBySlug(
  slug: string
): Promise<AdminCityData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("getAdminCityBySlug error:", error?.message);
    return undefined;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    region: data.region || "",
    description: data.description || "",
    lat: data.lat ? Number(data.lat) : 0,
    lng: data.lng ? Number(data.lng) : 0,
    population: data.population || 0,
    cover_image: data.cover_image,
    cover_image_source: data.cover_image_source ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    is_active: data.is_active ?? true,
  };
}

export type AdminCategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
};

export async function getAdminCategoryBySlug(
  slug: string
): Promise<AdminCategoryData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("getAdminCategoryBySlug error:", error?.message);
    return undefined;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon || "",
    color: data.color || "",
    is_active: data.is_active ?? true,
  };
}

export type AdminPlaceListItem = {
  id: string;
  name: string;
  slug: string;
  source: string;
  cityName: string;
  is_featured: boolean;
  is_active: boolean;
  hasCover: boolean;
};

export type PlaceGapFilter = "no-cover" | "thin" | "not-indexable";

export type AdminPlacesPageResult = {
  items: AdminPlaceListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

function mapAdminPlaceRow(p: {
  id: string;
  name: string;
  slug: string;
  source: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  cover_image: string | null;
  cities: { name: string }[] | { name: string } | null;
}): AdminPlaceListItem {
  const cities = p.cities;
  const cityName = Array.isArray(cities)
    ? cities[0]?.name || ""
    : cities?.name || "";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    source: p.source || "manual",
    cityName,
    is_featured: p.is_featured ?? false,
    is_active: p.is_active ?? true,
    hasCover: Boolean(p.cover_image),
  };
}

const PLACE_LIST_COLUMNS =
  "id, name, slug, source, is_featured, is_active, cover_image, description, cities(name)";

async function resolveCityId(citySlug: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();
  return data?.id ?? null;
}

export async function getAdminPlacesPaginated(options: {
  page?: number;
  limit?: number;
  q?: string;
  citySlug?: string;
  source?: string;
  gap?: PlaceGapFilter;
}): Promise<AdminPlacesPageResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 30));
  const offset = (page - 1) * limit;

  // Content-based gap filters (thin / not-indexable) cannot be expressed as a
  // single SQL predicate, so we fetch matching rows and filter in memory.
  if (options.gap === "thin" || options.gap === "not-indexable") {
    return getPlacesByContentGap(options, page, limit, offset);
  }

  let query = supabaseAdmin
    .from("places")
    .select(PLACE_LIST_COLUMNS, { count: "exact" });

  if (options.q?.trim()) {
    query = query.ilike("name", `%${options.q.trim()}%`);
  }

  if (options.citySlug) {
    const cityId = await resolveCityId(options.citySlug);
    if (cityId) query = query.eq("city_id", cityId);
  }

  if (options.source) {
    query = query.eq("source", options.source);
  }

  if (options.gap === "no-cover") {
    query = query.is("cover_image", null);
  }

  const { data, error, count } = await query
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("getAdminPlacesPaginated error:", error.message);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items = (data || []).map(mapAdminPlaceRow);
  const total = count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

async function getPlacesByContentGap(
  options: { q?: string; citySlug?: string; source?: string; gap?: PlaceGapFilter },
  page: number,
  limit: number,
  offset: number
): Promise<AdminPlacesPageResult> {
  let query = supabaseAdmin
    .from("places")
    .select(PLACE_LIST_COLUMNS)
    .eq("is_active", true);

  if (options.q?.trim()) {
    query = query.ilike("name", `%${options.q.trim()}%`);
  }

  if (options.citySlug) {
    const cityId = await resolveCityId(options.citySlug);
    if (cityId) query = query.eq("city_id", cityId);
  }

  if (options.source) {
    query = query.eq("source", options.source);
  }

  const { data, error } = await query.order("name");

  if (error) {
    console.error("getPlacesByContentGap error:", error.message);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const matched = (data || []).filter((p) => {
    if (options.gap === "thin") {
      const words = (p.description || "").trim().split(/\s+/).filter(Boolean);
      return words.length < 150;
    }
    // not-indexable
    return !shouldIndexPlace({
      description: p.description,
      source: p.source,
      is_featured: p.is_featured,
    });
  });

  const total = matched.length;
  const items = matched.slice(offset, offset + limit).map(mapAdminPlaceRow);

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

/** @deprecated Use getAdminPlacesPaginated instead */
export async function getAdminPlaces(): Promise<AdminPlaceListItem[]> {
  const result = await getAdminPlacesPaginated({ page: 1, limit: 50 });
  return result.items;
}

export type AdminPlaceData = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  source: string;
  cover_image: string | null;
  cover_image_source: string | null;
  meta_title: string | null;
  meta_description: string | null;
  cityName: string;
  is_active: boolean;
  is_featured: boolean;
};

export async function getAdminPlaceBySlug(
  slug: string
): Promise<AdminPlaceData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select("*, cities(name)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("getAdminPlaceBySlug error:", error?.message);
    return undefined;
  }

  const cities = data.cities as { name: string }[] | { name: string } | null;
  const cityName = Array.isArray(cities)
    ? cities[0]?.name || ""
    : cities?.name || "";

  return {
    id: data.id,
    city_id: data.city_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    address: data.address,
    lat: data.lat ? Number(data.lat) : 0,
    lng: data.lng ? Number(data.lng) : 0,
    source: data.source || "manual",
    cover_image: data.cover_image,
    cover_image_source: data.cover_image_source ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    cityName,
    is_active: data.is_active ?? true,
    is_featured: data.is_featured ?? false,
  };
}

export async function getAdminPlaceCategory(
  placeId: string
): Promise<string | undefined> {
  const { data, error } = await supabaseAdmin
    .from("place_categories")
    .select("categories(slug)")
    .eq("place_id", placeId)
    .single();

  if (error || !data) return undefined;

  const categories = data.categories as { slug: string }[] | null;
  return categories?.[0]?.slug;
}

export type AdminPageData = {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
};

export async function getAdminPageBySlug(
  slug: string
): Promise<AdminPageData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("getAdminPageBySlug error:", error?.message);
    return undefined;
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content || "",
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    is_published: data.is_published ?? false,
  };
}

export type AdminAdPlacementData = {
  id: string;
  name: string;
  position: string;
  ad_unit_id: string | null;
  is_active: boolean;
};

export async function getAdminAdPlacementById(
  id: string
): Promise<AdminAdPlacementData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("ad_placements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("getAdminAdPlacementById error:", error?.message);
    return undefined;
  }

  return {
    id: data.id,
    name: data.name,
    position: data.position,
    ad_unit_id: data.ad_unit_id,
    is_active: data.is_active ?? true,
  };
}

export async function getAdminAdPlacements(): Promise<AdminAdPlacementData[]> {
  const { data, error } = await supabaseAdmin
    .from("ad_placements")
    .select("*")
    .order("name");

  if (error) {
    console.error("getAdminAdPlacements error:", error.message);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    ad_unit_id: p.ad_unit_id,
    is_active: p.is_active ?? true,
  }));
}
