import { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://senidebekleriz.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/yonetim", "/yonetim/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
