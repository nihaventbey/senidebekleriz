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

  const [citiesResult, placesResult, articlesResult, eventsResult, newsResult] =
    await Promise.all([
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
        .limit(8),

      supabaseAdmin
        .from("articles")
        .select("title, slug, excerpt")
        .ilike("title", pattern)
        .eq("is_published", true)
        .limit(5),

      supabaseAdmin
        .from("cultural_events")
        .select("title, slug, summary, event_type")
        .ilike("title", pattern)
        .eq("status", "published")
        .limit(5),

      supabaseAdmin
        .from("cultural_news")
        .select("title, slug, summary, category")
        .ilike("title", pattern)
        .eq("is_published", true)
        .limit(5),
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

  const articles = (articlesResult.data || []).map((a) => ({
    type: "article" as const,
    name: a.title,
    slug: a.slug,
    description: a.excerpt?.slice(0, 80) || null,
  }));

  const events = (eventsResult.data || []).map((e) => ({
    type: "event" as const,
    name: e.title,
    slug: e.slug,
    description: e.summary?.slice(0, 80) || e.event_type || null,
  }));

  const news = (newsResult.data || []).map((n) => ({
    type: "news" as const,
    name: n.title,
    slug: n.slug,
    description: n.summary?.slice(0, 80) || n.category || null,
  }));

  return NextResponse.json(
    { results: [...cities, ...places, ...articles, ...events, ...news] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
