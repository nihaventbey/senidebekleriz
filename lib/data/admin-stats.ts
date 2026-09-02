import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  hasEditorialContent,
} from "@/lib/content/place-quality";
import { turkeyCities } from "@/data/turkey-cities";
import { getCityName } from "@/lib/cities/lookup";
import { existsSync } from "fs";
import { join } from "path";

export type AdminDashboardStats = {
  cities: number;
  places: number;
  activePlaces: number;
  featuredPlaces: number;
  indexablePlaces: number;
  pages: number;
  categories: number;
  articles: number;
  publishedArticles: number;
  newsTotal: number;
  newsPublished: number;
  newsDraft: number;
  newsFeatured: number;
  eventsTotal: number;
  eventsPublished: number;
  eventsPending: number;
  pendingDiscoveries: number;
  recentNews: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    cityName: string | null;
    coverImage: string | null;
    isPublished: boolean;
    isFeatured: boolean;
    updatedAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    slug: string;
    eventType: string;
    cityName: string | null;
    startsAt: string | null;
    status: string;
    updatedAt: string;
  }>;
  recentPlaces: Array<{
    name: string;
    slug: string;
    cityName: string;
    updatedAt: string;
    isFeatured: boolean;
  }>;
};

export type ContentReadinessStats = {
  publishedArticles: number;
  indexablePlaces: number;
  indexablePlacesWithoutCover: number;
  citiesWithGuide: number;
  citiesWithoutGuide: number;
  missingGuideCities: string[];
  hasPrivacyPage: boolean;
  hasAboutPage: boolean;
  hasSiteVerification: boolean;
  hasCookieConsent: boolean;
  hasAdsTxt: boolean;
  sitemapExcludesThinPlaces: boolean;
};

async function countIndexablePlaces(): Promise<number> {
  const stats = await getIndexablePlaceCoverStats();
  return stats.indexable;
}

async function getIndexablePlaceCoverStats(): Promise<{
  indexable: number;
  withoutCover: number;
}> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select("description, source, is_featured, cover_image")
    .eq("is_active", true);

  if (error) return { indexable: 0, withoutCover: 0 };

  let indexable = 0;
  let withoutCover = 0;
  for (const place of data || []) {
    const editorial = hasEditorialContent({
      description: place.description,
      source: place.source,
      is_featured: place.is_featured,
      cover_image: place.cover_image,
    });
    if (!editorial) continue;

    if (place.cover_image) {
      indexable++;
    } else {
      withoutCover++;
    }
  }

  return { indexable, withoutCover };
}

