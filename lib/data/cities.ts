import { supabaseAdmin } from "@/lib/supabase/admin";

export type CityData = {
  id: string;
  name: string;
  slug: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  coverImage: string | null;
};

export async function getAllCities(): Promise<CityData[]> {
  const { data, error } = await supabaseAdmin
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getAllCities error:", error.message);
    return [];
  }

  return (data || []).map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    region: city.region || "",
    description: city.description || "",
    lat: city.lat ? Number(city.lat) : 0,
    lng: city.lng ? Number(city.lng) : 0,
    coverImage: city.cover_image,
  }));
}

export async function getCityBySlug(slug: string): Promise<CityData | undefined> {
  const { data, error } = await supabaseAdmin
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("getCityBySlug error:", error?.message);
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
    coverImage: data.cover_image,
  };
}
