import { describe, it, expect } from "vitest";
import {
  extractBalancedTag,
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

describe("extractBalancedTag", () => {
  it("correctly balances nested tags without stopping at inner closing tags", () => {
    const html = `
      <div class="news-content-wrapper">
        <div class="inner-header">
          <span>Tarih: 31 Ekim</span>
        </div>
        <p>İlk paragraf burada yer alıyor ve oldukça detaylı bilgi içeriyor.</p>
        <div class="inner-ad">
          <p>Reklam alanı</p>
        </div>
        <p>İkinci paragraf ise devam niteliğinde ve son derece önemlidir.</p>
      </div>
      <div class="footer-sidebar">Yan Menü</div>
    `;

    const result = extractBalancedTag(
      html,
      "div",
      /<div[^>]+class=["']news-content-wrapper["']/i
    );

    expect(result).not.toBeNull();
    expect(result).toContain("İlk paragraf burada yer alıyor");
    expect(result).toContain("İkinci paragraf ise devam niteliğinde");
    expect(result).not.toContain("Yan Menü");
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

  it("handles complex nested containers without truncating paragraphs", () => {
    const html = `<!DOCTYPE html><html><body>
      <div class="news-content-container">
        <input type="hidden" name="meta" value="123">
        <div class="news-info-bar">
          <span class="source">KAYNAK AA</span>
        </div>
        <div class="news-content">
          <p>Ankara Devlet Tiyatrosu, yeni sezonda 15 oyunun prömiyerini gerçekleştirecek.</p>
          <div class="ad-slot"><span class="ad">İç Reklam</span></div>
          <p>Sezai Yılmaz, yeni sezon hedefleri ve sahneler hakkında önemli açıklamalarda bulundu.</p>
          <p>Cüneyt Gökçer Sahnesi kasım ayında perdelerini açarak sanatseverlerle buluşacak.</p>
        </div>
      </div>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "description": "Kısa özet açıklaması."
      }
      </script>
    </body></html>`;

    const text = extractPageTextFromHtml(html);
    expect(text).toContain("Ankara Devlet Tiyatrosu, yeni sezonda 15 oyunun prömiyerini gerçekleştirecek.");
    expect(text).toContain("Sezai Yılmaz, yeni sezon hedefleri");
    expect(text).toContain("Cüneyt Gökçer Sahnesi kasım ayında perdelerini açarak");
    // Should NOT be truncated to the short JSON-LD description
    expect(text.length).toBeGreaterThan(200);
  });

  it("extracts full article when itemprop='articleBody' is used", () => {
    const html = `<!DOCTYPE html><html><body>
      <div itemprop="articleBody">
        <h2>Antik Kentte Yeni Keşif</h2>
        <p>Stratonikeia Antik Kenti'nde yürütülen kazı çalışmalarında Helenistik döneme ait tapınak kalıntılarına ulaşıldı.</p>
        <p>Kazı başkanı Prof. Dr. Bilal Söğüt, buluntuların bölgenin dini mimarisine dair yeni ipuçları sunduğunu belirtti.</p>
        <p>Mozaik tabanların ve yazıtların konservasyon çalışmaları hızla sürdürülüyor.</p>
      </div>
    </body></html>`;

    const text = extractPageTextFromHtml(html);
    expect(text).toContain("Antik Kentte Yeni Keşif");
    expect(text).toContain("Stratonikeia Antik Kenti'nde yürütülen kazı çalışmalarında");
    expect(text).toContain("Kazı başkanı Prof. Dr. Bilal Söğüt");
    expect(text).toContain("Mozaik tabanların ve yazıtların konservasyon");
  });
});
