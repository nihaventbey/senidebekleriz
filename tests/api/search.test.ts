import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";

const mockLimit = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: mockLimit,
    })),
  },
}));

describe("GET /api/search", () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockLimit.mockResolvedValue({ data: [] });
  });

  it("returns empty results for short queries", async () => {
    const request = new NextRequest("http://localhost/api/search?q=a");
    const response = await GET(request);
    const body = await response.json();

    expect(body).toEqual({ results: [] });
  });

  it("returns empty results when query is missing", async () => {
    const request = new NextRequest("http://localhost/api/search");
    const response = await GET(request);
    const body = await response.json();

    expect(body).toEqual({ results: [] });
  });

  it("maps city and place results", async () => {
    mockLimit
      .mockResolvedValueOnce({
        data: [
          {
            name: "İstanbul",
            slug: "istanbul",
            description: "Türkiye'nin en kalabalık şehri",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            name: "Ayasofya",
            slug: "ayasofya",
            description: "Tarihi cami",
            cities: { name: "İstanbul", slug: "istanbul" },
          },
        ],
      });

    const request = new NextRequest("http://localhost/api/search?q=ist");
    const response = await GET(request);
    const body = await response.json();

    expect(body.results).toHaveLength(2);
    expect(body.results[0]).toMatchObject({
      type: "city",
      name: "İstanbul",
      slug: "istanbul",
    });
    expect(body.results[1]).toMatchObject({
      type: "place",
      name: "Ayasofya",
      citySlug: "istanbul",
      cityName: "İstanbul",
    });
  });
});
