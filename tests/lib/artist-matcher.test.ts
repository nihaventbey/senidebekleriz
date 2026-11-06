import { describe, it, expect } from "vitest";
import {
  isNonEventTitle,
  resolveCuratedGenreKey,
  resolveCuratedEventImage,
  CURATED_GENRE_IMAGES,
} from "@/lib/events/artist-matcher";

describe("artist-matcher & event curation", () => {
  describe("isNonEventTitle", () => {
    it("flags question titles as non-events", () => {
      expect(
        isNonEventTitle("Muammer Karaca Tiyatrosu kasım ayında hangi etkinliklere ev sahipliği yapacak?")
      ).toBe(true);
      expect(isNonEventTitle("Bu hafta sonu İstanbul'da neler var?")).toBe(true);
    });

    it("flags official circulars and job notices", () => {
      expect(isNonEventTitle("İstanbul Atatürk Kültür Merkezi Sürekli İşçi Alım İlanı")).toBe(true);
      expect(isNonEventTitle("Turist Rehberliği Yabancı Dil Sınavı Hakkında Duyuru")).toBe(true);
      expect(isNonEventTitle("Sürdürülebilirlik Programı Kapsamında Genelge")).toBe(true);
    });

    it("flags generic monthly programs without single event form", () => {
      expect(
        isNonEventTitle("Ahmed Adnan Sanat Merkezi (AASSM) Kasım 2026 Etkinlik Programı")
      ).toBe(true);
      expect(isNonEventTitle("Temmuz Ayı İstanbul Etkinlik Ajandası")).toBe(true);
    });

    it("passes genuine cultural events", () => {
      expect(isNonEventTitle("Borusan İstanbul Filarmoni Orkestrası & Viktoria Mullova")).toBe(false);
      expect(isNonEventTitle("Maskbeth Tiyatro Oyunu")).toBe(false);
      expect(isNonEventTitle("Edis Konseri")).toBe(false);
      expect(isNonEventTitle("50 Eser İlk Kez Sergileniyor! 19 Müze Tek Sergide")).toBe(false);
      expect(isNonEventTitle("İzmir Kültür Yolu Festivali")).toBe(false);
    });
  });

  describe("resolveCuratedGenreKey", () => {
    it("maps classical music concerts correctly", () => {
      expect(
        resolveCuratedGenreKey({
          title: "Borusan İstanbul Filarmoni Orkestrası",
          event_type: "konser",
        })
      ).toBe("concert-classical");

      expect(
        resolveCuratedGenreKey({
          title: "Günümüzdeki Nağmeler - TSM Bölümü Konseri",
          event_type: "konser",
        })
      ).toBe("concert-classical");

      expect(
        resolveCuratedGenreKey({
          title: "Prime Orchestra Rock Sympho Show",
          event_type: "konser",
        })
      ).toBe("concert-classical");
    });

    it("maps jazz and blues concerts correctly", () => {
      expect(
        resolveCuratedGenreKey({
          title: "Suzan Kardeş’le Bi’Bakıp ÇıkıJazz",
          event_type: "konser",
        })
      ).toBe("concert-jazz");

      expect(
        resolveCuratedGenreKey({
          title: "Mahalle Evleri Ritim Grubu Konseri",
          event_type: "konser",
        })
      ).toBe("concert-jazz");
    });

    it("maps rock and pop concerts correctly", () => {
      expect(
        resolveCuratedGenreKey({
          title: "Edis Konseri",
          event_type: "konser",
        })
      ).toBe("concert-rock");

      expect(
        resolveCuratedGenreKey({
          title: "Duman Harbiye Konseri",
          event_type: "konser",
        })
      ).toBe("concert-rock");
    });

    it("maps theater genres accurately (drama, children, opera/show)", () => {
      expect(
        resolveCuratedGenreKey({
          title: "İki Bavul Dolusu Çocuk Oyunu",
          event_type: "tiyatro",
        })
      ).toBe("theatre-children");

      expect(
        resolveCuratedGenreKey({
          title: "Eser Yenenler ile İtiraf Et",
          event_type: "tiyatro",
        })
      ).toBe("theatre-opera");

      expect(
        resolveCuratedGenreKey({
          title: "Bir Adam Yaratmak Tiyatro Oyunu",
          event_type: "tiyatro",
        })
      ).toBe("theatre-drama");
    });

    it("maps art exhibitions and festivals", () => {
      expect(
        resolveCuratedGenreKey({
          title: "Azerbaycan-Türkiye El Sanatları Sergisi",
          event_type: "sergi",
        })
      ).toBe("exhibition-art");

      expect(
        resolveCuratedGenreKey({
          title: "Türkiye Kültür Yolu Festivali - Sakarya",
          event_type: "festival",
        })
      ).toBe("festival-heritage");
    });
  });

  describe("resolveCuratedEventImage", () => {
    it("returns verified WebP storage URL for classical genre", () => {
      const img = resolveCuratedEventImage({
        title: "Borusan Filarmoni Konseri",
        event_type: "konser",
      });
      expect(img).toBe(CURATED_GENRE_IMAGES["concert-classical"]);
      expect(img).toMatch(/^https:\/\/.*\.supabase\.co\/storage\/.*\.webp$/);
    });

    it("returns null for concert-rock to ban duplicate stock photos", () => {
      const img = resolveCuratedEventImage({
        title: "Edis Konseri",
        event_type: "konser",
      });
      expect(img).toBeNull();
    });
  });
});
