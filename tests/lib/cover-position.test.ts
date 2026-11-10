import { describe, it, expect } from "vitest";
import {
  parseCoverImage,
  formatCoverImageUrl,
  DEFAULT_FOCAL_X,
  DEFAULT_FOCAL_Y,
} from "@/lib/media/cover-position";

describe("cover-position helper", () => {
  it("returns head-safe upper-third default (50% 22%) when no position is encoded", () => {
    const res = parseCoverImage(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp"
    );
    expect(res.src).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp"
    );
    expect(res.x).toBe(DEFAULT_FOCAL_X);
    expect(res.y).toBe(DEFAULT_FOCAL_Y);
    expect(res.objectPosition).toBe("50% 22%");
    expect(res.hasCustomPosition).toBe(false);
  });

  it("parses #pos=X,Y hash coordinates and strips hash from src", () => {
    const res = parseCoverImage(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp#pos=40,12"
    );
    expect(res.src).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp"
    );
    expect(res.x).toBe(40);
    expect(res.y).toBe(12);
    expect(res.objectPosition).toBe("40% 12%");
    expect(res.hasCustomPosition).toBe(true);
  });

  it("parses ?pos=X,Y query coordinates and cleans query string", () => {
    const res = parseCoverImage(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp?pos=65,15"
    );
    expect(res.src).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/news/duluk.webp"
    );
    expect(res.x).toBe(65);
    expect(res.y).toBe(15);
    expect(res.objectPosition).toBe("65% 15%");
    expect(res.hasCustomPosition).toBe(true);
  });

  it("clamps out-of-range coordinates to [0, 100]", () => {
    const url = formatCoverImageUrl(
      "https://example.com/photo.webp#pos=50,50",
      150,
      -20
    );
    expect(url).toBe("https://example.com/photo.webp#pos=100,0");
  });

  it("handles empty or null URLs gracefully", () => {
    const res = parseCoverImage(null);
    expect(res.src).toBe("");
    expect(res.objectPosition).toBe("50% 22%");
    expect(formatCoverImageUrl("", 50, 10)).toBe("");
  });
});
