import { describe, it, expect } from "vitest";
import { parseKtbRssXml } from "@/lib/events/sources/ktb-rss";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>KTB Haberler</title>
    <item>
      <title><![CDATA[İstanbul Devlet Tiyatrosu Sezon Açılışı]]></title>
      <link>https://www.kultur.gov.tr/haber/123</link>
      <description><![CDATA[Tiyatro sezonu açılıyor.]]></description>
      <pubDate>Mon, 01 Jul 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Boş başlıksız item</title>
      <description>Link yok</description>
    </item>
    <item>
      <title>Konser Duyurusu</title>
      <link>https://www.kultur.gov.tr/haber/456</link>
      <description>CSO Ada Ankara konseri</description>
    </item>
  </channel>
</rss>`;

describe("parseKtbRssXml", () => {
  it("parses valid RSS items with title and link", () => {
    const items = parseKtbRssXml(SAMPLE_RSS, "Kültür Bakanlığı");

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "İstanbul Devlet Tiyatrosu Sezon Açılışı",
      link: "https://www.kultur.gov.tr/haber/123",
      sourceName: "Kültür Bakanlığı",
      pubDate: "Mon, 01 Jul 2026 10:00:00 GMT",
    });
    expect(items[0].description).toContain("Tiyatro sezonu");
  });

  it("skips items without link", () => {
    const items = parseKtbRssXml(SAMPLE_RSS, "KTB");
    expect(items.every((item) => item.link)).toBe(true);
  });

  it("respects limit", () => {
    const items = parseKtbRssXml(SAMPLE_RSS, "KTB", 1);
    expect(items).toHaveLength(1);
  });

  it("strips raw HTML links and font tags from CDATA description", () => {
    const RSS_WITH_HTML = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Google News RSS</title>
        <item>
          <title><![CDATA[Haber Başlığı]]></title>
          <link>https://news.google.com/rss/articles/123</link>
          <description><![CDATA[<a href="https://news.google.com/rss/articles/123" target="_blank">Haber Başlığı</a>&nbsp;&nbsp;<font color="#6f6f6f">Hürriyet</font>]]></description>
        </item>
      </channel>
    </rss>`;
    const items = parseKtbRssXml(RSS_WITH_HTML, "Google News");
    expect(items[0].description).toBe("Haber Başlığı Hürriyet");
    expect(items[0].description).not.toContain("<a");
    expect(items[0].description).not.toContain("<font");
  });
});
