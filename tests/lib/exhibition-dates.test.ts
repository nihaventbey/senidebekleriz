import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}));

import { hasPastDateInText } from "@/lib/discovery/quarter";
import { isEventExpired } from "@/lib/data/events";
import { heuristicNormalizeEvent, resolveExhibitionDates } from "@/lib/ai/normalize-event";

describe("Exhibition & Ongoing Event Date Handling", () => {
  const currentYear = new Date().getFullYear();
  // Reference date: November 9th of the current year
  const refDate = new Date(currentYear, 10, 9, 14, 0, 0); // 9 Kasım

  describe("hasPastDateInText", () => {
    it("does not reject an exhibition that opened yesterday", () => {
      // 8 Kasım is yesterday relative to 9 Kasım
      const text = "Modern Sanat Müzesi'nin yeni karma sergisi 8 Kasım'da kapılarını açtı.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(false);
    });

    it("does not reject an exhibition that opened 20 days ago (within 45-day window)", () => {
      // 20 Ekim is 20 days ago relative to 9 Kasım
      const text = "20 Ekim'de açılan heykel sergisi sanatseverleri ağırlamaya devam ediyor.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(false);
    });

    it("does not reject an exhibition with past opening date but future closing date", () => {
      const text = "15 Ekim'de açılan sergi 30 Kasım'a kadar ziyaret edilebilir.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(false);
    });

    it("does not reject fresh news about a cultural event from 3 days ago", () => {
      // 6 Kasım is 3 days ago relative to 9 Kasım
      const text = "Devlet Tiyatroları yeni oyunuyla 6 Kasım'da prömiyer yaptı.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(false);
    });

    it("correctly identifies truly expired one-off concerts from 20 days ago", () => {
      // 20 Ekim concert without ongoing exhibition context
      const text = "Harbiye Açıkhava'da 20 Ekim'de gerçekleşen rock konseri büyük ilgi gördü.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(true);
    });

    it("correctly identifies exhibitions that opened more than 45 days ago with no future closing date", () => {
      // 1 Eylül is > 65 days ago relative to 9 Kasım
      const text = "1 Eylül'de açılan resim sergisi sona erdi.";
      const isPast = hasPastDateInText(text, refDate);
      expect(isPast).toBe(true);
    });
  });

  describe("isEventExpired", () => {
    it("returns false for an exhibition that opened yesterday without explicit endsAt", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const expired = isEventExpired({
        eventType: "sergi",
        startsAt: yesterday.toISOString(),
        endsAt: null,
      });

      expect(expired).toBe(false);
    });

    it("returns false for an exhibition opened 30 days ago without explicit endsAt", () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expired = isEventExpired({
        eventType: "sergi",
        startsAt: thirtyDaysAgo.toISOString(),
        endsAt: null,
      });

      expect(expired).toBe(false);
    });

    it("returns true for an exhibition opened 60 days ago without explicit endsAt", () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const expired = isEventExpired({
        eventType: "sergi",
        startsAt: sixtyDaysAgo.toISOString(),
        endsAt: null,
      });

      expect(expired).toBe(true);
    });

    it("returns true for a one-off concert that was yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const expired = isEventExpired({
        eventType: "konser",
        startsAt: yesterday.toISOString(),
        endsAt: null,
      });

      expect(expired).toBe(true);
    });
  });

  describe("resolveExhibitionDates", () => {
    it("sets ends_at to 45 days after starts_at for sergi when ends_at is missing", () => {
      const startsAt = "2026-11-08T10:00:00+03:00";
      const resolved = resolveExhibitionDates("sergi", startsAt, null);

      expect(resolved.starts_at).toBe(new Date(startsAt).toISOString());
      const expectedEnd = new Date(new Date(startsAt).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
      expect(resolved.ends_at).toBe(expectedEnd);
    });

    it("preserves explicit ends_at when provided for sergi", () => {
      const startsAt = "2026-11-08T10:00:00+03:00";
      const explicitEndsAt = "2026-11-30T19:00:00+03:00";
      const resolved = resolveExhibitionDates("sergi", startsAt, explicitEndsAt);

      expect(resolved.starts_at).toBe(new Date(startsAt).toISOString());
      expect(resolved.ends_at).toBe(new Date(explicitEndsAt).toISOString());
    });

    it("leaves ends_at null for non-exhibitions (e.g. concerts)", () => {
      const startsAt = "2026-11-08T20:00:00+03:00";
      const resolved = resolveExhibitionDates("konser", startsAt, null);

      expect(resolved.starts_at).toBe(new Date(startsAt).toISOString());
      expect(resolved.ends_at).toBeNull();
    });
  });

  describe("heuristicNormalizeEvent date parsing", () => {
    it("extracts range across months with 'kadar' and sets starts_at and ends_at", () => {
      const result = heuristicNormalizeEvent({
        url: "https://example.com/sergi",
        pageTitle: "Anadolu Medeniyetleri Sergisi",
        pageText: "15 Ekim'de açılan sergi 30 Kasım'a kadar ziyaret edilebilir.",
      });

      expect(result.event_type).toBe("sergi");
      expect(result.starts_at).toBe(new Date(`${currentYear}-10-15T10:00:00+03:00`).toISOString());
      expect(result.ends_at).toBe(new Date(`${currentYear}-11-30T19:00:00+03:00`).toISOString());
    });

    it("auto-assigns +45 days ends_at for exhibition with only opening date", () => {
      const result = heuristicNormalizeEvent({
        url: "https://example.com/sergi-acilis",
        pageTitle: "İstanbul Modern Yeni Sergi",
        pageText: "Yeni sergi 10 Kasım 2026'da kapılarını sanatseverlere açıyor.",
      });

      expect(result.event_type).toBe("sergi");
      const expectedStart = new Date("2026-11-10T20:00:00+03:00").toISOString();
      const expectedEnd = new Date(new Date("2026-11-10T20:00:00+03:00").getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
      expect(result.starts_at).toBe(expectedStart);
      expect(result.ends_at).toBe(expectedEnd);
    });
  });
});
