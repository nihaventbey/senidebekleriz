import { describe, it, expect, vi, beforeEach } from "vitest";

const { existingNewsSlugs, existingEventSlugs } = vi.hoisted(() => ({
  existingNewsSlugs: new Set<string>(),
  existingEventSlugs: new Set<string>(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from(table: string) {
      const targetSet =
        table === "cultural_events" ? existingEventSlugs : existingNewsSlugs;
      let eqSlug: string | null = null;
      let neqSlug: string | null = null;

      const chain = {
        select() {
          return chain;
        },
        eq(col: string, val: string) {
          if (col === "slug") eqSlug = val;
          return chain;
        },
        neq(col: string, val: string) {
          if (col === "slug") neqSlug = val;
          return chain;
        },
        async maybeSingle() {
          if (eqSlug && eqSlug !== neqSlug && targetSet.has(eqSlug)) {
            return { data: { id: "mock-id" } };
          }
          return { data: null };
        },
      };

      return chain;
    },
  },
}));

import {
  UNIQUE_SLUG_CODE_REGEX,
  generateNumericSlugCode,
  hasUniqueSlugSuffix,
  buildUniqueSlug,
  allocateUniqueNewsSlug,
  allocateUniqueEventSlug,
} from "@/lib/slug/unique-slug";

describe("unique-slug utilities", () => {
  beforeEach(() => {
    existingNewsSlugs.clear();
    existingEventSlugs.clear();
  });

  describe("generateNumericSlugCode", () => {
    it("generates a 6-digit numeric code in 100000-999999", () => {
      for (let i = 0; i < 20; i++) {
        const code = generateNumericSlugCode();
        expect(code).toMatch(/^\d{6}$/);
        const num = Number(code);
        expect(num).toBeGreaterThanOrEqual(100_000);
        expect(num).toBeLessThanOrEqual(999_999);
      }
    });
  });

  describe("hasUniqueSlugSuffix", () => {
    it("detects trailing 6-digit numeric suffix", () => {
      expect(hasUniqueSlugSuffix("efes-antik-kentinde-kazi-482917")).toBe(true);
      expect(hasUniqueSlugSuffix("efes-antik-kentinde-kazi")).toBe(false);
      expect(hasUniqueSlugSuffix("efes-2026-haberi")).toBe(false);
      expect(hasUniqueSlugSuffix("efes-123456-detay")).toBe(false);
    });
  });

  describe("buildUniqueSlug", () => {
    it("transliterates Turkish characters and appends 6-digit news code", () => {
      const slug = buildUniqueSlug("Efes Antik Kentinde Yeni Kazı Çalışması", {
        fallback: "kultur-haberi",
        code: "482917",
      });
      expect(slug).toBe("efes-antik-kentinde-yeni-kazi-calismasi-482917");
      expect(hasUniqueSlugSuffix(slug)).toBe(true);
    });

    it("appends city slug and 6-digit code for events when city is not in title", () => {
      const slug = buildUniqueSlug("Fındıkkıran Balesi", {
        fallback: "etkinlik",
        citySlug: "ankara",
        code: "739104",
      });
      expect(slug).toBe("findikkiran-balesi-ankara-739104");
    });

    it("does not duplicate city slug when already present as a hyphen token", () => {
      const slug = buildUniqueSlug("Ankara Devlet Tiyatrosu Fındıkkıran Balesi", {
        fallback: "etkinlik",
        citySlug: "ankara",
        code: "739104",
      });
      expect(slug).toBe("ankara-devlet-tiyatrosu-findikkiran-balesi-739104");
    });

    it("still appends city slug if title merely contains city letters inside another word", () => {
      const slug = buildUniqueSlug("Vankaran Festivali", {
        fallback: "etkinlik",
        citySlug: "ankara",
        code: "123456",
      });
      expect(slug).toBe("vankaran-festivali-ankara-123456");
    });

    it("does not double-append a 6-digit code unless forceNewCode is true", () => {
      const preserved = buildUniqueSlug("istanbul-bienali-654321", {
        citySlug: "istanbul",
      });
      expect(preserved).toBe("istanbul-bienali-654321");

      const replaced = buildUniqueSlug("istanbul-bienali-654321", {
        citySlug: "istanbul",
        forceNewCode: true,
        code: "987654",
      });
      expect(replaced).toBe("istanbul-bienali-987654");
    });

    it("truncates cleanly at word boundary without trailing hyphens within maxLength", () => {
      const longTitle =
        "tarihi yarimadada topkapi sarayi muze ve kultur sanat etkinlikleri sonbahar programi duyruldu";
      const slug = buildUniqueSlug(longTitle, {
        citySlug: "istanbul",
        maxLength: 60,
        code: "555111",
      });
      expect(slug.length).toBeLessThanOrEqual(60);
      expect(slug).toMatch(UNIQUE_SLUG_CODE_REGEX);
      expect(slug).toContain("-istanbul-555111");
      expect(slug).not.toContain("--");
    });

    it("produces distinct outputs for identical inputs across calls", () => {
      const results = new Set<string>();
      for (let i = 0; i < 8; i++) {
        results.add(buildUniqueSlug("Aynı Başlıkta Kültür Haberi"));
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("allocateUniqueNewsSlug", () => {
    it("allocates a unique news slug with a 6-digit suffix", async () => {
      const slug = await allocateUniqueNewsSlug(
        "Topkapı Sarayı Yeni Sergi Salonu Açılıyor"
      );
      expect(slug).toMatch(/^topkapi-sarayi-yeni-sergi-salonu-aciliyor-\d{6}$/);
    });

    it("preserves an existing published news slug when editing without changing slug", async () => {
      const legacySlug = "topkapi-sarayi-eski-yayin-slugu";
      existingNewsSlugs.add(legacySlug);

      const resolved = await allocateUniqueNewsSlug(legacySlug, {
        existingSlug: legacySlug,
        preserveExisting: true,
      });
      expect(resolved).toBe(legacySlug);
    });
  });

  describe("allocateUniqueEventSlug", () => {
    it("allocates a unique event slug with city and 6-digit suffix", async () => {
      const slug = await allocateUniqueEventSlug("Fazıl Say Piyano Resitali", {
        citySlug: "izmir",
      });
      expect(slug).toMatch(/^fazil-say-piyano-resitali-izmir-\d{6}$/);
    });

    it("preserves an existing published event slug during edit", async () => {
      const existing = "fazil-say-konseri";
      existingEventSlugs.add(existing);

      const resolved = await allocateUniqueEventSlug(existing, {
        citySlug: "istanbul",
        existingSlug: existing,
        preserveExisting: true,
      });
      expect(resolved).toBe(existing);
    });
  });
});
