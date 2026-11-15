import { describe, expect, it } from "vitest";
import {
  hasPastDateInText,
  hasPastYearInTitle,
  isDateInActiveQuarter,
} from "@/lib/discovery/quarter";

describe("discovery quarter & date guards", () => {
  it("handles Turkish uppercase month names and Dec->Jan year wrap in hasPastDateInText", () => {
    const decRef = new Date("2026-12-15T10:00:00Z");
    expect(hasPastDateInText("15 Ocak'ta başlıyor", decRef)).toBe(false);
    expect(hasPastDateInText("15 ŞUBAT 2027 tarihinde açılıyor", decRef)).toBe(false);
    expect(hasPastDateInText("10 Mayıs 2026 konseri", decRef)).toBe(true);
  });

  it("allows recent late-December items during the first 10 days of January", () => {
    const janRef = new Date("2027-01-03T10:00:00Z");
    expect(isDateInActiveQuarter("2026-12-29T12:00:00Z", janRef)).toBe(true);
    expect(isDateInActiveQuarter("2026-12-01T12:00:00Z", janRef)).toBe(false);
  });

  it("detects past years dynamically beyond 2025", () => {
    expect(hasPastYearInTitle("2026 Kültür Festivali Özeti", 2027)).toBe(true);
    expect(hasPastYearInTitle("2027 Kültür Festivali Programı", 2027)).toBe(false);
    expect(hasPastYearInTitle("2026'dan 2027'ye Sergi Seçkisi", 2027)).toBe(false);
  });
});
