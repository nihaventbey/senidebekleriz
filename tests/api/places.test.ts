import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/places/route";

const mockRange = vi.fn();
const mockSingle = vi.fn();

function createQueryChain() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    range: mockRange,
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  return chain;
}

const placesChain = createQueryChain();

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "cities") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: mockSingle,
        };
      }

      return placesChain;
    }),
  },
}));

describe("GET /api/places", () => {
  beforeEach(() => {
    mockSingle.mockReset();
    mockRange.mockReset();
    mockSingle.mockResolvedValue({ data: { id: "city-1" } });
    mockRange.mockResolvedValue({
      data: [
        {
          id: "place-1",
          name: "Ayasofya",
          slug: "ayasofya",
          description: "Tarihi yapı",
          address: null,
          lat: 41.0086,
          lng: 28.98,
          source: "osm",
          wikidata_id: "Q12506",
          cover_image: "https://example.com/ayasofya.jpg",
          is_featured: true,
          cities: { name: "İstanbul", slug: "istanbul" },
          place_categories: [{ categories: { name: "Tarihi Yer", slug: "tarihi-yer" } }],
        },
      ],
      error: null,
    });
  });

  it("returns paginated place items for a city", async () => {
    const request = new NextRequest(
      "http://localhost/api/places?city=istanbul&page=1&limit=20"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      name: "Ayasofya",
      slug: "ayasofya",
      citySlug: "istanbul",
      cityName: "İstanbul",
      cover_image: "https://example.com/ayasofya.jpg",
      is_featured: true,
      category: "tarihi-yer",
    });
  });
});
