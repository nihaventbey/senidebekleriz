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
    expect(draft.slug).toBe("antik-tiyatroda-restorasyon-calismalari-basladi");
    expect(draft.category).toBe("arkeoloji");
    expect(draft.word_count).toBeGreaterThan(20);
    expect(draft.content.startsWith("# ")).toBe(false);
    expect(draft.content).not.toContain("## Gelişmeler ve Kültürel Detaylar");
    expect(draft.content).not.toContain("## Program, Mekân ve Katılım Bilgileri");
    expect(draft.content).not.toContain("## Kaynak ve Detaylar");
    expect(draft.content).not.toContain("<a ");
    expect(draft.content).not.toContain("<font");
  });

  it("strips agency prefixes, datelines, and suffixes from topic and slug in news drafts", async () => {
    const draft = await generateNewsDraft({
      topic: "İSTANBUL (AA) - Ayasofya-i Kebir Camiinde Tarihi Restorasyon - Anadolu Ajansı",
      fallbackText: "Kültür ve Turizm Bakanlığı Ayasofya restorasyon çalışmalarında 1500 yıllık mozaikleri korumaya aldı. Çelik iskeleler kuruldu.",
      cityName: "İstanbul",
      depth: "standard",
    });

    expect(draft.title).toBe("Ayasofya-i Kebir Camiinde Tarihi Restorasyon");
    expect(draft.slug).toBe("ayasofya-i-kebir-camiinde-tarihi-restorasyon");
    expect(draft.slug).not.toContain("aa");
    expect(draft.slug).not.toContain("anadolu-ajansi");
    expect(draft.title).not.toContain("AA");
    expect(draft.title).not.toContain("Anadolu Ajansı");
  });
});
