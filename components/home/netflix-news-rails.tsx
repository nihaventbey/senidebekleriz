"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { PublicNewsArticle, NewsCategory } from "@/lib/data/news";

type Props = {
  groupedNews: Record<string, PublicNewsArticle[]>;
};

type CategoryConfig = {
  key: NewsCategory;
  title: string;
  emoji: string;
  badgeColor: string;
  accentBorder: string;
  description: string;
};

const ORDERED_CATEGORIES: CategoryConfig[] = [
  {
    key: "arkeoloji",
    title: "Arkeoloji & Kazı Gündemi",
    emoji: "🏛️",
    badgeColor: "bg-amber-600 text-white",
    accentBorder: "hover:border-amber-500/40",
    description: "Anadolu'nun kadim topraklarından son arkeolojik keşifler ve antik kent kazıları",
  },
  {
    key: "restorasyon",
    title: "Tarihi Miras & Restorasyon",
    emoji: "🏰",
    badgeColor: "bg-stone-700 text-white",
    accentBorder: "hover:border-stone-500/40",
    description: "Külliyeler, taş konaklar, kaleler ve tarihi eserlerin ihya ve koruma süreçleri",
  },
  {
    key: "sinema",
    title: "Sinema & Görsel Sanatlar",
    emoji: "🎬",
    badgeColor: "bg-rose-600 text-white",
    accentBorder: "hover:border-rose-500/40",
    description: "Festival ödülleri, vizyon tahlilleri, usta yönetmenler ve sinematek dünyası",
  },
  {
    key: "muze_sergi",
    title: "Müze, Sergi & Bienal",
    emoji: "🖼️",
    badgeColor: "bg-blue-600 text-white",
    accentBorder: "hover:border-blue-500/40",
    description: "Türkiye'nin seçkin galerileri, müze koleksiyonları ve güncel bienal programları",
  },
  {
    key: "kultur_sanat",
    title: "Kültür & Sanat Dünyası",
    emoji: "🎨",
    badgeColor: "bg-purple-600 text-white",
    accentBorder: "hover:border-purple-500/40",
    description: "Edebiyat, tiyatro, opera ve kültür politikalarından derinlikli haberler",
  },
  {
    key: "festival_haberleri",
    title: "Festival Gündemi",
    emoji: "🎪",
    badgeColor: "bg-emerald-600 text-white",
    accentBorder: "hover:border-emerald-500/40",
    description: "Kültür Yolu Festivalleri, şenlikler ve uluslararası sanat buluşmaları",
  },
];

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

function CategoryRail({
  config,
  items,
}: {
  config: CategoryConfig;
  items: PublicNewsArticle[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScrollability() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);
    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [items]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5 py-4">
      {/* Rail Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl" role="img" aria-label={config.title}>
              {config.emoji}
            </span>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              {config.title}
            </h3>
            <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {config.description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            href={`/haberler?kategori=${config.key}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mr-2"
          >
            <span>Tümünü Gör</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          {/* Desktop Arrow Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
              className="h-7 w-7 rounded-full shadow-xs disabled:opacity-30"
              aria-label="Önceki haberler"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
              className="h-7 w-7 rounded-full shadow-xs disabled:opacity-30"
              aria-label="Sonraki haberler"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track (Netflix-style snap rail) */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-proximity pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className={`group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-md ${config.accentBorder} w-[270px] sm:w-[310px] md:w-[330px] shrink-0 snap-start`}
            >
              {/* Media Container with 16:9 Aspect Ratio */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 via-muted to-muted flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-primary/40" />
                  </div>
                )}

                {/* City badge overlay if available */}
                {item.cityName && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white">
                    <MapPin className="h-2.5 w-2.5 text-primary" />
                    {item.cityName}
                  </span>
                )}

                {/* Stretched clickable overlay for accessibility */}
                <Link
                  href={`/haber/${item.slug}`}
                  className="card-link absolute inset-0 z-10"
                  aria-label={item.title}
                />
              </div>

              {/* Content Details */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <span className="font-semibold text-primary">
                      {config.title.split("&")[0].trim()}
                    </span>
                    <span>{formatDate(item.publishedAt)}</span>
                  </div>

                  <h4 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground group-hover/card:text-primary transition-colors leading-snug">
                    {item.title}
                  </h4>

                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-primary">
                  <span>Haberi Oku</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover/card:translate-x-0.5" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NetflixNewsRails({ groupedNews }: Props) {
  // Only render categories that actually have at least 1 item
  const activeCategories = ORDERED_CATEGORIES.filter(
    (c) => (groupedNews[c.key]?.length || 0) > 0
  );

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Section Master Eyebrow */}
      <div className="border-b border-border/50 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
            Kültür &amp; Sanat Vitrini
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Kategorilerine Göre Kültür Gündemi
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Arkeolojiden restorasyona, sinemadan müze sergilerine Türkiye&apos;nin en güncel kültür akışını yatay raylar üzerinde keşfedin.
        </p>
      </div>

      {/* Category Rows */}
      <div className="space-y-6 divide-y divide-border/30">
        {activeCategories.map((config) => (
          <CategoryRail
            key={config.key}
            config={config}
            items={groupedNews[config.key] || []}
          />
        ))}
      </div>
    </section>
  );
}
