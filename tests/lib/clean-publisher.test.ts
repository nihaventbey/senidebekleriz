import { describe, it, expect } from "vitest";
import {
  cleanPublisherText,
  cleanAgencySlug,
  cleanNewsSlug,
  stripDatelineFromParagraph,
} from "@/lib/ai/clean-publisher";

describe("cleanPublisherText", () => {
  it("removes agency datelines at the beginning", () => {
    expect(
      cleanPublisherText("İSTANBUL (AA) - Ayasofya Restorasyonunda Yeni Aşama")
    ).toBe("Ayasofya Restorasyonunda Yeni Aşama");

    expect(
      cleanPublisherText("ANKARA (İHA) -- Gordion Antik Kenti Ziyaretçi Rekoru Kırdı")
    ).toBe("Gordion Antik Kenti Ziyaretçi Rekoru Kırdı");

    expect(
      cleanPublisherText("İZMİR (DHA): Efes Antik Kenti'nde Heyecan Verici Keşif")
    ).toBe("Efes Antik Kenti'nde Heyecan Verici Keşif");
  });

  it("removes bracketed agency prefixes", () => {
    expect(
      cleanPublisherText("[AA] Topkapı Sarayı Mukaddes Emanetler Dairesi Yenilendi")
    ).toBe("Topkapı Sarayı Mukaddes Emanetler Dairesi Yenilendi");

    expect(
      cleanPublisherText("(İHA) Konya'da Selçuklu Dönemine Ait Kümbet Bulundu")
    ).toBe("Konya'da Selçuklu Dönemine Ait Kümbet Bulundu");

    expect(
      cleanPublisherText("[ÖZEL HABER] Sümela Manastırı'nda Restorasyon")
    ).toBe("Sümela Manastırı'nda Restorasyon");
  });

  it("removes standalone agency prefixes with punctuation", () => {
    expect(
      cleanPublisherText("DHA - Antalya Altın Portakal Film Festivali Başladı")
    ).toBe("Antalya Altın Portakal Film Festivali Başladı");

    expect(
      cleanPublisherText("AA: Tarihi Camide Yangın Paniği")
    ).toBe("Tarihi Camide Yangın Paniği");

    expect(
      cleanPublisherText("İHA / Bodrum Kalesi Ziyarete Açıldı")
    ).toBe("Bodrum Kalesi Ziyarete Açıldı");
  });

  it("does NOT remove authentic words starting with agency letters", () => {
    expect(
      cleanPublisherText("Anka Kuşu Efsanesi Sahnede")
    ).toBe("Anka Kuşu Efsanesi Sahnede");

    expect(
      cleanPublisherText("Ankara Kalesi'nde Kazı Çalışmaları")
    ).toBe("Ankara Kalesi'nde Kazı Çalışmaları");

    expect(
      cleanPublisherText("Saat Kulesi Yenilendi")
    ).toBe("Saat Kulesi Yenilendi");
  });

  it("removes trailing agency suffixes and publisher brands", () => {
    expect(
      cleanPublisherText("Mardin Taş Konakları Koruma Altına Alındı - Anadolu Ajansı")
    ).toBe("Mardin Taş Konakları Koruma Altına Alındı");

    expect(
      cleanPublisherText("Efes Kazılarında 2 Bin Yıllık Heykel Bulundu | İHA")
    ).toBe("Efes Kazılarında 2 Bin Yıllık Heykel Bulundu");

    expect(
      cleanPublisherText("Bodrum Sualtı Arkeoloji Müzesi Ziyarete Açıldı (DHA)")
    ).toBe("Bodrum Sualtı Arkeoloji Müzesi Ziyarete Açıldı");

    expect(
      cleanPublisherText("Sümela Manastırı Restorasyonu Tamamlandı - TRT Haber")
    ).toBe("Sümela Manastırı Restorasyonu Tamamlandı");

    expect(
      cleanPublisherText("Troya Müzesi'ne Avrupa Ödülü - T.C. Kültür ve Turizm Bakanlığı")
    ).toBe("Troya Müzesi'ne Avrupa Ödülü");

    expect(
      cleanPublisherText("Trabzon Sümela'da Ayin İzni - Taka Gazetesi")
    ).toBe("Trabzon Sümela'da Ayin İzni");

    expect(
      cleanPublisherText("Kültür Yolu Festivali Başlıyor | Kültür Portalı")
    ).toBe("Kültür Yolu Festivali Başlıyor");

    expect(
      cleanPublisherText("İzmir Kültürpark'ta Yeni Heykel [AA]")
    ).toBe("İzmir Kültürpark'ta Yeni Heykel");
  });
});

describe("cleanAgencySlug", () => {
  it("removes isolated agency tokens from anywhere in the slug", () => {
    expect(
      cleanAgencySlug("istanbul-aa-ayasofya-restorasyonu")
    ).toBe("istanbul-ayasofya-restorasyonu");

    expect(
      cleanAgencySlug("aa-troya-kazisi")
    ).toBe("troya-kazisi");

    expect(
      cleanAgencySlug("troya-kazisi-aa")
    ).toBe("troya-kazisi");

    expect(
      cleanAgencySlug("troya-aa-kazisi")
    ).toBe("troya-kazisi");

    expect(
      cleanAgencySlug("iha-medrese-acildi-iha")
    ).toBe("medrese-acildi");

    expect(
      cleanAgencySlug("dha-festival-basladi-dha")
    ).toBe("festival-basladi");

    expect(
      cleanAgencySlug("haber-anadolu-ajansi")
    ).toBe("haber");

    expect(
      cleanAgencySlug("anadolu-ajansi-haber")
    ).toBe("haber");
  });

  it("does NOT break Turkish words containing agency substrings", () => {
    expect(cleanAgencySlug("saat-kulesi-onarildi")).toBe("saat-kulesi-onarildi");
    expect(cleanAgencySlug("maas-artisi")).toBe("maas-artisi");
    expect(cleanAgencySlug("ihale-sureci")).toBe("ihale-sureci");
  });
});

describe("cleanNewsSlug", () => {
  it("converts a dirty news title with agencies into a clean slug", () => {
    expect(
      cleanNewsSlug("İSTANBUL (AA) - Ayasofya Restorasyonunda Yeni Aşama - Anadolu Ajansı")
    ).toBe("ayasofya-restorasyonunda-yeni-asama");

    expect(
      cleanNewsSlug("[İHA] Efes Antik Kenti'nde 2 Bin Yıllık Heykel | İHA")
    ).toBe("efes-antik-kentinde-2-bin-yillik-heykel");
  });

  it("returns fallback if empty", () => {
    expect(cleanNewsSlug("Anadolu Ajansı")).toBe("kultur-haberi");
    expect(cleanNewsSlug("AA", "varsayilan-haber")).toBe("varsayilan-haber");
  });
});

describe("stripDatelineFromParagraph", () => {
  it("strips opening agency datelines from paragraphs", () => {
    expect(
      stripDatelineFromParagraph(
        "İSTANBUL (AA) - Kültür ve Turizm Bakanlığı koordinasyonunda çalışmalar başladı."
      )
    ).toBe("Kültür ve Turizm Bakanlığı koordinasyonunda çalışmalar başladı.");

    expect(
      stripDatelineFromParagraph(
        "ANKARA (İHA) -- Devlet Tiyatroları yeni sezona hazır."
      )
    ).toBe("Devlet Tiyatroları yeni sezona hazır.");
  });
});
