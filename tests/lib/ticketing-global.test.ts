import { describe, expect, it } from "vitest";
import { scoreGlobalPrestigeCandidate } from "@/lib/events/sources/ticketing-global";

describe("scoreGlobalPrestigeCandidate", () => {
  it("scores world-famous orchestras, ballet companies, choreographers, and tours highly", () => {
    const orchestra = scoreGlobalPrestigeCandidate({
      title: "Viyana Senfoni Orkestrası & Bruce Liu",
      venueName: "AKM Türk Telekom Opera Salonu",
    });
    expect(orchestra.score).toBeGreaterThanOrEqual(45);
    expect(orchestra.category).toBe("orchestra");

    const ballet = scoreGlobalPrestigeCandidate({
      title: "The Imperial Russian Ballet Company: Swan Lake - Kuğu Gölü Balesi",
      venueName: "Zorlu PSM - Turkcell Sahnesi",
    });
    expect(ballet.score).toBeGreaterThanOrEqual(45);
    expect(ballet.category).toBe("choreographer_ballet");

    const tour = scoreGlobalPrestigeCandidate({
      title: "Saint Levant “Afandi World Tour”",
      venueName: "Volkswagen Arena",
    });
    expect(tour.score).toBeGreaterThanOrEqual(40);
    expect(tour.category).toBe("world_artist");
  });

  it("rejects sports matches, promo campaigns, and non-event headlines", () => {
    expect(
      scoreGlobalPrestigeCandidate({
        title: "Fenerbahçe - Galatasaray Süper Lig Maçı",
      }).score
    ).toBeLessThan(0);

    expect(
      scoreGlobalPrestigeCandidate({
        title: "Bilet Friday Zorlu PSM Etkinlikleri",
      }).score
    ).toBeLessThan(0);

    expect(
      scoreGlobalPrestigeCandidate({
        title: "Nilüfer biletleri",
      }).score
    ).toBeLessThan(0);
  });
});
