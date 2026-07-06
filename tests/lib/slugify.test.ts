import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates text", () => {
    expect(slugify("İstanbul")).toBe("istanbul");
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("transliterates Turkish characters", () => {
    expect(slugify("Şehir")).toBe("sehir");
    expect(slugify("Görüş")).toBe("gorus");
    expect(slugify("Üçüncü")).toBe("ucuncu");
    expect(slugify("Çocuk")).toBe("cocuk");
    expect(slugify("Öğrenci")).toBe("ogrenci");
    expect(slugify("Iğdır'da Gezi")).toBe("igdir-da-gezi");
  });

  it("trims and collapses separators", () => {
    expect(slugify("  foo__bar  ")).toBe("foo-bar");
    expect(slugify("a---b")).toBe("a-b");
  });

  it("removes special characters", () => {
    expect(slugify("Galata Kulesi!")).toBe("galata-kulesi");
  });
});
