import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;

  const [citiesResult, placesResult] = await Promise.all([
    supabaseAdmin
      .from("cities")
      .select("name, slug, description")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(5),

    supabaseAdmin
      .from("places")
      .select("name, slug, description, cities!inner(name, slug)")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(10),
  ]);

  const cities = (citiesResult.data || []).map((c) => ({
    type: "city" as const,
    name: c.name,
    slug: c.slug,
    description: c.description?.slice(0, 80) || null,
  }));

  const places = (placesResult.data || []).map((p) => {
    const city = Array.isArray(p.cities) ? p.cities[0] : p.cities;
    return {
      type: "place" as const,
      name: p.name,
      slug: p.slug,
      citySlug: city?.slug || "",
      cityName: city?.name || "",
      description: p.description?.slice(0, 80) || null,
    };
  });

  return NextResponse.json(
    { results: [...cities, ...places] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
