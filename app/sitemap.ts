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

import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sehirler`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kategoriler`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/etkinlikler`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
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
      url: `${baseUrl}/sehir/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const place of indexablePlaces) {
    routes.push({
      url: `${baseUrl}/mekan/${place.slug}`,
      lastModified: new Date(place.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
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
      url: `${baseUrl}/kategori/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const slug of pageSlugs) {
    routes.push({
      url: `${baseUrl}/sayfa/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const article of articles) {
    routes.push({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.publishedAt
        ? new Date(article.publishedAt)
        : new Date(article.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const event of eventSlugs) {
    routes.push({
      url: `${baseUrl}/etkinlik/${event.slug}`,
      lastModified: new Date(event.updatedAt),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return routes;
}

