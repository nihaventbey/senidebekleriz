import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/place-image/route";

vi.mock("@/lib/data/place-images", () => ({
  getPlaceImageServerSide: vi.fn(async () => ({
    url: "https://example.com/image.jpg",
    alt: "Test Place",
    source: "wikimedia",
  })),
}));

describe("GET /api/place-image", () => {
  it("returns 400 when placeName is missing", async () => {
    const request = new NextRequest("http://localhost/api/place-image");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ image: null });
  });

  it("returns image payload for valid request", async () => {
    const request = new NextRequest(
      "http://localhost/api/place-image?placeName=Ayasofya&cityName=İstanbul"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(body.image).toMatchObject({
      url: "https://example.com/image.jpg",
      alt: "Test Place",
      source: "wikimedia",
    });
  });
});
