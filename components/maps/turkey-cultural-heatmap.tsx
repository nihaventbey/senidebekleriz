"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Music,
  Theater,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicEvent } from "@/lib/data/events";

export type MapCityPosition = {
  name: string;
  slug: string;
  x: number;
  y: number;
  region: string;
  highlight: string;
};

const CITY_MAP_POSITIONS: MapCityPosition[] = [
  { name: "İstanbul", slug: "istanbul", x: 21, y: 22, region: "Marmara", highlight: "Harbiye Açık Hava, AKM ve sahne etkinlikleri" },
  { name: "Ankara", slug: "ankara", x: 43, y: 38, region: "İç Anadolu", highlight: "CSO Ada Ankara, Devlet Tiyatroları ve sergiler" },
  { name: "İzmir", slug: "izmir", x: 13, y: 56, region: "Ege", highlight: "Kültürpark Açık Hava, Efes ve sahne sanatları" },
  { name: "Antalya", slug: "antalya", x: 31, y: 78, region: "Akdeniz", highlight: "Aspendos, Haşim İşcan Kültür Merkezi ve festivaller" },
  { name: "Bursa", slug: "bursa", x: 25, y: 32, region: "Marmara", highlight: "Merinos AKKM, Tayyare Kültür Merkezi ve konserler" },
  { name: "Eskişehir", slug: "eskisehir", x: 32, y: 36, region: "İç Anadolu", highlight: "Şehir Tiyatroları ve Senfoni Orkestrası" },
  { name: "Sakarya", slug: "sakarya", x: 29, y: 25, region: "Marmara", highlight: "Kültür Yolu Festivali ve sahne etkinlikleri" },
  { name: "Çanakkale", slug: "canakkale", x: 10, y: 30, region: "Marmara", highlight: "Troya Kültür Yolu ve açık hava etkinlikleri" },
  { name: "Edirne", slug: "edirne", x: 9, y: 12, region: "Marmara", highlight: "Trakya klasik müzik ve kültür buluşmaları" },
  { name: "Nevşehir", slug: "nevsehir", x: 52, y: 54, region: "İç Anadolu", highlight: "Kapadokya konser ve kültür etkinlikleri" },
  { name: "Konya", slug: "konya", x: 42, y: 60, region: "İç Anadolu", highlight: "Selçuklu Kongre Merkezi ve kültür etkinlikleri" },
  { name: "Adana", slug: "adana", x: 58, y: 75, region: "Akdeniz", highlight: "Altın Koza, tiyatro ve konser takvimi" },
  { name: "Mersin", slug: "mersin", x: 51, y: 79, region: "Akdeniz", highlight: "Opera, bale ve kültür merkezi etkinlikleri" },
  { name: "Gaziantep", slug: "gaziantep", x: 69, y: 71, region: "Güneydoğu Anadolu", highlight: "Zeugma Mozaik Müzesi ve kültür buluşmaları" },
  { name: "Şanlıurfa", slug: "sanliurfa", x: 75, y: 72, region: "Güneydoğu Anadolu", highlight: "Taş Tepeler ve kültür etkinlikleri" },
  { name: "Diyarbakır", slug: "diyarbakir", x: 77, y: 60, region: "Güneydoğu Anadolu", highlight: "Sur Kültür Yolu ve sahne gösterileri" },
  { name: "Mardin", slug: "mardin", x: 81, y: 75, region: "Güneydoğu Anadolu", highlight: "Mardin Bienali ve tarihi mekan dinletileri" },
  { name: "Trabzon", slug: "trabzon", x: 73, y: 22, region: "Karadeniz", highlight: "Karadeniz tiyatro ve kültür etkinlikleri" },
  { name: "Samsun", slug: "samsun", x: 58, y: 18, region: "Karadeniz", highlight: "Devlet Opera ve Balesi ile konserler" },
  { name: "Erzurum", slug: "erzurum", x: 83, y: 34, region: "Doğu Anadolu", highlight: "Devlet Tiyatrosu ve kültür günleri" },
  { name: "Kars", slug: "kars", x: 92, y: 26, region: "Doğu Anadolu", highlight: "Ani Ören Yeri ve kültür etkinlikleri" },
];

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

    const knownBySlug = new Map(CITY_MAP_POSITIONS.map((c) => [c.slug, c]));
    const result: ComputedMapCity[] = [];

    for (const [slug, count] of Object.entries(countMap)) {
      if (count <= 0) continue;
      const base = knownBySlug.get(slug) || {
        name: cityNameMap[slug] || slug,
        slug,
        x: 48,
        y: 45,
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
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Türkiye Etkinlik Haritası
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Haritadan şehir veya kategori seçerek güncel etkinlikleri filtreleyin.
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

        {/* Grid: Interactive Map + Selected City Card */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* MAP CANVAS (8 COLS) */}
          <div className="lg:col-span-8 relative aspect-[16/9] min-h-[280px] sm:min-h-[360px] rounded-2xl bg-slate-900/90 border border-slate-800 p-4 overflow-hidden flex items-center justify-center">
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

              <path
                d="M 55 120 C 75 90, 110 80, 140 100 C 160 115, 185 130, 220 145 C 240 135, 270 125, 310 130 C 350 135, 410 135, 460 145 C 500 150, 540 130, 580 135 C 630 140, 690 145, 750 160 C 810 170, 880 180, 935 210 C 960 225, 965 260, 950 295 C 930 330, 910 360, 870 380 C 820 400, 770 415, 710 405 C 660 395, 610 405, 565 415 C 520 425, 470 410, 420 395 C 370 380, 330 400, 280 415 C 230 430, 180 410, 140 380 C 110 355, 90 315, 80 275 C 70 230, 40 160, 55 120 Z"
                fill="url(#mapGlow)"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>

            {citiesWithEvents.map((city) => {
              const isSelected = activeCity?.slug === city.slug;
              return (
                <div
                  key={city.slug}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-40 pointer-events-none bg-amber-500"
                    style={{
                      width: `${Math.max(20, (city.eventCount / maxEvents) * 38)}px`,
                      height: `${Math.max(20, (city.eventCount / maxEvents) * 38)}px`,
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
                    <span className="text-[11px] sm:text-xs">{city.name}</span>
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
                      {activeCity.region}
                    </Badge>
                    <span className="text-xs font-bold text-amber-400">
                      {activeCity.eventCount} Aktif Etkinlik
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">
                      {activeCity.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
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
                          Öne Çıkan
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
