import { MetadataRoute } from "next";
import { getAllCities } from "@/lib/data/cities";
import { getAllCategories } from "@/lib/data/categories";
import { getIndexablePlacesForSitemap } from "@/lib/data/places";
import { getAllPageSlugs } from "@/lib/data/pages";
import { getPublishedArticles } from "@/lib/data/articles";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://senidebekleriz.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/sehirler`, lastModified: new Date() },
    { url: `${BASE_URL}/kategoriler`, lastModified: new Date() },
    { url: `${BASE_URL}/blog`, lastModified: new Date() },
  ];

  const [cities, categories, pageSlugs, indexablePlaces, articles] =
    await Promise.all([
      getAllCities(),
      getAllCategories(),
      getAllPageSlugs(),
      getIndexablePlacesForSitemap(),
      getPublishedArticles(500),
    ]);

  for (const city of cities) {
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

  return routes;
}
