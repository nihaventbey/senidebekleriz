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
});
