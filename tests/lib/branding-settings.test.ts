import { describe, expect, it } from "vitest";
import {
  DEFAULT_BRAND_SETTINGS,
  normalizeBrandSettings,
} from "@/lib/settings/branding";

describe("normalizeBrandSettings", () => {
  it("returns defaults for invalid input", () => {
    expect(normalizeBrandSettings(null)).toEqual(DEFAULT_BRAND_SETTINGS);
    expect(normalizeBrandSettings(undefined)).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("normalizes asset urls and trims whitespace", () => {
    const result = normalizeBrandSettings({
      logoUrl: " https://cdn.example/logo.svg ",
      faviconUrl: "https://cdn.example/favicon.png",
      appleTouchIconUrl: "",
      ogImageUrl: "   ",
    });

    expect(result.logoUrl).toBe("https://cdn.example/logo.svg");
    expect(result.faviconUrl).toBe("https://cdn.example/favicon.png");
    expect(result.appleTouchIconUrl).toBeNull();
    expect(result.ogImageUrl).toBeNull();
  });
});
