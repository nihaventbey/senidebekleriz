import { describe, expect, it } from "vitest";
import {
  buildPageMetadataTitle,
  formatSeoDescription,
  formatSeoTitle,
  stripHtmlAndBoilerplate,
  stripSiteBrandSuffix,
} from "@/lib/seo/metadata";
import { buildTemplateMeta } from "@/lib/content/generate-meta";

describe("SEO metadata & text normalization", () => {
  it("strips duplicate site brand and generic suffixes", () => {
    expect(stripSiteBrandSuffix("Anna Karenina – Ankara | Seni de Bekleriz")).toBe(
      "Anna Karenina – Ankara"
    );
    expect(stripSiteBrandSuffix("Kullanım Koşulları - Seni de Bekleriz")).toBe(
      "Kullanım Koşulları"
    );
    expect(
      stripSiteBrandSuffix("Hakkımızda | Seni de Bekleriz — Kültür, Sanat ve Şehir Ajandası")
    ).toBe("Hakkımızda");
    expect(stripSiteBrandSuffix("'Monokrom' sergisi açıldı | Etkinlik Takvimi")).toBe(
      "'Monokrom' sergisi açıldı"
    );
    expect(
      stripSiteBrandSuffix("Kapadokya Rehberi | Seni de Bekleriz | Seni de Bekleriz")
    ).toBe("Kapadokya Rehberi");
  });

  it("formats SEO titles on word/clause boundaries without cutting words mid-token", () => {
    const balletTitle =
      "The Imperial Russian Ballet Company: Kuğu Gölü Balesi İstanbul";
    const formatted = formatSeoTitle(balletTitle, 55);
    expect(formatted.length).toBeLessThanOrEqual(55);
    expect(formatted).not.toMatch(/İstanb$/);
    expect(formatted).not.toContain("…");

    const quotedTitle =
      "Eğitim Sen Ordu Şubesi’nden tiyatro etkinliği: “Ten Rengi” sahnelenecek";
    const trimmedQuoted = formatSeoTitle(quotedTitle, 55);
    expect(trimmedQuoted.length).toBeLessThanOrEqual(55);
    expect(trimmedQuoted.endsWith("“")).toBe(false);
    expect(trimmedQuoted.endsWith(":")).toBe(false);
  });

  it("strips HTML comments, tags, and ticketing boilerplate from summaries/descriptions", () => {
    const wpDirty =
      "<!-- wp:paragraph --> <p>Bir sanat eserine bakarken yalnızca gördüklerimizle mi bağ kurarız?</p>";
    expect(stripHtmlAndBoilerplate(wpDirty)).toBe(
      "Bir sanat eserine bakarken yalnızca gördüklerimizle mi bağ kurarız?"
    );

    const biletixDirty =
      "Nilüfer biletleri | Biletix | Resmi Biletix Sitesi. | Ticketmaster Türkiye. | 2026-11-14 | İstanbul";
    const cleanedTicketing = stripHtmlAndBoilerplate(biletixDirty);
    expect(cleanedTicketing).not.toContain("Biletix");
    expect(cleanedTicketing).not.toContain("Ticketmaster");

    const longDesc =
      "İstanbul Atatürk Kültür Merkezi sahnesinde uluslararası toplulukların katılımıyla düzenlenen büyük senfonik konser serisi yeni sezonda müzikseverlerle buluşacak. Bilet detayları ve sahne takvimi kültür ajandamızda yer alıyor.";
    const formattedDesc = formatSeoDescription(longDesc, 155);
    expect(formattedDesc.length).toBeLessThanOrEqual(155);
    expect(formattedDesc.endsWith(".") || formattedDesc.endsWith("…")).toBe(true);
  });

  it("builds single-brand page metadata titles cleanly", () => {
    expect(
      buildPageMetadataTitle("Hakkımızda | Seni de Bekleriz — Kültür, Sanat ve Şehir Ajandası")
    ).toBe("Hakkımızda");
    expect(
      buildPageMetadataTitle("Antik Tiyatro Restorasyonu Başladı | Kültür")
    ).toBe("Antik Tiyatro Restorasyonu Başladı | Kültür");
  });

  it("builds template meta without site brand suffix across all entity types", () => {
    const eventMeta = buildTemplateMeta({
      type: "event",
      name: "Viyana Filarmoni Orkestrası Yılbaşı Konseri İstanbul Özel Programı",
      cityName: "İstanbul",
    });
    expect(eventMeta.meta_title).not.toContain("Seni de Bekleriz");
    expect(eventMeta.meta_title.length).toBeLessThanOrEqual(55);
    expect(eventMeta.meta_description.length).toBeLessThanOrEqual(155);

    const cityMeta = buildTemplateMeta({
      type: "city",
      name: "Afyonkarahisar",
    });
    expect(cityMeta.meta_title).not.toContain("Seni de Bekleriz");
    expect(cityMeta.meta_title.length).toBeLessThanOrEqual(55);

    const newsMeta = buildTemplateMeta({
      type: "news",
      name: "Stratonikeia Antik Kenti Kazılarında Yeni Buluntular Ortaya Çıktı",
    });
    expect(newsMeta.meta_title).not.toContain("Seni de Bekleriz");
    expect(newsMeta.meta_title.length).toBeLessThanOrEqual(55);

    const articleMeta = buildTemplateMeta({
      type: "article",
      name: "Gaziantep Gezi Rehberi: Zeugma ve Bakırcılar Çarşısı Rotası",
    });
    expect(articleMeta.meta_title).not.toContain("Seni de Bekleriz");
    expect(articleMeta.meta_title.length).toBeLessThanOrEqual(55);
  });
});
