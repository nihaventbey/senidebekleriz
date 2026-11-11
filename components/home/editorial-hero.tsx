"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Newspaper,
} from "lucide-react";
import type { PublicNewsArticle } from "@/lib/data/news";
import type { PublicEvent } from "@/lib/data/events";
import { parseCoverImage } from "@/lib/media/cover-position";
import { CulturalCoverPlaceholder } from "@/components/ui/cultural-cover-placeholder";

type Props = {
  featuredNews: PublicNewsArticle[];
  featuredEvents?: PublicEvent[];
  latestEvents: PublicEvent[];
  headlineNews?: PublicNewsArticle[];
};

export type VitrinSlideItem = {
  id: string;
  kind: "news" | "event";
  title: string;
  summary: string;
  href: string;
  coverImage: string | null;
  categoryLabel: string;
  cityName: string | null;
  dateLabel: string;
  venueName?: string | null;
  sortTime: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  arkeoloji: "Arkeoloji & Kazı",
  restorasyon: "Tarihi Miras & Restorasyon",
  muze_sergi: "Müze & Sergi",
  sinema: "Sinema & Görsel Sanatlar",
  kultur_sanat: "Kültür & Sanat",
  festival_haberleri: "Festival Gündemi",
  genel: "Genel Kültür",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  tiyatro: "Tiyatro",
  konser: "Konser",
  sergi: "Sergi",
  festival: "Festival",
  duyuru: "Kültür Duyurusu",
  diger: "Kültür Etkinliği",
};

export function buildVitrinSlides(
  featuredNews: PublicNewsArticle[],
  featuredEvents: PublicEvent[] = [],
  latestEvents: PublicEvent[] = []
): VitrinSlideItem[] {
  const newsSlides: VitrinSlideItem[] = featuredNews.map((n) => ({
    id: `news-${n.id}`,
    kind: "news",
    title: n.title,
    summary: n.summary,
    href: `/haber/${n.slug}`,
    coverImage: n.coverImage,
    categoryLabel: CATEGORY_LABELS[n.category] || "Kültür Haberi",
    cityName: n.cityName,
    dateLabel: formatDate(n.publishedAt),
    sortTime: new Date(n.publishedAt).getTime() || 0,
  }));

  // Featured events explicitly marked as vitrin (`is_featured`), or fallback to top 2 upcoming events with cover image
  const sourceEvents =
    featuredEvents.length > 0
      ? featuredEvents
      : latestEvents.filter((e) => Boolean(e.coverImage)).slice(0, 2);

  const eventSlides: VitrinSlideItem[] = sourceEvents.map((e) => ({
    id: `event-${e.id}`,
    kind: "event",
    title: e.title,
    summary: e.summary || e.description || e.title,
    href: `/etkinlik/${e.slug}`,
    coverImage: e.coverImage,
    categoryLabel: EVENT_TYPE_LABELS[e.eventType] || "Etkinlik",
    cityName: e.cityName,
    dateLabel: formatDate(e.startsAt),
    venueName: e.venueName,
    sortTime: e.startsAt ? new Date(e.startsAt).getTime() || 0 : 0,
  }));

  // Interleave news and events so both showcase news and showcase events appear prominently in the Vitrin slider
  const combined: VitrinSlideItem[] = [];
  const maxLen = Math.max(newsSlides.length, eventSlides.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < newsSlides.length) combined.push(newsSlides[i]);
    if (i < eventSlides.length) combined.push(eventSlides[i]);
  }

  return combined.slice(0, 10);
}

