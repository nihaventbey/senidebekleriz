import { describe, it, expect } from "vitest";
import { uniqueEventSlug } from "@/lib/events/slug";

describe("uniqueEventSlug", () => {
  it("slugifies base title", () => {
    expect(uniqueEventSlug("İstanbul Tiyatro Festivali")).toBe(
      "istanbul-tiyatro-festivali"
    );
  });

  it("appends attempt suffix for duplicates", () => {
    expect(uniqueEventSlug("Konser", 2)).toBe("konser-2");
  });

  it("truncates long slugs", () => {
    const longTitle = "a".repeat(200);
    expect(uniqueEventSlug(longTitle).length).toBeLessThanOrEqual(120);
  });
});
