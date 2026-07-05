import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeFeedItem } from "@/lib/ai/normalize-event";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import type { RawFeedItem } from "@/lib/events/types";

vi.mock("@/lib/ai/gemini-client", () => ({
  callGeminiJson: vi.fn(),
}));

const mockCallGeminiJson = vi.mocked(callGeminiJson);

const sampleItem: RawFeedItem = {
  title: "Ankara Devlet Opera ve Balesi Konseri",
  link: "https://www.kultur.gov.tr/haber/opera",
  description: "CSO konser duyurusu",
  sourceName: "Kültür Bakanlığı",
  pubDate: "Mon, 01 Jul 2026 10:00:00 GMT",
};

describe("normalizeFeedItem", () => {
  beforeEach(() => {
    mockCallGeminiJson.mockReset();
  });

  it("returns normalized draft from Gemini response", async () => {
    mockCallGeminiJson.mockResolvedValue({
      title: "Ankara Devlet Opera Konseri",
      summary: "CSO Ada Ankara'da özel konser.",
      event_type: "konser",
      city_slug: "ankara",
      venue_name: "CSO Ada",
      starts_at: "2026-07-15T20:00:00.000Z",
      ends_at: null,
      is_cultural_event: true,
      confidence: 0.92,
    });

    const result = await normalizeFeedItem(sampleItem);

    expect(result.is_cultural_event).toBe(true);
    expect(result.event_type).toBe("konser");
    expect(result.city_slug).toBe("ankara");
    expect(result.summary.length).toBeLessThanOrEqual(160);
    expect(mockCallGeminiJson).toHaveBeenCalledOnce();
  });

  it("falls back to RSS title when Gemini omits title", async () => {
    mockCallGeminiJson.mockResolvedValue({
      title: "",
      summary: "Kısa özet",
      event_type: "duyuru",
      city_slug: null,
      venue_name: null,
      starts_at: null,
      ends_at: null,
      is_cultural_event: true,
      confidence: 0.7,
    });

    const result = await normalizeFeedItem(sampleItem);
    expect(result.title).toBe(sampleItem.title);
  });

  it("truncates summary to 160 characters", async () => {
    mockCallGeminiJson.mockResolvedValue({
      title: "Test",
      summary: "a".repeat(200),
      event_type: "duyuru",
      city_slug: null,
      venue_name: null,
      starts_at: null,
      ends_at: null,
      is_cultural_event: true,
      confidence: 0.8,
    });

    const result = await normalizeFeedItem(sampleItem);
    expect(result.summary.length).toBe(160);
  });
});
