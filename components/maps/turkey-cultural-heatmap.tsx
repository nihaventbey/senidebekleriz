"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Flame,
  Sparkles,
  ArrowRight,
  Music,
  Theater,
  Ticket,
  ExternalLink,
  Layers,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type HeatmapCity = {
  name: string;
  slug: string;
  x: number; // percentage on map
  y: number; // percentage on map
  region: string;
  eventCount: number;
  highlight: string;
  featuredEvent?: {
    title: string;
    type: string;
    date: string;
  };
};

const DEFAULT_HEATMAP_CITIES: HeatmapCity[] = [
  {
    name: "İstanbul",
    slug: "istanbul",
    x: 21,
    y: 22,
    region: "Marmara",
    eventCount: 24,
    highlight: "Harbiye Açık Hava, AKM & Kültür Yolu",
    featuredEvent: {
      title: "David Garrett: Millennium Symphony Tour",
      type: "konser",
      date: "29 Ağustos",
    },
  },
  {
    name: "Ankara",
    slug: "ankara",
    x: 43,
    y: 38,
    region: "İç Anadolu",
    eventCount: 16,
    highlight: "Devlet Tiyatroları, CSO Ada & Başkent Fest",
    featuredEvent: {
      title: "Gökhan Türkmen Konseri (Millet Bahçesi)",
      type: "konser",
      date: "Bu Ay",
    },
  },
  {
    name: "İzmir",
    slug: "izmir",
    x: 13,
    y: 56,
    region: "Ege",
    eventCount: 14,
    highlight: "Efes Antik Tiyatro & Kültürpark Açık Hava",
    featuredEvent: {
      title: "Efes Kültür & Tiyatro Günleri",
      type: "tiyatro",
      date: "Eylül 2026",
    },
  },
  {
    name: "Antalya",
    slug: "antalya",
    x: 31,
    y: 78,
    region: "Akdeniz",
    eventCount: 11,
    highlight: "Aspendos Uluslararası Opera & Bale Festivali",
    featuredEvent: {
      title: "Aspendos Opera ve Bale Günleri",
      type: "festival",
      date: "Eylül 2026",
    },
  },
  {
    name: "Nevşehir",
    slug: "nevsehir",
    x: 52,
    y: 54,
    region: "İç Anadolu",
    eventCount: 8,
    highlight: "Kapadokya Balon, Caz & Kültür Yolu",
    featuredEvent: {
      title: "Kapadokya Klasik Müzik ve Caz Festivali",
      type: "konser",
      date: "Ekim 2026",
    },
  },
  {
    name: "Şanlıurfa",
    slug: "sanliurfa",
    x: 75,
    y: 72,
    region: "Güneydoğu Anadolu",
    eventCount: 7,
    highlight: "Göbeklitepe & Karahantepe Kültür Buluşmaları",
    featuredEvent: {
      title: "Taş Tepeler Arkeoloji & Sanat Sempozyumu",
      type: "sergi",
      date: "Kasım 2026",
    },
  },
  {
    name: "Trabzon",
    slug: "trabzon",
    x: 73,
    y: 22,
    region: "Karadeniz",
    eventCount: 6,
    highlight: "Sümela Kültür Yolu & Karadeniz Tiyatro",
    featuredEvent: {
      title: "Sümela Kültür Yolu Festivali Konserleri",
      type: "festival",
      date: "Eylül 2026",
    },
  },
  {
    name: "Mardin",
    slug: "mardin",
    x: 81,
    y: 75,
    region: "Güneydoğu Anadolu",
    eventCount: 6,
    highlight: "Mardin Uluslararası Bienali & Taş Sahne",
    featuredEvent: {
      title: "Mardin Uluslararası Sanat Bienali",
      type: "sergi",
      date: "Ekim 2026",
    },
  },
  {
    name: "Çanakkale",
    slug: "canakkale",
    x: 10,
    y: 30,
    region: "Marmara",
    eventCount: 5,
    highlight: "Troya Kültür Yolu & Açık Hava Sahneleri",
    featuredEvent: {
      title: "Troya Festivali Tiyatro Gösterimleri",
      type: "tiyatro",
      date: "Eylül 2026",
    },
  },
  {
    name: "Bursa",
    slug: "bursa",
    x: 25,
    y: 32,
    region: "Marmara",
    eventCount: 6,
    highlight: "Bursa Uluslararası Festivali & Merinos AKKM",
    featuredEvent: {
      title: "Uluslararası Bursa Tiyatro Günleri",
      type: "tiyatro",
      date: "Ekim 2026",
    },
  },
  {
    name: "Eskişehir",
    slug: "eskisehir",
    x: 32,
    y: 36,
    region: "İç Anadolu",
    eventCount: 7,
    highlight: "Şehir Tiyatroları & Senfoni Orkestrası",
    featuredEvent: {
      title: "Büyükşehir Senfoni Açılış Konseri",
      type: "konser",
      date: "Ekim 2026",
    },
  },
  {
    name: "Gaziantep",
    slug: "gaziantep",
    x: 69,
    y: 71,
    region: "Güneydoğu Anadolu",
    eventCount: 5,
    highlight: "GastroAntep & Zeugma Mozaik Sanat Buluşmaları",
    featuredEvent: {
      title: "Zeugma Mozaik Müzesi Sergi & Dinleti",
      type: "sergi",
      date: "Eylül 2026",
    },
  },
  {
    name: "Adana",
    slug: "adana",
    x: 58,
    y: 75,
    region: "Akdeniz",
    eventCount: 6,
    highlight: "Altın Koza Film & Tiyatro Festivali",
    featuredEvent: {
      title: "Altın Koza Film Festivali Gala Gecesi",
      type: "festival",
      date: "Eylül 2026",
    },
  },
  {
    name: "Kars",
    slug: "kars",
    x: 92,
    y: 26,
    region: "Doğu Anadolu",
    eventCount: 4,
    highlight: "Ani Ören Yeri & Kültür Günleri",
    featuredEvent: {
      title: "Kafkas Kültür ve Aşıklar Şöleni",
      type: "festival",
      date: "Kasım 2026",
    },
  },
  {
    name: "Diyarbakır",
    slug: "diyarbakir",
    x: 77,
    y: 60,
    region: "Güneydoğu Anadolu",
    eventCount: 5,
    highlight: "Sur Kültür Yolu & Dengbêj Evi Dinletileri",
    featuredEvent: {
      title: "Sur Kültür Yolu Festivali",
      type: "festival",
      date: "Ekim 2026",
    },
  },
  {
    name: "Edirne",
    slug: "edirne",
    x: 9,
    y: 12,
    region: "Marmara",
    eventCount: 4,
    highlight: "Trakya Müzik & Kırkpınar Kültür Şenlikleri",
    featuredEvent: {
      title: "Trakya Klasik Müzik Festivali",
      type: "konser",
      date: "Ekim 2026",
    },
  },
];

