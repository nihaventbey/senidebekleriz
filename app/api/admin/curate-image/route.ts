import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { getCityName } from "@/lib/cities/lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIKI_API = "https://tr.wikipedia.org/w/api.php";

async function fetchWikiImageAlternatives(searchQuery: string) {
  try {
    const searchUrl = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=3&format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "SeniDeBekleriz-Curator/1.0" },
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const searchHits = searchData.query?.search || [];
    if (searchHits.length === 0) return [];

    const pageTitles = searchHits.map((h: any) => h.title).join("|");
    const detailUrl = `${WIKI_API}?action=query&titles=${encodeURIComponent(pageTitles)}&prop=pageimages|images&piprop=thumbnail&pithumbsize=1000&format=json`;

    const detailRes = await fetch(detailUrl, {
      headers: { "User-Agent": "SeniDeBekleriz-Curator/1.0" },
    });
    if (!detailRes.ok) return [];

    const detailData = await detailRes.json();
    const pages = detailData.query?.pages || {};

    const thumbnails: { url: string; title: string }[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      if (page.thumbnail?.source) {
        thumbnails.push({
          url: page.thumbnail.source,
          title: page.title || searchQuery,
        });
      }
    }

    return thumbnails;
  } catch (err) {
    console.error("Wiki alternatives fetch error:", err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "wiki-suggest") {
    const query = searchParams.get("query") || "";
    if (!query) return NextResponse.json({ suggestions: [] });
    const suggestions = await fetchWikiImageAlternatives(query);
    return NextResponse.json({ suggestions });
  }

  const type = searchParams.get("type") || "places"; // "places" | "cities" | "articles"
  const cityId = searchParams.get("cityId");
  const citySlugParam = searchParams.get("citySlug");
  const articleCategory = searchParams.get("articleCategory") || "all"; // "all" | "guides" | "blog"
  const status = searchParams.get("status") || "all"; // "all" | "no-cover" | "auto" | "locked" | "has-cover"
  const query = (searchParams.get("query") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const offset = (page - 1) * limit;

  // 1. Articles query
  if (type === "articles") {
    let dbQuery = supabaseAdmin
      .from("articles")
      .select("id, title, slug, cover_image, city_slug, excerpt, is_published, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false });

    if (query) {
      dbQuery = dbQuery.ilike("title", `%${query}%`);
    }

    if (citySlugParam && citySlugParam !== "all") {
      dbQuery = dbQuery.eq("city_slug", citySlugParam);
    }

    if (articleCategory === "guides") {
      dbQuery = dbQuery.not("city_slug", "is", null);
    } else if (articleCategory === "blog") {
      dbQuery = dbQuery.is("city_slug", null);
    }

    if (status === "no-cover") {
      dbQuery = dbQuery.is("cover_image", null);
    } else if (status === "has-cover") {
      dbQuery = dbQuery.not("cover_image", "is", null);
    }

    const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedItems = (data || []).map((art) => ({
      id: art.id,
      name: art.title,
      slug: art.slug,
      cover_image: art.cover_image,
      cover_image_source: "manual",
      cover_image_locked: true,
      city_slug: art.city_slug,
      cities: art.city_slug ? { id: art.city_slug, name: getCityName(art.city_slug) || art.city_slug, slug: art.city_slug } : null,
      excerpt: art.excerpt,
      is_published: art.is_published,
      updated_at: art.updated_at,
    }));

    return NextResponse.json({
      items: mappedItems,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  }

  // 2. Cities query
  if (type === "cities") {
    let dbQuery = supabaseAdmin
      .from("cities")
      .select("id, name, slug, region, cover_image, cover_image_source, cover_image_locked, updated_at", { count: "exact" })
      .order("name", { ascending: true });

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`);
    }

    if (status === "no-cover") {
      dbQuery = dbQuery.is("cover_image", null);
    } else if (status === "auto") {
      dbQuery = dbQuery.not("cover_image", "is", null).eq("cover_image_locked", false);
    } else if (status === "locked") {
      dbQuery = dbQuery.eq("cover_image_locked", true);
    }

    const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  }

  // 3. Places query
  let dbQuery = supabaseAdmin
    .from("places")
    .select("id, name, slug, cover_image, cover_image_source, cover_image_locked, city_id, cities(id, name, slug), updated_at", { count: "exact" })
    .order("updated_at", { ascending: false });

  if (cityId && cityId !== "all") {
    dbQuery = dbQuery.eq("city_id", cityId);
  }

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (status === "no-cover") {
    dbQuery = dbQuery.is("cover_image", null);
  } else if (status === "auto") {
    dbQuery = dbQuery.not("cover_image", "is", null).eq("cover_image_locked", false);
  } else if (status === "locked") {
    dbQuery = dbQuery.eq("cover_image_locked", true);
  }

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { action, type, id, slug, citySlug, imageUrl, locked } = body;

    const table = type === "cities" ? "cities" : type === "articles" ? "articles" : "places";

    if (action === "update-image") {
      if (!imageUrl || typeof imageUrl !== "string") {
        return NextResponse.json({ error: "Geçerli bir görsel URL'si gerekli" }, { status: 400 });
      }

      const updates: Record<string, any> = {
        cover_image: imageUrl.trim(),
        updated_at: new Date().toISOString(),
      };

      if (type !== "articles") {
        updates.cover_image_source = "manual";
        updates.cover_image_locked = true;
      }

      const { error } = await supabaseAdmin.from(table).update(updates).eq("id", id);
      if (error) throw new Error(error.message);

      // Revalidate cache
      if (type === "cities") {
        revalidatePath(`/sehir/${slug}`);
        revalidatePath("/sehirler");
      } else if (type === "articles") {
        revalidatePath(`/blog/${slug}`);
        revalidatePath("/blog");
        if (citySlug) revalidatePath(`/sehir/${citySlug}`);
      } else {
        revalidatePath(`/mekan/${slug}`);
        if (citySlug) revalidatePath(`/sehir/${citySlug}`);
      }
      revalidatePath("/");

      return NextResponse.json({ success: true, updates });
    }

    if (action === "toggle-lock") {
      if (type === "articles") {
        return NextResponse.json({ success: true });
      }

      const updates = {
        cover_image_locked: Boolean(locked),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from(table).update(updates).eq("id", id);
      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true, updates });
    }

    if (action === "clear-image") {
      const updates: Record<string, any> = {
        cover_image: null,
        updated_at: new Date().toISOString(),
      };

      if (type !== "articles") {
        updates.cover_image_source = null;
        updates.cover_image_locked = false;
      }

      const { error } = await supabaseAdmin.from(table).update(updates).eq("id", id);
      if (error) throw new Error(error.message);

      if (type === "cities") {
        revalidatePath(`/sehir/${slug}`);
      } else if (type === "articles") {
        revalidatePath(`/blog/${slug}`);
        revalidatePath("/blog");
        if (citySlug) revalidatePath(`/sehir/${citySlug}`);
      } else {
        revalidatePath(`/mekan/${slug}`);
        if (citySlug) revalidatePath(`/sehir/${citySlug}`);
      }

      return NextResponse.json({ success: true, updates });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    console.error("Curate image API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İşlem başarısız" },
      { status: 500 }
    );
  }
}
