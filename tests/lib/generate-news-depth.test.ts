import { describe, it, expect, vi } from "vitest";
import { generateNewsDraft } from "@/lib/ai/generate-news";

describe("generateNewsDraft", () => {
  it("calculates word_count and returns clean structured fallback when AI call is skipped/fails", async () => {
    const draft = await generateNewsDraft({
      topic: "Antik Tiyatroda Restorasyon Çalışmaları Başladı",
      fallbackText: "Muğla'nın Stratonikeia Antik Kenti'nde yer alan 2 bin 200 yıllık antik tiyatroda restorasyon ve konservasyon çalışmaları yeniden başladı. Kazı heyeti başkanı tiyatronun sahne binasının aslına uygun olarak ayağa kaldırılacağını belirtti.",
      cityName: "Muğla",
      depth: "deep",
    });

    expect(draft.title).toContain("Antik Tiyatro");
    expect(draft.category).toBe("arkeoloji");
    expect(draft.word_count).toBeGreaterThan(30);
    expect(draft.content.startsWith("# ")).toBe(false);
    expect(draft.content).toContain("## Gelişmeler ve Kültürel Detaylar");
    expect(draft.content).toContain("## Kaynak ve Detaylar");
    expect(draft.content).not.toContain("<a ");
    expect(draft.content).not.toContain("<font");
  });
});
