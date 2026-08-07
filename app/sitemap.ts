import { MetadataRoute } from "next";
import { getAllCities } from "@/lib/data/cities";
import { getAllCategories } from "@/lib/data/categories";
import {
  getIndexablePlaceCountsByCity,
  getIndexablePlacesForSitemap,
  getPlacesByCategory,
} from "@/lib/data/places";
import { getAllPageSlugs, getCityGuidePageSlugs } from "@/lib/data/pages";
import {
  getPublishedArticles,
  getPublishedCityGuideSlugs,
} from "@/lib/data/articles";
import { getPublishedEventSlugs } from "@/lib/data/events";
import { shouldIndexCategoryHub, shouldIndexCityHub } from "@/lib/content/hub-quality";
import { shouldIndexPlace } from "@/lib/content/place-quality";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://senidebekleriz.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/sehirler`, lastModified: new Date() },
    { url: `${BASE_URL}/kategoriler`, lastModified: new Date() },
    { url: `${BASE_URL}/blog`, lastModified: new Date() },
    { url: `${BASE_URL}/etkinlikler`, lastModified: new Date() },
  ];

  const [
    cities,
    categories,
    pageSlugs,
    indexablePlaces,
    articles,
    eventSlugs,
    guideArticleSlugs,
    guidePageSlugs,
    indexableByCity,
  ] = await Promise.all([
    getAllCities(),
    getAllCategories(),
    getAllPageSlugs(),
    getIndexablePlacesForSitemap(),
    getPublishedArticles(500),
    getPublishedEventSlugs(),
    getPublishedCityGuideSlugs(),
    getCityGuidePageSlugs(),
    getIndexablePlaceCountsByCity(),
  ]);

  const citiesWithGuide = new Set([...guideArticleSlugs, ...guidePageSlugs]);

  for (const city of cities) {
    const indexable = shouldIndexCityHub({
      hasGuide: citiesWithGuide.has(city.slug),
      indexablePlaceCount: indexableByCity.get(city.slug) || 0,
    });
    if (!indexable) continue;

    routes.push({
      url: `${BASE_URL}/sehir/${city.slug}`,
      lastModified: new Date(),
    });
  }

  for (const place of indexablePlaces) {
    routes.push({
      url: `${BASE_URL}/mekan/${place.slug}`,
      lastModified: new Date(place.updatedAt),
    });
  }

  for (const category of categories) {
    const places = await getPlacesByCategory(category.slug);
    const indexablePlaceCount = places.filter((place) =>
      shouldIndexPlace({
        description: place.description,
        source: place.source,
        is_featured: place.is_featured,
        cover_image: place.cover_image,
      })
    ).length;
    const indexable = shouldIndexCategoryHub({
      placeCount: places.length,
      indexablePlaceCount,
      descriptionLength: category.description?.length ?? 0,
    });
    if (!indexable) continue;

    routes.push({
      url: `${BASE_URL}/kategori/${category.slug}`,
      lastModified: new Date(),
    });
  }

  for (const slug of pageSlugs) {
    routes.push({
      url: `${BASE_URL}/sayfa/${slug}`,
      lastModified: new Date(),
    });
  }

  for (const article of articles) {
    routes.push({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: article.publishedAt
        ? new Date(article.publishedAt)
        : new Date(article.updatedAt),
    });
  }

  for (const event of eventSlugs) {
    routes.push({
      url: `${BASE_URL}/etkinlik/${event.slug}`,
      lastModified: new Date(event.updatedAt),
    });
  }

  return routes;
}