export function TurkeyCulturalHeatmap() {
  const [activeCity, setActiveCity] = useState<HeatmapCity>(DEFAULT_HEATMAP_CITIES[0]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredCities = useMemo(() => {
    if (activeFilter === "all") return DEFAULT_HEATMAP_CITIES;
    return DEFAULT_HEATMAP_CITIES.filter((city) => {
      if (!city.featuredEvent) return false;
      return city.featuredEvent.type === activeFilter;
    });
  }, [activeFilter]);

  const maxEvents = Math.max(...DEFAULT_HEATMAP_CITIES.map((c) => c.eventCount));

  function getIntensityBadge(count: number) {
    if (count >= 15) {
      return {
        label: "Yüksek Yoğunluk",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        pulse: "bg-rose-500",
        ring: "ring-rose-500/50",
      };
    }
    if (count >= 8) {
      return {
        label: "Orta Yoğunluk",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        pulse: "bg-amber-500",
        ring: "ring-amber-500/50",
      };
    }
    return {
      label: "Canlı Sahne",
      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      pulse: "bg-indigo-500",
      ring: "ring-indigo-500/50",
    };
  }

  const currentIntensity = getIntensityBadge(activeCity.eventCount);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white py-10 sm:py-14 border-b border-slate-800 shadow-2xl">
      {/* Background Decorative Ambience */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3 shadow-inner">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>TÜRKİYE KÜLTÜR &amp; FESTİVAL ISI HARİTASI (HEATMAP)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Şehirlerin Canlı Kültür &amp; Sanat Nabzı
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Haritada parlayan şehirlere tıklayarak yaklaşan tiyatro, konser, sergi ve festivalleri anında keşfedin.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Tüm Etkinlikler" },
              { id: "konser", label: "🎵 Konser" },
              { id: "tiyatro", label: "🎭 Tiyatro" },
              { id: "festival", label: "🎪 Festival" },
              { id: "sergi", label: "🖼️ Sergi" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
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

        {/* Grid: Interactive SVG Heatmap + Spotlight Drawer Card */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* MAP CANVAS (8 COLS) */}
          <div className="lg:col-span-8 relative aspect-[16/9] min-h-[340px] sm:min-h-[420px] rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl p-4 overflow-hidden flex items-center justify-center">
            
            {/* Ambient High-Tech Grid & Latitude Lines */}
            <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

            {/* Geographical Turkey Map Vector Outline */}
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
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Realistic Geographical Silhouette of Anatolia & Thrace */}
              <path
                d="M 55 120 C 75 90, 110 80, 140 100 C 160 115, 185 130, 220 145 C 240 135, 270 125, 310 130 C 350 135, 410 135, 460 145 C 500 150, 540 130, 580 135 C 630 140, 690 145, 750 160 C 810 170, 880 180, 935 210 C 960 225, 965 260, 950 295 C 930 330, 910 360, 870 380 C 820 400, 770 415, 710 405 C 660 395, 610 405, 565 415 C 520 425, 470 410, 420 395 C 370 380, 330 400, 280 415 C 230 430, 180 410, 140 380 C 110 355, 90 315, 80 275 C 70 230, 40 160, 55 120 Z"
                fill="url(#mapGlow)"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Black Sea Coastline Detail */}
              <path
                d="M 140 100 Q 280 140 460 145 T 750 160 T 935 210"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Mediterranean Coastline Detail */}
              <path
                d="M 140 380 Q 300 420 565 415 T 870 380"
                fill="none"
                stroke="#fb7185"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Aegean Archipelago Coastline */}
              <path
                d="M 140 100 Q 80 240 140 380"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>

            {/* Glowing City Heat Nodes */}
            {filteredCities.map((city) => {
              const isSelected = activeCity.slug === city.slug;
              const intensity = getIntensityBadge(city.eventCount);

              return (
                <div
                  key={city.slug}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/node"
                >
                  {/* Heat Aura Halo (Proportional to eventCount) */}
                  <span
                    className={`absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none ${intensity.pulse}`}
                    style={{
                      width: `${Math.max(22, (city.eventCount / maxEvents) * 44)}px`,
                      height: `${Math.max(22, (city.eventCount / maxEvents) * 44)}px`,
                      margin: "auto",
                      left: "-50%",
                      top: "-50%",
                    }}
                  />

                  {/* Interactive City Button */}
                  <button
                    type="button"
                    onClick={() => setActiveCity(city)}
                    className={`relative flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-extrabold scale-110 ring-4 ring-amber-400/40 z-30"
                        : "bg-slate-900/90 border border-slate-700 text-slate-200 hover:border-amber-400 hover:bg-slate-800 hover:scale-105"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isSelected ? "bg-slate-950" : intensity.pulse
                      }`}
                    />
                    <span className="text-[11px] sm:text-xs tracking-tight">{city.name}</span>
                    <span className="text-[9px] opacity-75 ml-0.5">({city.eventCount})</span>
                  </button>
                </div>
              );
            })}

            {/* Bottom Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Yüksek (15+)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Orta (8+)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Canlı (1+)
              </span>
            </div>
          </div>

          {/* SPOTLIGHT DETAIL CARD (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Top Glowing Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

            <div className="space-y-4">
              {/* Region & Intensity Badges */}
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                  {activeCity.region}
                </Badge>
                <Badge className={`text-xs border ${currentIntensity.color}`}>
                  <Flame className="h-3 w-3 mr-1" />
                  {currentIntensity.label}
                </Badge>
              </div>

              {/* City Title */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {activeCity.name}
                  </h3>
                  <span className="text-sm font-bold text-amber-400">
                    {activeCity.eventCount} Etkinlik
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeCity.highlight}
                </p>
              </div>

              {/* Spotlight Event Box */}
              {activeCity.featuredEvent && (
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Öne Çıkan Etkinlik
                    </span>
                    <span className="text-slate-400">{activeCity.featuredEvent.date}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {activeCity.featuredEvent.title}
                  </h4>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px] capitalize">
                      {activeCity.featuredEvent.type === "konser" && <Music className="h-2.5 w-2.5 mr-1 text-purple-400" />}
                      {activeCity.featuredEvent.type === "tiyatro" && <Theater className="h-2.5 w-2.5 mr-1 text-emerald-400" />}
                      {activeCity.featuredEvent.type}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-6">
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg">
                <Link href={`/etkinlikler?sehir=${activeCity.slug}`}>
                  <span>{activeCity.name} Etkinliklerini Gör ({activeCity.eventCount})</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs">
                <Link href={`/sehir/${activeCity.slug}`}>
                  <Compass className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                  <span>{activeCity.name} Kültür &amp; Gezi Rehberi</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
