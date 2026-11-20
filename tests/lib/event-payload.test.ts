import { describe, expect, it } from "vitest";
import { buildEventRawPayload } from "@/lib/events/event-payload";
import type { ArtistInfoCard } from "@/lib/events/artist-info-card";

const sampleCard: ArtistInfoCard = {
  enabled: true,
  entityName: "Viyana Senfoni Orkestrası",
  entityType: "Senfoni Orkestrası",
  origin: "Avusturya",
  officialWebsite: "https://www.wienersymphoniker.at/en",
  summary: "1900 yılında kurulan köklü Viyana orkestrası.",
  websiteNote: "2026-2027 Avrupa turnesi kapsamında İstanbul konseri veriyor.",
  highlights: ["1900 kuruluşlu", "Avrupa turnesi"],
  sourceLabel: "Resmi web sitesi ve Wikidata",
  updatedAt: "2026-11-20T09:00:00.000Z",
};

describe("buildEventRawPayload", () => {
  it("preserves existing keys and synchronizes is_free=true and price_type=free", () => {
    const result = buildEventRawPayload(
      { ticketing_source: "Passo", custom_flag: 42 },
      { isFree: true }
    );

    expect(result).toEqual({
      ticketing_source: "Passo",
      custom_flag: 42,
      is_free: true,
      price_type: "free",
    });
  });

  it("clears stale price_type='free' when isFree becomes false", () => {
    const result = buildEventRawPayload(
      { is_free: true, price_type: "free", imported: { source: "rss" } },
      { isFree: false }
    );

    expect(result.is_free).toBe(false);
    expect(result.price_type).toBe("paid");
    expect(result.imported).toEqual({ source: "rss" });
  });

  it("sets, preserves (undefined), and clears (null) artist_info_card", () => {
    const withCard = buildEventRawPayload(null, {
      isFree: false,
      artistInfoCard: sampleCard,
    });
    expect(withCard.artist_info_card).toEqual(sampleCard);

    const preserved = buildEventRawPayload(withCard, {
      isFree: true,
      artistInfoCard: undefined,
    });
    expect(preserved.artist_info_card).toEqual(sampleCard);
    expect(preserved.is_free).toBe(true);
    expect(preserved.price_type).toBe("free");

    const cleared = buildEventRawPayload(preserved, {
      isFree: false,
      artistInfoCard: null,
    });
    expect("artist_info_card" in cleared).toBe(false);
    expect(cleared.is_free).toBe(false);
    expect(cleared.price_type).toBe("paid");
  });
});
