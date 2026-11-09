import { describe, it, expect, vi } from "vitest";
import {
  extractArtistCandidates,
  isDummyDeezerImage,
  isArtistNameMatch,
  isGenericStockConcertImage,
  resolveArtistOrEventCover,
  GENERIC_STOCK_CONCERT_IMAGE,
} from "@/lib/events/artist-image-resolver";

describe("artist-image-resolver", () => {
  describe("extractArtistCandidates", () => {
    it("extracts exact artist for core concert titles", () => {
      expect(extractArtistCandidates("Dedublüman Konseri")).toContain("Dedublüman");
      expect(extractArtistCandidates("Prime Orchestra Rock Sympho Show")).toContain("Prime Orchestra");
      expect(extractArtistCandidates("Ebru Yaşar Konseri - Antalya Kültür Yolu Festivali")[0]).toBe("Ebru Yaşar");
      expect(extractArtistCandidates("Jethro Tull - The Curiosity Tour 2026")).toContain("Jethro Tull");
      expect(extractArtistCandidates("Ebru Gündeş ile Beraber Söylüyoruz")).toContain("Ebru Gündeş");
      expect(extractArtistCandidates("Yüzyüzeyken Konuşuruz Konseri")).toContain("Yüzyüzeyken Konuşuruz");
      expect(extractArtistCandidates("Ragheb Alama Konseri")).toContain("Ragheb Alama");
      expect(extractArtistCandidates("Mert Demir Konseri")).toContain("Mert Demir");
      expect(extractArtistCandidates("Edis Konseri")).toContain("Edis");
      expect(extractArtistCandidates("Sefo Konseri - Antalya Kültür Yolu Festivali")[0]).toBe("Sefo");
      expect(extractArtistCandidates("Gökhan Türkmen Konseri - Antalya Kültür Yolu Festivali")[0]).toBe("Gökhan Türkmen");
      expect(extractArtistCandidates("Gökhan Tepe Konseri")).toContain("Gökhan Tepe");
      expect(extractArtistCandidates("Suzan Kardeş’le Bi’Bakıp ÇıkıJazz")).toContain("Suzan Kardeş");
    });

    it("handles multi-artist and collaborative concerts", () => {
      const candidates = extractArtistCandidates("Borusan İstanbul Filarmoni Orkestrası & Viktoria Mullova");
      expect(candidates).toContain("Borusan İstanbul Filarmoni Orkestrası");
      expect(candidates).toContain("Viktoria Mullova");

      const duo = extractArtistCandidates("B.times ile Bizlik Masalar - Sıla & Yaşar");
      expect(duo).toContain("Sıla");
      expect(duo).toContain("Yaşar");
    });

    it("filters out empty, pure numbers, or generic musical and event keywords", () => {
      expect(extractArtistCandidates("")).toEqual([]);
      expect(extractArtistCandidates("   ")).toEqual([]);
      expect(extractArtistCandidates("12345")).toEqual([]);
      expect(extractArtistCandidates("Konser")).toEqual([]);
      expect(extractArtistCandidates("Festival")).toEqual([]);
      expect(extractArtistCandidates("Senfonik Konser")).toEqual([]);
      expect(extractArtistCandidates("Hicazkar Köçekçeler & İstanbul Şarkıları Konseri")).toEqual([]);
      expect(extractArtistCandidates("Resital")).toEqual([]);
      expect(extractArtistCandidates("Senfoni Konseri")).toEqual([]);
    });
  });

  describe("isDummyDeezerImage", () => {
    it("flags empty, null, or blank hash images as dummy", () => {
      expect(isDummyDeezerImage(null)).toBe(true);
      expect(isDummyDeezerImage("")).toBe(true);
      expect(
        isDummyDeezerImage("https://cdn-images.dzcdn.net/images/artist//1000x1000-000000-80-0-0.jpg")
      ).toBe(true);
      expect(
        isDummyDeezerImage("https://e-cdns-images.dzcdn.net/images/artist/default/250x250.jpg")
      ).toBe(true);
    });

    it("accepts valid Deezer CDN images with real hashes", () => {
      expect(
        isDummyDeezerImage("https://cdn-images.dzcdn.net/images/artist/770829c037424b371faca8e33ef5e084/1000x1000-000000-80-0-0.jpg")
      ).toBe(false);
      expect(
        isDummyDeezerImage("https://cdn-images.dzcdn.net/images/artist/b0154dcf6895bb174cc2ba061f20481c/1000x1000-000000-80-0-0.jpg")
      ).toBe(false);
    });
  });

  describe("isArtistNameMatch", () => {
    it("matches artist names across diacritics and Turkish casing", () => {
      expect(isArtistNameMatch("Dedublüman", "Dedublüman")).toBe(true);
      expect(isArtistNameMatch("Dedublüman", "Dedubluman")).toBe(true);
      expect(isArtistNameMatch("Ebru Yaşar", "Ebru Yasar")).toBe(true);
      expect(isArtistNameMatch("Ebru Gündeş", "Ebru Gundes")).toBe(true);
      expect(isArtistNameMatch("Sefo", "S.E.F.O")).toBe(true);
      expect(isArtistNameMatch("Jethro Tull", "Jethro Tull")).toBe(true);
      expect(isArtistNameMatch("Jethro Tull", "Jethro Tull (band)")).toBe(true);
    });

    it("matches distinct collaboration and featured artist segments", () => {
      expect(isArtistNameMatch("Dedublüman", "Dedublüman & Çağrı Telkıvıran")).toBe(true);
      expect(isArtistNameMatch("Halil Sezai", "Halil Sezai feat. Cem Adrian")).toBe(true);
      expect(isArtistNameMatch("Viktoria Mullova", "Borusan İstanbul Filarmoni Orkestrası & Viktoria Mullova")).toBe(true);
    });

    it("strictly rejects loose substring overlaps and partial name matches", () => {
      expect(isArtistNameMatch("Dedublüman", "Edis")).toBe(false);
      expect(isArtistNameMatch("Ebru Yaşar", "Tarkan")).toBe(false);
      expect(isArtistNameMatch("Prime Orchestra", "Ankara Devlet Senfoni Orkestrası")).toBe(false);
      // Substring bug edge cases:
      expect(isArtistNameMatch("Hadise", "Adi")).toBe(false);
      expect(isArtistNameMatch("Halil Sezai", "Ali")).toBe(false);
      expect(isArtistNameMatch("Murat Boz", "Rat")).toBe(false);
      expect(isArtistNameMatch("Eve Dönüş", "Eve Dönüş Yok")).toBe(false);
      expect(isArtistNameMatch("Sıla & Yaşar", "Zeynep Sıla Yaşar")).toBe(false);
      expect(isArtistNameMatch("Edis", "Ed")).toBe(false);
      expect(isArtistNameMatch("Senfonik", "KREYOL MAJESTIK SENFONIK")).toBe(false);
    });
  });

  describe("isGenericStockConcertImage", () => {
    it("flags duplicate generic stock concert photos across rock, jazz, and classical", () => {
      expect(isGenericStockConcertImage(GENERIC_STOCK_CONCERT_IMAGE)).toBe(true);
      expect(
        isGenericStockConcertImage("https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-rock.webp")
      ).toBe(true);
      expect(
        isGenericStockConcertImage("https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-jazz.webp")
      ).toBe(true);
      expect(
        isGenericStockConcertImage("https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-classical.webp")
      ).toBe(true);
    });

    it("passes authentic artist covers or null", () => {
      expect(isGenericStockConcertImage(null)).toBe(false);
      expect(
        isGenericStockConcertImage("https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/artists/dedubluman.webp")
      ).toBe(false);
    });
  });

  describe("resolveArtistOrEventCover", () => {
    it("returns null for concert when no authentic photo exists and prevents duplicate stock rock photo", async () => {
      const cover = await resolveArtistOrEventCover({
        title: "Bilinmeyen Yerel Müzisyen Konseri",
        event_type: "konser",
        sourceCover: GENERIC_STOCK_CONCERT_IMAGE, // generic rock stock passed
      });
      // Generic stock concert image must be banned and return null
      expect(cover).toBeNull();
    }, 15000);

    it("returns null for concert when sourceCover is curated stock jazz or classical", async () => {
      const coverJazz = await resolveArtistOrEventCover({
        title: "Mahalle Müzik Dinletisi Konseri",
        event_type: "konser",
        sourceCover: "https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-jazz.webp",
      });
      expect(coverJazz).toBeNull();

      const coverClassical = await resolveArtistOrEventCover({
        title: "Bilinmeyen Oda Müziği Konseri",
        event_type: "konser",
        sourceCover: "https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/curated/concert-classical.webp",
      });
      expect(coverClassical).toBeNull();
    }, 15000);

    it("keeps genuine non-stock source covers for non-concert events", async () => {
      const realCover = "https://xoiqkiszarzmkncwxgjc.supabase.co/storage/v1/object/public/media/events/tiyatro-ozel.webp";
      const cover = await resolveArtistOrEventCover({
        title: "Kral Lear Tiyatro Oyunu",
        event_type: "tiyatro",
        sourceCover: realCover,
      });
      expect(cover).toBe(realCover);
    });
  });
});
