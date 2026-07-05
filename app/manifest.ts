import { MetadataRoute } from "next";
import { getBrandSettings } from "@/lib/data/site-settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandSettings();

  const icons: MetadataRoute.Manifest["icons"] = [];

  if (brand.faviconUrl) {
    icons.push({
      src: brand.faviconUrl,
      sizes: "any",
      type: "image/png",
    });
  }

  if (brand.appleTouchIconUrl) {
    icons.push({
      src: brand.appleTouchIconUrl,
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    });
  }

  return {
    name: "Seni de Bekleriz",
    short_name: "SeniDeBekleriz",
    description:
      "Türkiye'nin müzeleri, tarihi yerleri ve sanat mekanlarını keşfedin.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons,
  };
}
