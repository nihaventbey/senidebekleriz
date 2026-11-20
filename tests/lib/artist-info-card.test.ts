import { describe, expect, it } from "vitest";
import {
  hasArtistInfoCardContent,
  normalizeArtistInfoCard,
  parseArtistInfoCardFormValue,
  sanitizeOfficialWebsiteUrl,
} from "@/lib/events/artist-info-card";
import {
  DEFAULT_ARTIST_CARD_SETTINGS,
  normalizeArtistCardSettings,
} from "@/lib/settings/artist-cards";
import { extractResearchEntityCandidates } from "@/lib/ai/research-artist-info";

describe("artist-info-card helpers", () => {
  it("sanitizes official website URLs and blocks unsafe or ticketing domains", () => {
    expect(sanitizeOfficialWebsiteUrl("https://www.wienersymphoniker.at/en")).toBe(
      "https://www.wienersymphoniker.at/en"
    );
    expect(sanitizeOfficialWebsiteUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeOfficialWebsiteUrl("data:text/html,hi")).toBeNull();
    expect(sanitizeOfficialWebsiteUrl("https://www.biletix.com/etkinlik/123")).toBeNull();
    expect(sanitizeOfficialWebsiteUrl("https://www.passo.com.tr/tr/etkinlik/test")).toBeNull();
    expect(sanitizeOfficialWebsiteUrl("https://biletinial.com/tr-tr/muzik/test")).toBeNull();
    expect(sanitizeOfficialWebsiteUrl("not a url")).toBeNull();
  });

  it("normalizes card fields, deduplicates highlights, and checks content completeness", () => {
    const card = normalizeArtistInfoCard({
      enabled: true,
      entityName: "  State Ballet of Georgia  ",
      entityType: "Bale Topluluğu",
      origin: "Gürcistan",
      officialWebsite: "https://opera.ge/",
      summary: "Tiflis merkezli dünyaca ünlü devlet bale topluluğu.",
      websiteNote: "Sanat yönetmenliğini Nina Ananiashvili üstlenmektedir.",
      highlights: [
        "- Klasik bale repertuvarı",
        "Klasik bale repertuvarı",
        "Uluslararası turneler",
      ],
      sourceLabel: "Resmi web sitesi",
    });

    expect(card).not.toBeNull();
    expect(card?.entityName).toBe("State Ballet of Georgia");
    expect(card?.highlights).toEqual([
      "Klasik bale repertuvarı",
      "Uluslararası turneler",
    ]);
    expect(hasArtistInfoCardContent(card)).toBe(true);

    expect(
      hasArtistInfoCardContent(
        normalizeArtistInfoCard({
          entityName: "Sadece İsim",
          summary: "",
        })
      )
    ).toBe(false);
  });

  it("parses FormData values distinctly for omitted, cleared, and JSON inputs", () => {
    expect(parseArtistInfoCardFormValue(null)).toBeUndefined();
    expect(parseArtistInfoCardFormValue("")).toBeNull();
    expect(parseArtistInfoCardFormValue("null")).toBeNull();

    const parsed = parseArtistInfoCardFormValue(
      JSON.stringify({
        enabled: false,
        entityName: "Evgeny Grinko",
        summary: "Rus piyanist ve besteci.",
      })
    );
    expect(parsed?.enabled).toBe(false);
    expect(parsed?.entityName).toBe("Evgeny Grinko");
  });

  it("normalizes global ArtistCardSettings safely", () => {
    expect(normalizeArtistCardSettings(null)).toEqual(DEFAULT_ARTIST_CARD_SETTINGS);
    expect(
      normalizeArtistCardSettings({
        showArtistInfoCards: false,
        autoEnrichOnImport: false,
      })
    ).toEqual({
      showArtistInfoCards: false,
      autoEnrichOnImport: false,
    });
  });

  it("extracts ensembles/artists while filtering out well-known work/ballet titles", () => {
    const c1 = extractResearchEntityCandidates(
      "Ankara Kadın Orkestrası Konseri - Eve Dönüş"
    );
    expect(c1).toContain("Ankara Kadın Orkestrası");
    expect(c1).not.toContain("Eve Dönüş");

    const c2 = extractResearchEntityCandidates(
      "The Imperial Russian Ballet Company: Swan Lake - Kuğu Gölü Balesi"
    );
    expect(c2).toContain("The Imperial Russian Ballet Company");
    expect(c2).not.toContain("Swan Lake");
  });
});
