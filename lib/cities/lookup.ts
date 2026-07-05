import { turkeyCities } from "@/data/turkey-cities";

const cityNameBySlug = new Map(
  turkeyCities.map((city) => [city.slug, city.name] as const)
);

export function getCityName(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return cityNameBySlug.get(slug) ?? null;
}

export function getCityNameOrSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return getCityName(slug) ?? slug;
}
