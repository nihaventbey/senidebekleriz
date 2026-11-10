import { describe, it, expect } from "vitest";
import {
  sanitizeEventType,
  extractVenueFromText,
  extractTurkishDates,
  heuristicNormalizeEvent,
} from "@/lib/ai/normalize-event";
import { extractJsonLdText, extractPageTextFromHtml } from "@/lib/ai/fetch-url-content";
import { stripDatelineFromParagraph } from "@/lib/ai/clean-publisher";
import { heuristicClassify, isRejectedNonTurkishOrCommercialContent } from "@/lib/discovery/classify-content";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import {
  assessNewsDraft,
  assessEventDraft,
  polishMarkdown,
  measureCopyRatio,
} from "@/lib/ai/editorial";

describe("Event & News Editorial Engine", () => {
  describe("sanitizeEventType", () => {
    it("classifies concerts accurately even when body text mentions 'sahne'", () => {
      expect(
        sanitizeEventType(
          null,
          "Tokat'ta 6 Kasım Cuma günü düzenlenmesi planlanan Candela Concert etkinliği, müzikseverleri mum ışığıyla hazırlanan özel bir sahne atmosferinde buluşturacak.",
          "Tokat'ta Mum Işığında Konser: Candela Concert Tokat'ta"
        )
      ).toBe("konser");

      expect(
        sanitizeEventType(
          "tiyatro",
          "İş Sanat 27. sezonunu dünyaca ünlü keman virtüözü Viktoria Mullova ve Borusan İstanbul Filarmoni Orkestrası eşliğinde açtı.",
          "İş Sanat’ın konser sezonu Viktoria Mullova ve BİFO ile açıldı"
        )
      ).toBe("konser");
    });

    it("classifies exhibitions and theater accurately", () => {
      expect(
        sanitizeEventType(null, "Adil-i Mutlak Hat Sergisi ziyaretçilerini ağırlıyor.", "Adil-i Mutlak sergisi COP31'de")
      ).toBe("sergi");

      expect(
        sanitizeEventType(null, "Devlet Tiyatroları yeni oyunuyla perde açıyor.", "Hamlet Oyunu Prömiyeri")
      ).toBe("tiyatro");
    });
  });

  describe("extractVenueFromText & extractTurkishDates", () => {
    it("extracts iconic Turkish cultural venues from text", () => {
      expect(
        extractVenueFromText("Konser 15 Kasım'da AKM Türk Telekom Opera Salonu'nda gerçekleştirilecek.")
      ).toBe("AKM Türk Telekom Opera Salonu");

      expect(
        extractVenueFromText("Ebru Gündeş 20 ve 21 Kasım'da Volkswagen Arena'da sahne alacak.")
      ).toBe("Volkswagen Arena");
    });

    it("extracts 'X ve Y Ay' multi-day ranges", () => {
      const dates = extractTurkishDates("Ebru Gündeş, 20 ve 21 Kasım 2026'da Volkswagen Arena'da konser verecek.");
      expect(dates.starts_at).toContain("2026-11-20");
      expect(dates.ends_at).toContain("2026-11-21");
    });
  });

  describe("JSON-LD @graph & Event extraction and inline <strong> preservation", () => {
    it("extracts structured Event from @graph JSON-LD", () => {
      const html = `<!DOCTYPE html><html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "MusicEvent",
              "name": "Fazıl Say - Geleneksel Yıl Sonu Konseri",
              "startDate": "2026-12-26T21:00:00+03:00",
              "location": {
                "@type": "Place",
                "name": "Volkswagen Arena",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "İstanbul"
                }
              },
              "offers": {
                "@type": "Offer",
                "price": "750",
                "url": "https://www.biletix.com/etkinlik/5UVAC/TURKIYE/tr"
              }
            }
          ]
        }
        </script>
      </head><body><p>Fazıl Say yıl sonu konseriyle dinleyicilerle buluşuyor.</p></body></html>`;

      const j = extractJsonLdText(html);
      expect(j.event).toBeDefined();
      expect(j.event?.name).toBe("Fazıl Say - Geleneksel Yıl Sonu Konseri");
      expect(j.event?.venueName).toBe("Volkswagen Arena");
      expect(j.event?.cityLocality).toBe("İstanbul");
      expect(j.event?.startDate).toBe("2026-12-26T21:00:00+03:00");

      const normalized = heuristicNormalizeEvent({
        url: "https://www.biletix.com/etkinlik/5UVAC/TURKIYE/tr",
        pageTitle: j.event?.name,
        pageText: extractPageTextFromHtml(html),
        jsonLdEvent: j.event,
      });
      expect(normalized.event_type).toBe("konser");
      expect(normalized.city_slug).toBe("istanbul");
      expect(normalized.venue_name).toBe("Volkswagen Arena");
      expect(normalized.starts_at).toBe(new Date("2026-12-26T21:00:00+03:00").toISOString());
    });

    it("does NOT split sentences on inline <strong> tags inside div containers", () => {
      const html = `<!DOCTYPE html><html><body>
        <div class="haber-detay">
          <div>Toplantıya <strong>Gaziantep Vali Yardımcısı Bülent Uygur</strong>, <strong>Şehitkamil Belediye Başkan Yardımcısı Hakan Aslansoy</strong> ve akademisyenler katıldı.</div>
        </div>
      </body></html>`;

      const text = extractPageTextFromHtml(html);
      expect(text).toContain("Toplantıya Gaziantep Vali Yardımcısı Bülent Uygur, Şehitkamil Belediye Başkan Yardımcısı Hakan Aslansoy ve akademisyenler katıldı.");
      expect(text).not.toMatch(/\n,\s*Şehitkamil/);
    });
  });

  describe("Discovery Classification & Non-Event Guards", () => {
    it("classifies minister statements and completed festival reports as 'news', not 'event'", () => {
      expect(
        heuristicClassify({
          title: "Bakan Ersoy: COP31 sahası etkinlik bittikten sonra Kültür ve Turizm Bakanlığının yönetimine devrediliyor",
          snippet: "Kültür ve Turizm Bakanı Mehmet Nuri Ersoy açıklamalarda bulundu.",
        }).content_type
      ).toBe("news");

      expect(
        heuristicClassify({
          title: "Antalya'da kültür sanat dolu final",
          snippet: "Antalya Kültür Yolu Festivali dokuzuncu gününde sona erdi.",
        }).content_type
      ).toBe("news");
    });

    it("rejects YouTube watch links, opinion columns, and generic ticketing homepages", () => {
      expect(
        isRejectedNonTurkishOrCommercialContent({
          title: "Liste Şov- Beş Liste Bir Yerde- 2. BÖLÜM",
          sourceUrl: "https://www.youtube.com/watch?v=o_4TOgk7u5U",
        })
      ).toBe(true);

      expect(
        isRejectedNonTurkishOrCommercialContent({
          title: "GLOBAL ETKİNLİKLER ÜLKESİ TÜRKİYE | Arda Sayıner Köşe Yazısı",
          sourceUrl: "https://www.hurriyet.com.tr/yazarlar/arda-sayiner/global-etkinlikler",
        })
      ).toBe(true);

      expect(isNonEventTitle("Maç Biletleri, Konser Biletleri, Tiyatro")).toBe(true);
    });
  });

  describe("Editorial Quality Assessment & Markdown Polishing", () => {
    it("assesses corporate news draft quality and detects clichés or agency leaks", () => {
      const cleanBody = [
        "Muğla'nın Yatağan ilçesindeki Stratonikeia Antik Kenti'nde yürütülen kazı çalışmalarında Roma dönemine tarihlenen 1800 yıllık taban mozaiği gün yüzüne çıkarıldı.",
        "## Kuzey Konut Alanındaki Arkeolojik Bulgular",
        "Kazı Başkanı Prof. Dr. Bilal Söğüt başkanlığındaki ekip tarafından yürütülen çalışmalarda, mozaiğin yaklaşık 60 metrekarelik bir avluyu kapladığı ve geometrik bezemelerin yanı sıra mitolojik sahneler barındırdığı tespit edildi.",
        "## Konservasyon Süreci ve Ziyaret Planlaması",
        "Kültür ve Turizm Bakanlığı izniyle Pamukkale Üniversitesi koordinasyonunda sürdürülen konservasyon işlemlerinin tamamlanmasının ardından eserin yerinde sergilenmesi planlanıyor.",
      ].join("\n\n");

      const report = assessNewsDraft(
        {
          title: "Stratonikeia Antik Kenti'nde 1800 Yıllık Roma Mozaiği Bulundu",
          summary:
            "Muğla'daki Stratonikeia Antik Kenti kazılarında Roma İmparatorluk Dönemi'ne ait 60 metrekarelik taban mozaiği ortaya çıkarıldı. Konservasyon çalışmaları süren eser yerinde ziyarete açılacak.",
          content: cleanBody,
        },
        { minWords: 90 }
      );

      expect(report.passed).toBe(true);
      expect(report.score).toBeGreaterThanOrEqual(85);
    });

    it("extracts unclosed <p> paragraphs in property=articleBody and strips author bios and related news", () => {
      const html = `
        <html><body>
          <div class="text-content d-flex flex-column gap-4" property="articleBody">
            <h2>toplantının kapsamı ve katılımcılar:</h2>
            <p>Şehitkamil Belediyesi’nin paydaşları arasında yer aldığı I. Uluslararası Türk Dünyası Kazı Sonuçları Toplantısı, ortak tarihî ve kültürel mirasın korunmasını amaçlayan bir platform olarak düzenlendi.
            <p>Toplantıya, <strong>Kültür ve Turizm Bakan Yardımcısı Nadir Alpaslan</strong>, <strong>Gaziantep Vali Yardımcısı Bülent Uygur</strong> ile 6 ülkeden bilim insanları katıldı.
            <h3>dülük'ün arkeolojik değeri ve gelecek planları:</h3>
            <p><strong>Dülük Antik Kenti</strong>, Şehitkamil sınırları içinde önemli bir kültürel miras alanı olarak toplantının dikkat çeken konusu oldu ve Roma dönemi Mithras kutsal alanları incelendi.
            <p><strong><i>ŞEHİTKAMİL BELEDİYESİ’NİN DE PAYDAŞLARI ARASINDA BULUNDUĞU, TÜRK DÜNYASININ ORTAK TARİHÎ VE KÜLTÜREL MİRASININ KORUNMASI AMACIYLA DÜZENLENEN I. ULUSLARARASI TÜRK DÜNYASI KAZI SONUÇLARI TOPLANTISI GERÇEKLEŞTİRİLDİ.</i></strong>
          </div>
          <div class="author-card-modern">
            <div class="author-info">
              <span class="author-badge">EDİTÖR</span>
              <h3 class="author-name">Ayşe Yıldız</h3>
              <p class="author-bio">Ben Ayşe Yıldız, 29 yaşındayım. aksiyon.com.tr'nin başkent muhabiriyim. Bürokrasi ve diplomasi trafiğini takip ediyorum.</p>
            </div>
          </div>
          <div class="related-news">
            <div class="section-title"><h4>İLGİLİ HABERLER</h4></div>
            <div class="row"><h3>Palamut balığını dondurucuda saklama yöntemi</h3><p>Adet fiyatı 40 TL ye gerileyen palamutu temizleme rehberi ve detaylar.</p></div>
          </div>
        </body></html>
      `;
      const extracted = extractPageTextFromHtml(html);
      expect(extracted).toContain("## Toplantının Kapsamı ve Katılımcılar");
      expect(extracted).toContain("## Dülük'ün Arkeolojik Değeri ve Gelecek Planları");
      expect(extracted).toContain("Nadir Alpaslan, Gaziantep Vali Yardımcısı Bülent Uygur");
      expect(extracted).not.toContain("Ayşe Yıldız");
      expect(extracted).not.toContain("29 yaşındayım");
      expect(extracted).not.toContain("Palamut balığını");
      expect(extracted).not.toContain("ŞEHİTKAMİL BELEDİYESİ’NİN DE PAYDAŞLARI");
    });

    it("strips bare ALL-CAPS city datelines from paragraphs", () => {
      expect(
        stripDatelineFromParagraph(
          "SİDE - Antalya’nın Manavgat ilçesindeki Side Antik Kenti’nde yürütülen arkeolojik kazı çalışmaları sürüyor."
        )
      ).toBe(
        "Antalya’nın Manavgat ilçesindeki Side Antik Kenti’nde yürütülen arkeolojik kazı çalışmaları sürüyor."
      );
    });

    it("polishes markdown without eating newlines after headings", () => {
      const md = "# Ana Başlık\n\nGiriş paragrafı.\n\n## **Alt Başlık:**\n\nİkinci paragraf.\n\n## Boş Kalan Son Başlık";
      const polished = polishMarkdown(md, "Ana Başlık");
      expect(polished).not.toContain("# Ana Başlık");
      expect(polished).toContain("## Alt Başlık\n\nİkinci paragraf.");
      expect(polished).not.toContain("Boş Kalan Son Başlık");
    });

    it("measures shingle copy ratio accurately", () => {
      const source = "Stratonikeia Antik Kenti kazılarında Roma dönemine ait çok nadir bir taban mozaiği gün yüzüne çıkarıldı.";
      expect(measureCopyRatio(source, source)).toBe(1);
      expect(
        measureCopyRatio(
          "Muğla Yatağan'daki antik yerleşimde sürdürülen arkeolojik çalışmalarda yeni bir mozaik keşfedildi.",
          source
        )
      ).toBe(0);
    });
  });
});
