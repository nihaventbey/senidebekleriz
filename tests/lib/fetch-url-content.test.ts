import { describe, it, expect } from "vitest";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";

describe("fetchUrlContent", () => {
  it("rejects non-http URLs", async () => {
    await expect(fetchUrlContent("ftp://example.com/page")).rejects.toThrow(
      "Geçersiz URL"
    );
  });
});
