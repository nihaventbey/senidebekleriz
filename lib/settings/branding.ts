export type BrandSettings = {
  logoUrl: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  ogImageUrl: string | null;
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoUrl: null,
  faviconUrl: null,
  appleTouchIconUrl: null,
  ogImageUrl: null,
};

function normalizeUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function normalizeBrandSettings(raw: unknown): BrandSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_BRAND_SETTINGS;
  const obj = raw as Record<string, unknown>;

  return {
    logoUrl: normalizeUrl(obj.logoUrl),
    faviconUrl: normalizeUrl(obj.faviconUrl),
    appleTouchIconUrl: normalizeUrl(obj.appleTouchIconUrl),
    ogImageUrl: normalizeUrl(obj.ogImageUrl),
  };
}