export async function getContentReadinessStats(): Promise<ContentReadinessStats> {
  const validCitySlugs = new Set(turkeyCities.map((c) => c.slug));

  const [
    publishedArticlesRes,
    coverStats,
    guideArticlesRes,
    citiesRes,
    privacyRes,
    aboutRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    getIndexablePlaceCoverStats(),
    supabaseAdmin
      .from("articles")
      .select("city_slug")
      .eq("is_published", true)
      .not("city_slug", "is", null),
    supabaseAdmin.from("cities").select("name, slug").eq("is_active", true),
    supabaseAdmin
      .from("pages")
      .select("slug")
      .eq("slug", "gizlilik-politikasi")
      .eq("is_published", true)
      .maybeSingle(),
    supabaseAdmin
      .from("pages")
      .select("slug")
      .eq("slug", "hakkimizda")
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  const guideSlugs = new Set(
    (guideArticlesRes.data || [])
      .map((a) => a.city_slug)
      .filter((slug): slug is string => Boolean(slug) && validCitySlugs.has(slug))
  );

  const allCities = (citiesRes.data || []).filter((city) =>
    validCitySlugs.has(city.slug)
  );
  const missingGuideCities = allCities
    .filter((city) => !guideSlugs.has(city.slug))
    .map((city) => city.name)
    .slice(0, 12);

  const adsTxtExists = existsSync(join(process.cwd(), "public", "ads.txt"));

  return {
    publishedArticles: publishedArticlesRes.count ?? 0,
    indexablePlaces: coverStats.indexable,
    indexablePlacesWithoutCover: coverStats.withoutCover,
    citiesWithGuide: guideSlugs.size,
    citiesWithoutGuide: Math.max(0, allCities.length - guideSlugs.size),
    missingGuideCities,
    hasPrivacyPage: Boolean(privacyRes.data),
    hasAboutPage: Boolean(aboutRes.data),
    hasSiteVerification: Boolean(process.env.GOOGLE_SITE_VERIFICATION),
    hasCookieConsent: true,
    hasAdsTxt: adsTxtExists,
    sitemapExcludesThinPlaces: true,
  };
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const indexablePlaces = await countIndexablePlaces();

  const [
    citiesRes,
    placesRes,
    activePlacesRes,
    featuredPlacesRes,
    pagesRes,
    categoriesRes,
    articlesRes,
    publishedArticlesRes,
    newsTotalRes,
    newsPublishedRes,
    newsDraftRes,
    newsFeaturedRes,
    eventsTotalRes,
    eventsPublishedRes,
    eventsPendingRes,
    pendingDiscoveriesRes,
    recentPlacesRes,
    recentNewsRes,
    recentEventsRes,
  ] = await Promise.all([
    supabaseAdmin.from("cities").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("places").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("places")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabaseAdmin
      .from("places")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),
    supabaseAdmin.from("pages").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabaseAdmin.from("articles").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabaseAdmin.from("cultural_news").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("cultural_news").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabaseAdmin.from("cultural_news").select("*", { count: "exact", head: true }).eq("is_published", false),
    supabaseAdmin.from("cultural_news").select("*", { count: "exact", head: true }).eq("is_featured", true),
    supabaseAdmin.from("cultural_events").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("cultural_events").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabaseAdmin.from("cultural_events").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabaseAdmin.from("discovered_content").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabaseAdmin
      .from("places")
      .select("name, slug, updated_at, is_featured, cities(name)")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("cultural_news")
      .select("id, title, slug, category, city_slug, cover_image, is_published, is_featured, updated_at")
      .order("updated_at", { ascending: false })
      .limit(4),
    supabaseAdmin
      .from("cultural_events")
      .select("id, title, slug, event_type, city_slug, starts_at, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const recentPlaces = (recentPlacesRes.data || []).map((place) => {
    const cities = place.cities as { name: string }[] | { name: string } | null;
    const cityName = Array.isArray(cities)
      ? cities[0]?.name || ""
      : cities?.name || "";

    return {
      name: place.name,
      slug: place.slug,
      cityName,
      updatedAt: place.updated_at,
      isFeatured: place.is_featured ?? false,
    };
  });

  const recentNews = (recentNewsRes.data || []).map((n) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    category: n.category,
    cityName: getCityName(n.city_slug) || n.city_slug,
    coverImage: n.cover_image,
    isPublished: n.is_published ?? false,
    isFeatured: n.is_featured ?? false,
    updatedAt: n.updated_at,
  }));

  const recentEvents = (recentEventsRes.data || []).map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    eventType: e.event_type,
    cityName: getCityName(e.city_slug) || e.city_slug,
    startsAt: e.starts_at,
    status: e.status,
    updatedAt: e.updated_at,
  }));

  return {
    cities: citiesRes.count ?? 0,
    places: placesRes.count ?? 0,
    activePlaces: activePlacesRes.count ?? 0,
    featuredPlaces: featuredPlacesRes.count ?? 0,
    indexablePlaces,
    pages: pagesRes.count ?? 0,
    categories: categoriesRes.count ?? 0,
    articles: articlesRes.count ?? 0,
    publishedArticles: publishedArticlesRes.count ?? 0,
    newsTotal: newsTotalRes.count ?? 0,
    newsPublished: newsPublishedRes.count ?? 0,
    newsDraft: newsDraftRes.count ?? 0,
    newsFeatured: newsFeaturedRes.count ?? 0,
    eventsTotal: eventsTotalRes.count ?? 0,
    eventsPublished: eventsPublishedRes.count ?? 0,
    eventsPending: eventsPendingRes.count ?? 0,
    pendingDiscoveries: pendingDiscoveriesRes.count ?? 0,
    recentNews,
    recentEvents,
    recentPlaces,
  };
}
