import { describe, it, expect } from "vitest";
import {
  extractPageImageUrls,
  isLikelyContentImage,
  isLikelyMetaImage,
} from "@/lib/ai/extract-page-images";

describe("extractPageImageUrls", () => {
  it("extracts og:image first", () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://cdn.example.com/hero.jpg" />
          <meta name="twitter:image" content="https://cdn.example.com/twitter.jpg" />
        </head>
        <body>
          <img src="/assets/logo.png" />
          <img src="https://cdn.example.com/gallery/photo.webp" />
        </body>
      </html>
    `;

    const urls = extractPageImageUrls(html, "https://example.com/haber");
    expect(urls[0]).toBe("https://cdn.example.com/hero.jpg");
    expect(urls.some((u) => u.includes("photo.webp"))).toBe(true);
    expect(urls.some((u) => u.includes("logo"))).toBe(false);
  });

  it("filters icons and data urls", () => {
    expect(isLikelyContentImage("https://x.com/favicon.ico")).toBe(false);
    expect(isLikelyMetaImage("https://cdn.site.gov.tr/path/to/image")).toBe(true);
  });

  it("rejects valilik portrait and staff image urls", () => {
    expect(isLikelyContentImage("https://adana.gov.tr/upload/vali-foto.jpg")).toBe(
      false
    );
    expect(isLikelyContentImage("https://x.gov.tr/images/personel-banner.png")).toBe(
      false
    );
    expect(
      isLikelyContentImage("https://x.gov.tr/upload/tanitim/kale-manzara.webp")
    ).toBe(true);
  });
});
