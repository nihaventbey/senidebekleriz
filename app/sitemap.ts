import { MetadataRoute } from "next";
import { getAllCities } from "@/lib/data/cities";
import { getAllPageSlugs } from "@/lib/data/pages";
import { getPublishedArticleSitemapEntries } from "@/lib/data/articles";
import { getPublishedEventSlugs } from "@/lib/data/events";
import { getNewsSlugs } from "@/lib/data/news";
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
    {
      url: `${baseUrl}/haberler`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const [cities, pageSlugs, articles, eventSlugs, newsSlugs] =
    await Promise.all([
      getAllCities(),
      getAllPageSlugs(),
      getPublishedArticleSitemapEntries(),
      getPublishedEventSlugs({ includePast: false }),
      getNewsSlugs(),
    ]);

  for (const city of cities) {
    routes.push({
      url: `${baseUrl}/sehir/${city.slug}`,
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

  for (const news of newsSlugs) {
    routes.push({
      url: `${baseUrl}/haber/${news.slug}`,
      lastModified: new Date(news.updatedAt),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return routes;
}

