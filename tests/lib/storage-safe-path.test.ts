import { describe, it, expect } from "vitest";
import { safePathSegment } from "@/lib/storage/upload-image-from-url";

describe("safePathSegment", () => {
  it("strips agency tokens and datelines from image path slugs", () => {
    expect(
      safePathSegment("istanbul-aa-ayasofya-restorasyonu")
    ).toBe("istanbul-ayasofya-restorasyonu");

    expect(
      safePathSegment("İSTANBUL (AA) - Efes Kazıları - Anadolu Ajansı")
    ).toBe("efes-kazilari");

    expect(
      safePathSegment("gordion-antik-kenti-iha")
    ).toBe("gordion-antik-kenti");

    expect(
      safePathSegment("dha-tiyatro-festivali-acildi")
    ).toBe("tiyatro-festivali-acildi");
  });

  it("does not corrupt authentic words like saat or maas", () => {
    expect(safePathSegment("saat-kulesi")).toBe("saat-kulesi");
    expect(safePathSegment("maas-bordro")).toBe("maas-bordro");
  });

  it("falls back to 'gorsel' if input is solely agency words", () => {
    expect(safePathSegment("Anadolu Ajansı")).toBe("gorsel");
    expect(safePathSegment("AA")).toBe("gorsel");
    expect(safePathSegment("")).toBe("gorsel");
  });
});
