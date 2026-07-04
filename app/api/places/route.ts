import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get("city");
  const categorySlug = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("places")
    .select(`
      *,
      cities!inner(name, slug),
      place_categories(categories(name, slug))
    `)
    .eq("is_active", true);

  if (citySlug) {
    const { data: city } = await supabaseAdmin
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (city) {
      query = query.eq("city_id", city.id);
    }
  }

  if (categorySlug) {
    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (category) {
      const { data: placeIds } = await supabaseAdmin
        .from("place_categories")
        .select("place_id")
        .eq("category_id", category.id);
      const ids = (placeIds || []).map((r) => r.place_id);
      if (ids.length === 0) {
        return NextResponse.json({ items: [], total: 0 });
      }
      query = query.in("id", ids);
    }
  }

  const { data, error } = await query
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ items: [], total: 0, error: error.message });
  }

  const items = (data || []).map((place) => {
    const city = Array.isArray(place.cities) ? place.cities[0] : place.cities;
    const placeCats = place.place_categories as Array<{ categories: { name: string; slug: string } | null }> | null;
    const firstCat = placeCats?.[0]?.categories;

    return {
      id: place.id,
      name: place.name,
      slug: place.slug,
      category: firstCat?.slug || place.source || "tarihi-yer",
      description: place.description,
      address: place.address,
      lat: place.lat ? Number(place.lat) : 0,
      lng: place.lng ? Number(place.lng) : 0,
      source: place.source || "manual",
      wikidata_id: place.wikidata_id || null,
      cover_image: place.cover_image || null,
      is_featured: place.is_featured ?? false,
      cityName: city?.name || "",
      citySlug: city?.slug || "",
    };
  });

  return NextResponse.json(
    { items, total: items.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
