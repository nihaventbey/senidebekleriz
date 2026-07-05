import type { Metadata } from "next";
import type { BrandSettings } from "@/lib/settings/branding";

export function buildBrandMetadata(
  brand: BrandSettings,
  base: Metadata = {}
): Metadata {
  const icons: NonNullable<Metadata["icons"]> = {};

  if (brand.faviconUrl) {
    icons.icon = brand.faviconUrl;
    icons.shortcut = brand.faviconUrl;
  }

  if (brand.appleTouchIconUrl) {
    icons.apple = brand.appleTouchIconUrl;
  }

  const openGraph =
    brand.ogImageUrl && base.openGraph !== null
      ? {
          ...(typeof base.openGraph === "object" ? base.openGraph : {}),
          images: [{ url: brand.ogImageUrl, width: 1200, height: 630 }],
        }
      : base.openGraph;

  return {
    ...base,
    ...(Object.keys(icons).length > 0 ? { icons } : {}),
    ...(openGraph !== undefined ? { openGraph } : {}),
  };
}
