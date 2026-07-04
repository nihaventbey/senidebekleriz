import { MetadataRoute } from "next";

export const dynamic = "force-static";

import { getAllCities } from "@/lib/data/cities";
import { getAllCategories } from "@/lib/data/categories";
import { getPlacesByCity } from "@/lib/data/places";
import { getAllPageSlugs } from "@/lib/data/pages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://senidebekleriz.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/sehirler`, lastModified: new Date() },
    { url: `${BASE_URL}/kategoriler`, lastModified: new Date() },
  ];

  const cities = await getAllCities();
  for (const city of cities) {
    routes.push({
      url: `${BASE_URL}/sehir/${city.slug}`,
      lastModified: new Date(),
    });

    const places = await getPlacesByCity(city.slug);
    for (const place of places) {
      routes.push({
        url: `${BASE_URL}/mekan/${place.slug}`,
        lastModified: new Date(),
      });
    }
  }

  const categories = await getAllCategories();
  for (const category of categories) {
    routes.push({
      url: `${BASE_URL}/kategori/${category.slug}`,
      lastModified: new Date(),
    });
  }

  const pageSlugs = await getAllPageSlugs();
  for (const slug of pageSlugs) {
    routes.push({
      url: `${BASE_URL}/sayfa/${slug}`,
      lastModified: new Date(),
    });
  }

  return routes;
}
