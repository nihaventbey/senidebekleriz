import { describe, expect, it } from "vitest";
import {
  getPlaceCardExcerpt,
  getPlaceDescriptionFallback,
  getPlaceThinContentFallback,
  hasEditorialContent,
  shouldIndexPlace,
} from "@/lib/content/place-quality";

const longDescription = Array.from({ length: 150 }, (_, i) => `kelime${i}`).join(
  " "
);

describe("place-quality", () => {
  it("does not index featured-only OSM places", () => {
    expect(
      shouldIndexPlace({
        description: null,
        source: "osm",
        is_featured: true,
        cover_image: "https://example.com/x.jpg",
      })
    ).toBe(false);
  });

  it("indexes manual places with enough words and cover", () => {
    expect(
      shouldIndexPlace({
        description: longDescription,
        source: "manual",
        is_featured: false,
        cover_image: "https://example.com/x.jpg",
      })
    ).toBe(true);
  });

  it("indexes belediye places with enough words and cover", () => {
    expect(
      shouldIndexPlace({
        description: longDescription,
        source: "belediye",
        cover_image: "https://example.com/x.jpg",
      })
    ).toBe(true);
  });

  it("does not index without cover", () => {
    expect(
      shouldIndexPlace({
        description: longDescription,
        source: "manual",
        cover_image: null,
      })
    ).toBe(false);
  });

  it("does not index short character spam as words", () => {
    expect(
      shouldIndexPlace({
        description: "a".repeat(200),
        source: "manual",
        cover_image: "https://example.com/x.jpg",
      })
    ).toBe(false);
  });

  it("does not index osm places even with long text", () => {
    expect(
      shouldIndexPlace({
        description: longDescription,
        source: "osm",
        is_featured: false,
        cover_image: "https://example.com/x.jpg",
      })
    ).toBe(false);
  });

  it("detects editorial content", () => {
    expect(
      hasEditorialContent({
        description: longDescription,
        source: "manual",
      })
    ).toBe(true);
    expect(
      hasEditorialContent({
        description: "kısa metin",
        source: "manual",
      })
    ).toBe(false);
  });

  it("provides neutral fallback strings without template spam", () => {
    expect(getPlaceDescriptionFallback("Ayasofya", "İstanbul")).toBe(
      "Ayasofya — İstanbul"
    );
    expect(getPlaceThinContentFallback("Ayasofya", "İstanbul")).toContain(
      "yakında"
    );
    expect(getPlaceCardExcerpt("Ayasofya", null)).toBe("Ayasofya");
  });
});
