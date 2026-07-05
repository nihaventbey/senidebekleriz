import { turkeyCities } from "@/data/turkey-cities";
import type { CityData } from "@/lib/data/cities";

const POPULAR_SLUG_ORDER = [...turkeyCities]
  .sort((a, b) => b.population - a.population)
  .map((city) => city.slug);

export function pickPopularCities(
  cities: CityData[],
  limit = 6
): CityData[] {
  const bySlug = new Map(cities.map((city) => [city.slug, city]));
  const picked: CityData[] = [];

  for (const slug of POPULAR_SLUG_ORDER) {
    const city = bySlug.get(slug);
    if (!city) continue;
    picked.push(city);
    if (picked.length >= limit) break;
  }

  return picked;
}
