"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Music,
  Theater,
  Compass,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicEvent } from "@/lib/data/events";
import { turkeyCities } from "@/data/turkey-cities";

export type MapCityPosition = {
  name: string;
  slug: string;
  x: number;
  y: number;
  region: string;
  highlight: string;
};

function getCityCoords(lat: number, lng: number): { x: number; y: number } {
  // Turkey longitude range: ~25.8° to ~44.8°
  // Turkey latitude range: ~35.8° to ~42.3°
  const x = Math.max(6, Math.min(94, ((lng - 25.8) / (44.8 - 25.8)) * 84 + 8));
  const y = Math.max(10, Math.min(90, ((42.3 - lat) / (42.3 - 35.8)) * 74 + 13));
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

const ALL_81_CITY_POSITIONS = new Map<string, MapCityPosition>(
  turkeyCities.map((c) => {
    const coords = getCityCoords(c.lat, c.lng);
    return [
      c.slug,
      {
        name: c.name,
        slug: c.slug,
        x: coords.x,
        y: coords.y,
        region: c.region,
        highlight: c.description?.slice(0, 80) || "Kültür ve sanat etkinlikleri",
      },
    ];
  })
);

export type ComputedMapCity = MapCityPosition & {
  eventCount: number;
  featuredEvent?: {
    title: string;
    slug: string;
    type: string;
    date: string;
  };
};

type Props = {
  events?: PublicEvent[];
  selectedType?: string;
  selectedCity?: string;
  onSelectFilter?: (citySlug: string, eventType: string) => void;
};

export function TurkeyCulturalHeatmap({
  events = [],
  selectedType = "all",
  selectedCity = "all",
  onSelectFilter,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<string>(selectedType || "all");

  useEffect(() => {
    setActiveFilter(selectedType || "all");
  }, [selectedType]);

  // Compute real event counts per city for the currently active type filter
  const citiesWithEvents = useMemo<ComputedMapCity[]>(() => {
    const typeFiltered =
      activeFilter === "all"
        ? events
        : events.filter((e) => e.eventType === activeFilter);

    const countMap: Record<string, number> = {};
    const firstEventMap: Record<string, PublicEvent> = {};
    const cityNameMap: Record<string, string> = {};

    for (const e of typeFiltered) {
      if (!e.citySlug) continue;
      countMap[e.citySlug] = (countMap[e.citySlug] || 0) + 1;
      if (!firstEventMap[e.citySlug]) {
        firstEventMap[e.citySlug] = e;
      }
      if (e.cityName) {
        cityNameMap[e.citySlug] = e.cityName;
      }
    }

    const result: ComputedMapCity[] = [];

    for (const [slug, count] of Object.entries(countMap)) {
      if (count <= 0) continue;
      const base = ALL_81_CITY_POSITIONS.get(slug) || {
        name: cityNameMap[slug] || slug,
        slug,
        x: 50,
        y: 50,
        region: "Türkiye",
        highlight: "Güncel kültür ve sanat etkinlikleri",
      };
      const firstEv = firstEventMap[slug];
      result.push({
        ...base,
        eventCount: count,
        featuredEvent: firstEv
          ? {
              title: firstEv.title,
              slug: firstEv.slug,
              type: firstEv.eventType,
              date: firstEv.startsAt
                ? new Date(firstEv.startsAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })
                : "Yakında",
            }
          : undefined,
      });
    }

    return result.sort((a, b) => b.eventCount - a.eventCount);
  }, [events, activeFilter]);

  const [activeCitySlug, setActiveCitySlug] = useState<string>(() => {
    if (selectedCity && selectedCity !== "all") return selectedCity;
    return citiesWithEvents[0]?.slug || "istanbul";
  });

  useEffect(() => {
    if (selectedCity && selectedCity !== "all") {
      setActiveCitySlug(selectedCity);
    } else if (
      citiesWithEvents.length > 0 &&
      !citiesWithEvents.some((c) => c.slug === activeCitySlug)
    ) {
      setActiveCitySlug(citiesWithEvents[0].slug);
    }
  }, [selectedCity, citiesWithEvents, activeCitySlug]);

  const activeCity: ComputedMapCity | undefined =
    citiesWithEvents.find((c) => c.slug === activeCitySlug) || citiesWithEvents[0];

  const maxEvents = Math.max(...citiesWithEvents.map((c) => c.eventCount), 1);

  function handleFilterButtonClick(filterId: string) {
    setActiveFilter(filterId);
    if (onSelectFilter) {
      onSelectFilter(selectedCity || "all", filterId);
    }
  }

  function handleShowCityEvents(citySlug: string) {
    if (onSelectFilter) {
      onSelectFilter(citySlug, activeFilter);
    }
    const listEl = document.getElementById("etkinlik-listesi");
    if (listEl) {
      listEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white py-8 sm:py-10 border-b border-slate-800">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with Title & Quick Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Türkiye Kültür Isı Haritası</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Canlı Ajanda
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              81 ilin aktif konser, tiyatro, sergi ve festival yoğunluğunu interaktif olarak keşfedin.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "Tümü" },
              { id: "konser", label: "🎵 Konser" },
              { id: "tiyatro", label: "🎭 Tiyatro" },
              { id: "sergi", label: "🖼️ Sergi" },
              { id: "festival", label: "🎪 Festival" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFilterButtonClick(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile City Horizontal Chips (for 320px - 768px screens to prevent pin collision) */}
        {citiesWithEvents.length > 0 && (
          <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto flex items-center gap-2 pb-2 scrollbar-none">
            {citiesWithEvents.map((city) => {
              const isSelected = activeCity?.slug === city.slug;
              return (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setActiveCitySlug(city.slug)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : "bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{city.name}</span>
                  <span className="text-[10px] opacity-75">({city.eventCount})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grid: Interactive Map + Selected City Card */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* MAP CANVAS (8 COLS) */}
          <div className="lg:col-span-8 relative aspect-[16/9] min-h-[300px] sm:min-h-[380px] rounded-2xl bg-slate-900/90 border border-slate-800 p-4 overflow-hidden flex items-center justify-center">
            {/* Visual Base Grid */}
            <svg
              className="w-full h-full text-slate-700 select-none pointer-events-none"
              viewBox="0 0 1000 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="mapGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#1e293b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Geographic contour silhouette of Anatolia & Thrace */}
              <path
                d="M 60 110 C 85 85, 120 75, 150 95 C 170 110, 195 125, 230 140 C 250 130, 280 120, 320 125 C 360 130, 420 130, 470 140 C 510 145, 550 125, 590 130 C 640 135, 700 140, 760 155 C 820 165, 890 175, 940 205 C 965 220, 970 255, 955 290 C 935 325, 915 355, 875 375 C 825 395, 775 410, 715 400 C 665 390, 615 400, 570 410 C 525 420, 475 405, 425 390 C 375 375, 335 395, 285 410 C 235 425, 185 405, 145 375 C 115 350, 95 310, 85 270 C 75 225, 45 155, 60 110 Z"
                fill="url(#mapGlow)"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>

            {/* True Geographic Coordinated Event Pins (All 81 Cities Supported) */}
            {citiesWithEvents.map((city) => {
              const isSelected = activeCity?.slug === city.slug;
              const intensityRatio = city.eventCount / maxEvents;
              const pinSize = Math.max(22, intensityRatio * 42);

              return (
                <div
                  key={city.slug}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  {/* Heatmap Pulsing Aura */}
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-45 pointer-events-none bg-amber-500"
                    style={{
                      width: `${pinSize}px`,
                      height: `${pinSize}px`,
                      margin: "auto",
                      left: "-50%",
                      top: "-50%",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setActiveCitySlug(city.slug)}
                    className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md transition-all shadow-md ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-extrabold scale-110 ring-4 ring-amber-400/40 z-30"
                        : "bg-slate-900/90 border border-slate-700 text-slate-200 hover:border-amber-400 hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isSelected ? "bg-slate-950" : "bg-amber-400"
                      }`}
                    />
                    <span className="text-[11px] sm:text-xs font-medium">{city.name}</span>
                    <span className="text-[10px] opacity-80">({city.eventCount})</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* CITY DETAIL CARD (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
            {activeCity ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                      {activeCity.region} Bölgesi
                    </Badge>
                    <span className="text-xs font-bold text-amber-400">
                      {activeCity.eventCount} Aktif Etkinlik
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">
                      {activeCity.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {activeCity.highlight}
                    </p>
                  </div>

                  {activeCity.featuredEvent && (
                    <Link
                      href={`/etkinlik/${activeCity.featuredEvent.slug}`}
                      className="block rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Öne Çıkan Etkinlik
                        </span>
                        <span className="text-slate-400">{activeCity.featuredEvent.date}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {activeCity.featuredEvent.title}
                      </h3>

                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px] capitalize">
                          {activeCity.featuredEvent.type === "konser" && <Music className="h-2.5 w-2.5 mr-1 text-purple-400" />}
                          {activeCity.featuredEvent.type === "tiyatro" && <Theater className="h-2.5 w-2.5 mr-1 text-emerald-400" />}
                          {activeCity.featuredEvent.type}
                        </Badge>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="space-y-2 pt-5">
                  <Button
                    type="button"
                    onClick={() => handleShowCityEvents(activeCity.slug)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    <span>
                      {activeCity.name} Etkinliklerini Listele ({activeCity.eventCount})
                    </span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                  >
                    <Link href={`/sehir/${activeCity.slug}`}>
                      <Compass className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                      <span>{activeCity.name} İl Sayfasına Git</span>
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 text-slate-400 text-sm">
                Seçilen kategoride aktif etkinlik bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
