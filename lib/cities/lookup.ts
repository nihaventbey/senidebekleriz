import { turkeyCities } from "@/data/turkey-cities";

const cityNameBySlug = new Map(
  turkeyCities.map((city) => [city.slug, city.name] as const)
);

const validCitySlugs = new Set(turkeyCities.map((city) => city.slug));

export function isValidCitySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return validCitySlugs.has(slug);
}

export function normalizeCitySlug(
  slug: string | null | undefined
): string | null {
  if (!slug || slug === "none") return null;
  return isValidCitySlug(slug) ? slug : null;
}

export function getCityName(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return cityNameBySlug.get(slug) ?? null;
}

export function getCityNameOrSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return getCityName(slug) ?? slug;
}
