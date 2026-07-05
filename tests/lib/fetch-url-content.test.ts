import { describe, it, expect } from "vitest";
import {
  extractPageTextFromHtml,
  fetchUrlContent,
} from "@/lib/ai/fetch-url-content";

describe("fetchUrlContent", () => {
  it("rejects non-http URLs", async () => {
    await expect(fetchUrlContent("ftp://example.com/page")).rejects.toThrow(
      "Geçersiz URL"
    );
  });
});

describe("extractPageTextFromHtml", () => {
  it("uses meta description when body is empty", () => {
    const html = `<!DOCTYPE html><html><head>
      <meta property="og:description" content="İstanbul'da yeni sergi açılıyor." />
    </head><body><div id="app"></div></body></html>`;

    const text = extractPageTextFromHtml(html);
    expect(text).toContain("İstanbul'da yeni sergi açılıyor");
    expect(text.length).toBeGreaterThan(20);
  });
});
