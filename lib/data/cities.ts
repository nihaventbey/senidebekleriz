import { supabaseAdmin } from "@/lib/supabase/admin";
import { turkeyCities } from "@/data/turkey-cities";

export type CityData = {
  id: string;
  name: string;
  slug: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export async function getAllCities(): Promise<CityData[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error || !data || data.length === 0) {
      if (error) console.error("getAllCities error:", error.message);
      return turkeyCities.map((c) => ({
        id: c.slug,
        name: c.name,
        slug: c.slug,
        region: c.region || "",
        description: c.description || "",
        lat: c.lat ? Number(c.lat) : 0,
        lng: c.lng ? Number(c.lng) : 0,
        coverImage: null,
        metaTitle: null,
        metaDescription: null,
      }));
    }

    return data.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      region: city.region || "",
      description: city.description || "",
      lat: city.lat ? Number(city.lat) : 0,
      lng: city.lng ? Number(city.lng) : 0,
      coverImage: city.cover_image,
      metaTitle: city.meta_title ?? null,
      metaDescription: city.meta_description ?? null,
    }));
  } catch (err) {
    console.error("getAllCities exception:", err);
    return turkeyCities.map((c) => ({
      id: c.slug,
      name: c.name,
      slug: c.slug,
      region: c.region || "",
      description: c.description || "",
      lat: c.lat ? Number(c.lat) : 0,
      lng: c.lng ? Number(c.lng) : 0,
      coverImage: null,
      metaTitle: null,
      metaDescription: null,
    }));
  }
}

export async function getCityBySlug(slug: string): Promise<CityData | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("cities")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      const fallback = turkeyCities.find((c) => c.slug === slug);
      if (fallback) {
        return {
          id: fallback.slug,
          name: fallback.name,
          slug: fallback.slug,
          region: fallback.region || "",
          description: fallback.description || "",
          lat: fallback.lat ? Number(fallback.lat) : 0,
          lng: fallback.lng ? Number(fallback.lng) : 0,
          coverImage: null,
          metaTitle: null,
          metaDescription: null,
        };
      }
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
      metaTitle: data.meta_title ?? null,
      metaDescription: data.meta_description ?? null,
    };
  } catch (err) {
    const fallback = turkeyCities.find((c) => c.slug === slug);
    if (fallback) {
      return {
        id: fallback.slug,
        name: fallback.name,
        slug: fallback.slug,
        region: fallback.region || "",
        description: fallback.description || "",
        lat: fallback.lat ? Number(fallback.lat) : 0,
        lng: fallback.lng ? Number(fallback.lng) : 0,
        coverImage: null,
        metaTitle: null,
        metaDescription: null,
      };
    }
    return undefined;
  }
}
