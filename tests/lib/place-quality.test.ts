import { describe, expect, it } from "vitest";
import {
  getPlaceDescriptionFallback,
  getPlaceThinContentFallback,
  hasEditorialContent,
  shouldIndexPlace,
} from "@/lib/content/place-quality";

describe("place-quality", () => {
  it("indexes featured places", () => {
    expect(
      shouldIndexPlace({
        description: null,
        source: "osm",
        is_featured: true,
      })
    ).toBe(true);
  });

  it("indexes manual places with enough description", () => {
    const description = "a".repeat(150);
    expect(
      shouldIndexPlace({
        description,
        source: "manual",
        is_featured: false,
      })
    ).toBe(true);
  });

  it("does not index osm places with enriched wikipedia text", () => {
    const description = "a".repeat(300);
    expect(
      shouldIndexPlace({
        description,
        source: "osm",
        is_featured: false,
      })
    ).toBe(false);
  });

  it("detects editorial content", () => {
    expect(
      hasEditorialContent({
        description: "a".repeat(150),
        source: "manual",
      })
    ).toBe(true);
    expect(
      hasEditorialContent({
        description: "a".repeat(149),
        source: "manual",
      })
    ).toBe(false);
  });

  it("provides fallback strings", () => {
    expect(getPlaceDescriptionFallback("Ayasofya", "İstanbul")).toContain(
      "Ayasofya"
    );
    expect(getPlaceThinContentFallback("Ayasofya", "İstanbul")).toContain(
      "yakında"
    );
  });
});
