import { describe, expect, it } from "vitest";
import {
  DEFAULT_HERO_SETTINGS,
  normalizeHeroSettings,
} from "@/lib/settings/hero";

describe("normalizeHeroSettings", () => {
  it("returns defaults for invalid input", () => {
    expect(normalizeHeroSettings(null)).toEqual(DEFAULT_HERO_SETTINGS);
    expect(normalizeHeroSettings("bozuk")).toEqual(DEFAULT_HERO_SETTINGS);
  });

  it("clamps overlay opacity and blur to allowed ranges", () => {
    const result = normalizeHeroSettings({
      enabled: true,
      imageUrl: "https://example.com/a.webp",
      effect: "zoom",
      overlayTone: "dark",
      overlayOpacity: 500,
      blur: -3,
    });
    expect(result.overlayOpacity).toBe(90);
    expect(result.blur).toBe(0);
    expect(result.effect).toBe("zoom");
    expect(result.overlayTone).toBe("dark");
  });

  it("falls back to pan effect for unknown values", () => {
    const result = normalizeHeroSettings({
      effect: "spin",
      overlayTone: "neon",
    });
    expect(result.effect).toBe("pan");
    expect(result.overlayTone).toBe("light");
  });

  it("treats empty imageUrl as null", () => {
    const result = normalizeHeroSettings({ imageUrl: "" });
    expect(result.imageUrl).toBeNull();
  });
});
