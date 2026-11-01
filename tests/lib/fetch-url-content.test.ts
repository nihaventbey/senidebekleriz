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

  it("extracts article paragraphs while stripping svg, nav, and decoding Turkish entities", () => {
    const html = `<!DOCTYPE html><html><body>
      <header><svg><path d="M10 20"/></svg><nav><a href="/">Ana Sayfa</a></nav></header>
      <article>
        <p>Tekirdağ B&uuml;y&uuml;kşehir Belediyesi, k&uuml;lt&uuml;r gezileri programını başlattı.</p>
        <p>&Ccedil;anakkale ve İstanbul gezileri i&ccedil;in kayıtlar a&ccedil;ıldı.</p>
      </article>
      <footer><p>Tüm hakları saklıdır</p></footer>
    </body></html>`;

    const text = extractPageTextFromHtml(html);
    expect(text).toContain("Tekirdağ Büyükşehir Belediyesi, kültür gezileri programını başlattı.");
    expect(text).toContain("Çanakkale ve İstanbul gezileri için kayıtlar açıldı.");
    expect(text).not.toContain("M10 20");
    expect(text).not.toContain("Ana Sayfa");
  });
});
