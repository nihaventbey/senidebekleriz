import { describe, expect, it } from "vitest";
import { isValidCitySlug, normalizeCitySlug } from "@/lib/cities/lookup";

describe("city slug validation", () => {
  it("accepts valid turkey city slugs", () => {
    expect(isValidCitySlug("tokat")).toBe(true);
    expect(isValidCitySlug("istanbul")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidCitySlug("kapadokya")).toBe(false);
    expect(isValidCitySlug("")).toBe(false);
  });

  it("normalizes invalid slugs to null", () => {
    expect(normalizeCitySlug("nevsehir")).toBe("nevsehir");
    expect(normalizeCitySlug("invalid-city")).toBeNull();
    expect(normalizeCitySlug("none")).toBeNull();
  });
});
