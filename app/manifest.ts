import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seni de Bekleriz",
    short_name: "SeniDeBekleriz",
    description:
      "Türkiye'nin müzeleri, tarihi yerleri ve sanat mekanlarını keşfedin.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
