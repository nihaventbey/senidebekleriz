import { describe, expect, it } from "vitest";
import { extractListPageLinks } from "@/lib/ingest/belediye-scraper";

describe("extractListPageLinks", () => {
  it("extracts same-domain detail links from list page", () => {
    const html = `
      <main>
        <a href="/gezilecek-yerler">Liste</a>
        <a href="/gezilecek-yerler/gok-madrasa">Gök Medrese</a>
        <a href="/gezilecek-yerler/tokat-kalesi">Tokat Kalesi</a>
        <a href="https://tokat.bel.tr/haber/duyuru">Haber</a>
        <a href="https://example.com/gezilecek-yerler/x">Dış link</a>
      </main>
    `;

    const links = extractListPageLinks(
      html,
      "https://tokat.bel.tr/gezilecek-yerler"
    );

    expect(links).toContain("https://tokat.bel.tr/gezilecek-yerler/gok-madrasa");
    expect(links).toContain("https://tokat.bel.tr/gezilecek-yerler/tokat-kalesi");
    expect(links.some((url) => url.includes("example.com"))).toBe(false);
    expect(links.some((url) => url.includes("/haber/"))).toBe(false);
  });

  it("skips pdf and asset links", () => {
    const html = `
      <a href="/gezilecek-yerler/mekan-a">Mekan A</a>
      <a href="/files/brosur.pdf">PDF</a>
    `;

    const links = extractListPageLinks(html, "https://tokat.bel.tr/liste");
    expect(links).toHaveLength(1);
    expect(links[0]).toContain("mekan-a");
  });
});