export function EditorialHero({
  featuredNews,
  featuredEvents = [],
  latestEvents,
  headlineNews = [],
}: Props) {
  const vitrinSlides = useMemo(
    () => buildVitrinSlides(featuredNews, featuredEvents, latestEvents),
    [featuredNews, featuredEvents, latestEvents]
  );

  // Manşetler (küçük görselli kartlar): vitrin dışındaki haberler veya yedek liste
  const mansetStack = useMemo(() => {
    const vitrinNewsHrefs = new Set(
      vitrinSlides.filter((s) => s.kind === "news").map((s) => s.href)
    );
    const pool = [...headlineNews, ...featuredNews];
    const unique: PublicNewsArticle[] = [];
    const seenIds = new Set<string>();

    for (const item of pool) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      if (!vitrinNewsHrefs.has(`/haber/${item.slug}`) || pool.length <= 4) {
        unique.push(item);
      }
    }

    // Fallback if all items were in vitrin
    if (unique.length < 4) {
      for (const item of pool) {
        if (!unique.some((u) => u.id === item.id)) {
          unique.push(item);
        }
      }
    }
    return unique;
  }, [vitrinSlides, headlineNews, featuredNews]);

  const sideMansets = mansetStack.slice(0, 4);
  const bottomMansets = mansetStack.slice(4, 8);

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pendingTargetRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const slideCount = vitrinSlides.length;

  function scrollToSlide(index: number) {
    const track = trackRef.current;
    if (!track || slideCount === 0) return;
    const normalized = ((index % slideCount) + slideCount) % slideCount;
    const slideEl = track.children[normalized] as HTMLElement | undefined;
    if (!slideEl) return;

    pendingTargetRef.current = normalized;
    setActiveIndex(normalized);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const offset =
      slideEl.offsetLeft - (track.clientWidth - slideEl.clientWidth) / 2;
    track.scrollTo({
      left: offset,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function handlePrev() {
    const base = pendingTargetRef.current ?? activeIndex;
    scrollToSlide(base - 1);
  }

  function handleNext() {
    const base = pendingTargetRef.current ?? activeIndex;
    scrollToSlide(base + 1);
  }

  // Track scroll position & settle updates per modern-web-guidance carousel best practices
  useEffect(() => {
    const track = trackRef.current;
    if (!track || slideCount <= 1) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function computeNearestIndex(): number {
      if (!track) return 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let bestIndex = 0;
      let bestDist = Infinity;
      for (let i = 0; i < track.children.length; i++) {
        const child = track.children[i] as HTMLElement;
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(center - childCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      return bestIndex;
    }

    function onSettle() {
      const idx = computeNearestIndex();
      pendingTargetRef.current = null;
      setActiveIndex(idx);
      setSettledIndex((prev) => (prev === idx ? prev : idx));
    }

    function onScroll() {
      if (pendingTargetRef.current === null) {
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const idx = computeNearestIndex();
            setActiveIndex((prev) => (prev === idx ? prev : idx));
          });
        }
      }

      if (!("onscrollend" in window)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(onSettle, 140);
      }
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    if ("onscrollend" in window) {
      track.addEventListener("scrollend", onSettle, { passive: true });
    }

    return () => {
      track.removeEventListener("scroll", onScroll);
      if ("onscrollend" in window) {
        track.removeEventListener("scrollend", onSettle);
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [slideCount]);

  // Auto-advance Vitrin slider every 6 seconds unless hovered/touched
  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    const timer = setInterval(() => {
      scrollToSlide((pendingTargetRef.current ?? activeIndex) + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideCount, isPaused, activeIndex]);

  const currentSlide = vitrinSlides[activeIndex] || vitrinSlides[0];

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-muted/15 to-background py-5 sm:py-9">
      <div className="container mx-auto px-4">
        {vitrinSlides.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-12 items-stretch">
            {/* ============================================================ */}
            {/* BÜYÜK ALAN: VİTRİN SLIDER (Haberler & Etkinlikler Birlikte)  */}
            {/* ============================================================ */}
            <div
              className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-border/70 bg-card shadow-sm overflow-hidden"
              role="region"
              aria-roledescription="carousel"
              aria-label="Vitrin: Öne Çıkan Haberler ve Etkinlikler"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Slider Track — Native Horizontal Scroll Snap */}
              <div
                ref={trackRef}
                tabIndex={0}
                role="group"
                aria-label="Vitrin slaytları"
                style={{ touchAction: "manipulation" }}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none motion-safe:scroll-smooth flex-1"
              >
                {vitrinSlides.map((slide, idx) => {
                  const cover = parseCoverImage(slide.coverImage);
                  const isEvent = slide.kind === "event";
                  return (
                    <article
                      key={slide.id}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${idx + 1} / ${slideCount}: ${slide.title}`}
                      className="group relative flex-[0_0_100%] w-full snap-center flex flex-col justify-end overflow-hidden min-h-[340px] sm:min-h-[430px]"
                    >
                      {/* Tam Tıklanabilir Görsel Katmanı */}
                      <Link
                        href={slide.href}
                        className="absolute inset-0 z-10 block overflow-hidden bg-muted focus-visible:outline-none"
                        aria-label={slide.title}
                      >
                        {cover.src ? (
                          <img
                            src={cover.src}
                            alt={slide.title}
                            style={{ objectPosition: cover.objectPosition }}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading={idx === 0 ? "eager" : "lazy"}
                            fetchPriority={idx === 0 ? "high" : "auto"}
                            decoding="async"
                          />
                        ) : (
                          <CulturalCoverPlaceholder
                            title={slide.title}
                            category={slide.categoryLabel}
                            cityName={slide.cityName || undefined}
                            iconSize="lg"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                      </Link>

                      {/* Tam Tıklanabilir Başlık, Özet ve Etiket Katmanı */}
                      <div className="relative z-20 p-5 sm:p-7 md:p-8 space-y-2.5 pointer-events-none">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              isEvent
                                ? "bg-amber-500 text-slate-950 font-extrabold text-[11px] border-0 shadow-xs"
                                : "bg-primary text-primary-foreground font-extrabold text-[11px] border-0 shadow-xs"
                            }
                          >
                            {isEvent ? "🎭 VİTRİN · ETKİNLİK" : "🔥 VİTRİN · HABER"}
                          </Badge>

                          <Badge
                            variant="outline"
                            className="bg-black/55 text-white border-white/25 text-[11px] font-semibold backdrop-blur-xs"
                          >
                            {slide.categoryLabel}
                          </Badge>

                          {slide.cityName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white">
                              <MapPin className="h-3 w-3" />
                              {slide.cityName}
                            </span>
                          )}

                          {slide.dateLabel && (
                            <span className="text-xs text-white/85 font-medium ml-auto flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {slide.dateLabel}
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                          <Link
                            href={slide.href}
                            className="pointer-events-auto hover:underline focus-visible:underline block"
                          >
                            {slide.title}
                          </Link>
                        </h2>

                        <p className="line-clamp-2 text-xs sm:text-sm md:text-base text-white/90 leading-relaxed max-w-2xl font-normal">
                          <Link
                            href={slide.href}
                            className="pointer-events-auto hover:text-white block"
                          >
                            {slide.summary}
                          </Link>
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <Link
                            href={slide.href}
                            className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
                          >
                            <span>
                              {isEvent ? "Etkinlik Detayını Gör" : "Haberi Oku"}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </Link>

                          {slide.venueName && (
                            <span className="text-[11px] text-white/75 truncate max-w-[200px]">
                              📍 {slide.venueName}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Polite Status Region for Screen Readers */}
              <p className="sr-only" role="status" aria-live="polite">
                {settledIndex !== null && vitrinSlides[settledIndex]
                  ? `Slayt ${settledIndex + 1} / ${slideCount}: ${vitrinSlides[settledIndex].title}`
                  : ""}
              </p>

              {/* ============================================================ */}
              {/* GÖRSELİ KAPATMAYAN ALT KONTROL ÇUBUĞU (Oklar + Noktalar)     */}
              {/* ============================================================ */}
              {slideCount > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-card/95 px-4 py-2.5">
                  {/* Sol: Önceki / Sonraki Okları (Görselin dışında, temiz bar içinde) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handlePrev}
                      style={{ touchAction: "manipulation" }}
                      className="h-8 w-8 rounded-full border-border/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label="Önceki vitrin içeriği"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      style={{ touchAction: "manipulation" }}
                      className="h-8 w-8 rounded-full border-border/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label="Sonraki vitrin içeriği"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="ml-1.5 text-xs font-bold tabular-nums text-muted-foreground">
                      {activeIndex + 1} / {slideCount}
                    </span>
                  </div>

                  {/* Orta: Slayt Noktaları (Markers) */}
                  <nav
                    aria-label="Vitrin slayt seçimi"
                    className="flex items-center gap-1.5 overflow-x-auto py-1"
                  >
                    {vitrinSlides.map((slide, idx) => {
                      const isCurrent = idx === activeIndex;
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => scrollToSlide(idx)}
                          aria-label={`${idx + 1}. slayta git: ${slide.title}`}
                          aria-current={isCurrent ? "true" : undefined}
                          style={{ touchAction: "manipulation" }}
                          className={`h-2 rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                            isCurrent
                              ? "w-6 bg-primary"
                              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                          }`}
                        />
                      );
                    })}
                  </nav>

                  {/* Sağ: Aktif İçeriğe Git Bağlantısı */}
                  {currentSlide && (
                    <Link
                      href={currentSlide.href}
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                    >
                      <span>{currentSlide.kind === "event" ? "Etkinliğe Git" : "Habere Git"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* KÜÇÜK GÖRSELLİ ALAN: MANŞETLER (Sağ Sütun — 5 Sütun)          */}
            {/* ============================================================ */}
            <div className="flex flex-col justify-between gap-3.5 lg:col-span-5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Manşetler
                  </h3>
                </div>
                <Link
                  href="/haberler"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Tüm Manşetler</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex flex-col gap-3 flex-1 justify-between">
                {sideMansets.map((news, i) => {
                  const secCover = parseCoverImage(news.coverImage);
                  const newsHref = `/haber/${news.slug}`;
                  return (
                    <article
                      key={news.id}
                      className="group relative flex items-center gap-3.5 p-3 rounded-2xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40"
                    >
                      {/* Küçük Görsel (Tam Tıklanabilir Link) */}
                      <Link
                        href={newsHref}
                        className="relative h-20 w-24 sm:h-22 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted block"
                        aria-label={news.title}
                      >
                        {secCover.src ? (
                          <img
                            src={secCover.src}
                            alt={news.title}
                            style={{ objectPosition: secCover.objectPosition }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary/40" />
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-white">
                          0{i + 1}
                        </span>
                      </Link>

                      {/* Yazı Alanı (Kategori + Başlık + Özet Tam Tıklanabilir Link) */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link
                          href={newsHref}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                        >
                          <span>{CATEGORY_LABELS[news.category] || "Kültür Haberi"}</span>
                          {news.cityName && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-muted-foreground font-medium truncate">
                                {news.cityName}
                              </span>
                            </>
                          )}
                        </Link>

                        <h4 className="line-clamp-2 text-xs sm:text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                          <Link href={newsHref} className="hover:underline block">
                            {news.title}
                          </Link>
                        </h4>

                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          <Link href={newsHref} className="hover:text-foreground block">
                            {news.summary}
                          </Link>
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Tüm Kültür & Sanat Haberleri & Etkinlikler Alt Bilgi Çubuğu */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/haberler"
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
                >
                  <span className="truncate">📰 Kültür Haberleri</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
                <Link
                  href="/etkinlikler"
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
                >
                  <span className="truncate">🎭 Etkinlik Takvimi</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback when no news published yet */
          <div className="p-8 text-center rounded-3xl border border-dashed text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
            <h2 className="text-lg font-bold text-foreground">Kültür ve Sanat Gündemi</h2>
            <p className="text-sm mt-1 max-w-md mx-auto">
              Türkiye genelinde sergiler, tiyatro oyunları ve güncel kültür haberleri burada listelenir.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* ALT MANŞETLER (Küçük Görselli 4'lü Manşet Kartları)           */}
        {/* ============================================================ */}
        {bottomMansets.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  Kültür Gündemi · Manşetlerden Seçmeler
                </h3>
              </div>
              <Link
                href="/haberler"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Tüm Gündem</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bottomMansets.map((item) => {
                const itemCover = parseCoverImage(item.coverImage);
                const itemHref = `/haber/${item.slug}`;
                return (
                  <article
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
                  >
                    <div className="space-y-2.5">
                      {itemCover.src && (
                        <Link
                          href={itemHref}
                          className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted block"
                          aria-label={item.title}
                        >
                          <img
                            src={itemCover.src}
                            alt={item.title}
                            style={{ objectPosition: itemCover.objectPosition }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </Link>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <Link href={itemHref} className="text-primary font-bold hover:underline">
                          {CATEGORY_LABELS[item.category] || "Kültür Haberi"}
                        </Link>
                        <span className="text-muted-foreground font-normal">
                          {formatDate(item.publishedAt)}
                        </span>
                      </div>

                      <h4 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                        <Link href={itemHref} className="hover:underline block">
                          {item.title}
                        </Link>
                      </h4>

                      <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        <Link href={itemHref} className="hover:text-foreground block">
                          {item.summary}
                        </Link>
                      </p>
                    </div>

                    <Link
                      href={itemHref}
                      className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs"
                    >
                      {item.cityName ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.cityName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Genel Kültür
                        </span>
                      )}
                      <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Detay <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
