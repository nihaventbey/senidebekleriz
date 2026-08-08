import { NextResponse } from "next/server";
import { getBrandSettings } from "@/lib/data/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_SVG_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#0D9488" />
  <path d="M50 85S20 57 20 37C20 20 33 8 50 8C67 8 80 20 80 37C80 57 50 85 50 85Z" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <circle cx="50" cy="37" r="11" fill="#FFFFFF" />
</svg>`;

export async function GET() {
  try {
    const brand = await getBrandSettings();
    if (brand?.faviconUrl) {
      const res = await fetch(brand.faviconUrl, {
        headers: { "User-Agent": "SeniDeBekleriz/1.0 Favicon" },
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/x-icon";
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=0, must-revalidate",
          },
        });
      }
    }
  } catch (err) {
    console.error("Dynamic Favicon error:", err);
  }

  return new NextResponse(DEFAULT_SVG_FAVICON, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
