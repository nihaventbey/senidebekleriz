import { describe, expect, it } from "vitest";
import {
  countWords,
  evaluateArticleContent,
  evaluatePlaceDescription,
} from "@/lib/content/editorial-checklist";

describe("editorial-checklist", () => {
  it("counts words", () => {
    expect(countWords("merhaba dünya")).toBe(2);
  });

  it("fails short content", () => {
    const result = evaluatePlaceDescription("Kısa metin.");
    expect(result.isReady).toBe(false);
    expect(result.checks.find((c) => c.id === "length")?.passed).toBe(false);
  });

  it("passes structured long content with practical hints", () => {
    const words = Array.from({ length: 210 }, (_, i) => `kelime${i}`).join(" ");
    const content = `## Başlık\n\n${words}\n\n- Ulaşım: metro ile gidilir\n- Bilet: müze kartı geçerli`;
    const result = evaluateArticleContent(content);
    expect(result.wordCount).toBeGreaterThanOrEqual(200);
    expect(result.checks.find((c) => c.id === "structure")?.passed).toBe(true);
    expect(result.checks.find((c) => c.id === "practical")?.passed).toBe(true);
  });
});
