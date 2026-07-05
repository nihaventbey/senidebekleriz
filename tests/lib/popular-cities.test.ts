import { describe, it, expect } from "vitest";
import { pickPopularCities } from "@/lib/cities/popular";
import type { CityData } from "@/lib/data/cities";

function city(slug: string, name: string): CityData {
  return {
    id: slug,
    name,
    slug,
    region: "Test",
    description: "",
    lat: 0,
    lng: 0,
    coverImage: null,
  };
}

describe("pickPopularCities", () => {
  it("orders by population rank, not alphabetically", () => {
    const input = [
      city("adana", "Adana"),
      city("istanbul", "İstanbul"),
      city("ankara", "Ankara"),
      city("izmir", "İzmir"),
    ];

    const result = pickPopularCities(input, 3);
    expect(result.map((c) => c.slug)).toEqual([
      "istanbul",
      "ankara",
      "izmir",
    ]);
  });
});
