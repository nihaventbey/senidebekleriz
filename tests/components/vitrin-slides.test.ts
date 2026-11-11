import { describe, it, expect } from "vitest";
import { buildVitrinSlides } from "@/components/home/editorial-hero";
import type { PublicNewsArticle } from "@/lib/data/news";
import type { PublicEvent } from "@/lib/data/events";

const sampleNews: PublicNewsArticle[] = [
  {
    id: "n1",
    title: "Göbeklitepe'de Yeni Keşif",
    slug: "gobeklitepe-yeni-kesif",
    summary: "Şanlıurfa'da arkeolojik kazılarda yeni buluntular ortaya çıkarıldı.",
    content: "Detaylı haber metni",
    category: "arkeoloji",
    citySlug: "sanliurfa",
    cityName: "Şanlıurfa",
    coverImage: "https://example.com/news1.webp",
    sourceName: "AA",
    sourceUrl: null,
    isFeatured: true,
    publishedAt: "2026-11-10T10:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
  },
  {
    id: "n2",
    title: "İstanbul Modern'de Yeni Sergi",
    slug: "istanbul-modern-sergi",
    summary: "Çağdaş sanat seçkisi ziyaretçilerle buluşuyor.",
    content: "Detaylı haber metni 2",
    category: "muze_sergi",
    citySlug: "istanbul",
    cityName: "İstanbul",
    coverImage: "https://example.com/news2.webp",
    sourceName: "Kültür Servisi",
    sourceUrl: null,
    isFeatured: true,
    publishedAt: "2026-11-11T10:00:00Z",
    updatedAt: "2026-11-11T10:00:00Z",
  },
];

const sampleFeaturedEvents: PublicEvent[] = [
  {
    id: "e1",
    title: "Fazıl Say Piyano Resitali",
    slug: "fazil-say-piyano-resitali",
    summary: "AKM Türk Telekom Opera Salonu'nda özel konser.",
    description: null,
    eventType: "konser",
    citySlug: "istanbul",
    cityName: "İstanbul",
    venueName: "AKM",
    startsAt: "2026-11-20T20:00:00Z",
    endsAt: null,
    coverImage: "https://example.com/event1.webp",
    ticketUrl: "https://example.com/ticket",
    sourceUrl: null,
    sourceName: "AKM",
    metaTitle: null,
    metaDescription: null,
    isFeatured: true,
    isFree: false,
    publishedAt: "2026-11-10T10:00:00Z",
  },
];

describe("buildVitrinSlides", () => {
  it("interleaves featured news and featured events into the Vitrin slider", () => {
    const slides = buildVitrinSlides(sampleNews, sampleFeaturedEvents, []);
    expect(slides.length).toBe(3);
    expect(slides[0].kind).toBe("news");
    expect(slides[0].href).toBe("/haber/gobeklitepe-yeni-kesif");
    expect(slides[1].kind).toBe("event");
    expect(slides[1].href).toBe("/etkinlik/fazil-say-piyano-resitali");
    expect(slides[2].kind).toBe("news");
    expect(slides[2].href).toBe("/haber/istanbul-modern-sergi");
  });

  it("falls back to latest events with cover images when no featuredEvents are explicitly set", () => {
    const slides = buildVitrinSlides(sampleNews, [], sampleFeaturedEvents);
    expect(slides.some((s) => s.kind === "event")).toBe(true);
    const eventSlide = slides.find((s) => s.kind === "event");
    expect(eventSlide?.href).toBe("/etkinlik/fazil-say-piyano-resitali");
  });
});
