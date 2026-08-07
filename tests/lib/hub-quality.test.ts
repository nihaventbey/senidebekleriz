import { describe, expect, it } from "vitest";
import {
  shouldIndexCategoryHub,
  shouldIndexCityHub,
} from "@/lib/content/hub-quality";

describe("hub-quality", () => {
  it("indexes city with guide", () => {
    expect(
      shouldIndexCityHub({ hasGuide: true, indexablePlaceCount: 0 })
    ).toBe(true);
  });

  it("indexes city with enough premium places", () => {
    expect(
      shouldIndexCityHub({ hasGuide: false, indexablePlaceCount: 3 })
    ).toBe(true);
  });

  it("noindexes thin city hubs", () => {
    expect(
      shouldIndexCityHub({ hasGuide: false, indexablePlaceCount: 2 })
    ).toBe(false);
  });

  it("noindexes empty categories", () => {
    expect(
      shouldIndexCategoryHub({
        placeCount: 0,
        indexablePlaceCount: 0,
        descriptionLength: 200,
      })
    ).toBe(false);
  });

  it("indexes category with enough premium places", () => {
    expect(
      shouldIndexCategoryHub({
        placeCount: 20,
        indexablePlaceCount: 3,
        descriptionLength: 10,
      })
    ).toBe(true);
  });
});
