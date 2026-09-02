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
    x: 22,
    y: 20,
    region: "Marmara",
    eventCount: 18,
    highlight: "Harbiye Açık Hava & Kültür Yolu Festivali",
    featuredEvent: {
      title: "David Garrett: Millennium Symphony Tour",
      type: "konser",
      date: "29 Ağustos",
    },
  },
  {
    name: "Ankara",
    slug: "ankara",
    x: 42,
    y: 38,
    region: "İç Anadolu",
    eventCount: 12,
    highlight: "Devlet Tiyatroları & CSO Konserleri",
    featuredEvent: {
      title: "Gökhan Türkmen Konseri (Millet Bahçesi)",
      type: "konser",
      date: "Bu Ay",
    },
  },
  {
    name: "İzmir",
    slug: "izmir",
    x: 12,
    y: 54,
    region: "Ege",
    eventCount: 9,
    highlight: "Efes Antik Tiyatro Etkinlikleri & Agora",
    featuredEvent: {
      title: "Efes Kültür & Tiyatro Günleri",
      type: "tiyatro",
      date: "Eylül 2026",
    },
  },
  {
    name: "Antalya",
    slug: "antalya",
    x: 30,
    y: 78,
    region: "Akdeniz",
    eventCount: 8,
    highlight: "Aspendos Uluslararası Opera ve Bale Festivali",
    featuredEvent: {
      title: "Aspendos Opera ve Bale Günleri",
      type: "festival",
      date: "Eylül 2026",
    },
  },
  {
    name: "Nevşehir",
    slug: "nevsehir",
    x: 50,
    y: 52,
    region: "İç Anadolu",
    eventCount: 6,
    highlight: "Kapadokya Balon & Caz Festivali",
    featuredEvent: {
      title: "Kapadokya Peribacaları Müzik Gecesi",
      type: "konser",
      date: "Güz Sezonu",
    },
  },
  {
    name: "Şanlıurfa",
    slug: "sanliurfa",
    x: 74,
    y: 72,
    region: "Güneydoğu",
    eventCount: 5,
    highlight: "Göbeklitepe & Karahantepe Kültür Buluşması",
    featuredEvent: {
      title: "Taş Tepeler Arkeoloji Sempozyumu",
      type: "sergi",
      date: "Ekim 2026",
    },
  },
  {
    name: "Trabzon",
    slug: "trabzon",
    x: 72,
    y: 20,
    region: "Karadeniz",
    eventCount: 4,
    highlight: "Sümela Kültür Yolu Etkinlikleri",
    featuredEvent: {
      title: "Sümela Sanat & Fotoğraf Sergisi",
      type: "sergi",
      date: "Bu Ay",
    },
  },
  {
    name: "Bursa",
    slug: "bursa",
    x: 23,
    y: 32,
    region: "Marmara",
    eventCount: 5,
    highlight: "Uluslararası Bursa Festivali & Tiyatro",
    featuredEvent: {
      title: "Bursa Kültür & Sanat Buluşması",
      type: "festival",
      date: "Sonbahar",
    },
  },
  {
    name: "Çanakkale",
    slug: "canakkale",
    x: 10,
    y: 30,
    region: "Marmara",
    eventCount: 4,
    highlight: "Troya Kültür Yolu & Agora Bestecilik Kampı",
    featuredEvent: {
      title: "2. Agora Bestecilik Kampı Dinletisi",
      type: "konser",
      date: "Final Dinletisi",
    },
  },
  {
    name: "Adıyaman",
    slug: "adiyaman",
    x: 65,
    y: 62,
    region: "Güneydoğu",
    eventCount: 3,
    highlight: "Nemrut Kommagene Müzik Festivali",
    featuredEvent: {
      title: "Nemrut Gün Doğumu Akustik Konserleri",
      type: "konser",
      date: "Güz Sezonu",
    },
  },
  {
    name: "Mardin",
    slug: "mardin",
    x: 80,
    y: 74,
    region: "Güneydoğu",
    eventCount: 4,
    highlight: "Mardin Uluslararası Bienali & Taş Evler Sergisi",
    featuredEvent: {
      title: "Deyrulzafaran Tasavvuf Dinletisi",
      type: "konser",
      date: "Eylül 2026",
    },
  },
  {
    name: "Edirne",
    slug: "edirne",
    x: 10,
    y: 14,
    region: "Marmara",
    eventCount: 3,
    highlight: "Trakya Müzik & Gastronomi Festivali",
    featuredEvent: {
      title: "Meriç Kıyısı Klasik Müzik Dinletisi",
      type: "konser",
      date: "Hafta Sonu",
    },
  },
  {
    name: "Gaziantep",
    slug: "gaziantep",
    x: 68,
    y: 70,
    region: "Güneydoğu",
    eventCount: 6,
    highlight: "GastroAntep & Zeugma Mozaik Günleri",
    featuredEvent: {
      title: "Zeugma Arkeoloji ve Mozaik Atölyesi",
      type: "sergi",
      date: "Bu Ay",
    },
  },
  {
    name: "Kars",
    slug: "kars",
    x: 92,
    y: 26,
    region: "Doğu Anadolu",
    eventCount: 2,
    highlight: "Ani Harabeleri Kültür Yürüyüşü",
    featuredEvent: {
      title: "Kafkas Kültür & Aşıklar Şöleni",
      type: "festival",
      date: "Ekim 2026",
    },
  },
  {
    name: "Denizli",
    slug: "denizli",
    x: 22,
    y: 62,
    region: "Ege",
    eventCount: 3,
    highlight: "Hierapolis Antik Tiyatro Etkinlikleri",
    featuredEvent: {
      title: "Pamukkale Işık ve Ses Gösterisi",
      type: "tiyatro",
      date: "Haftalık",
    },
  },
];

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function TurkeyCulturalHeatmap({
  title = "Türkiye Kültür & Festival Isı Haritası",
  subtitle = "81 ildeki tiyatro, konser, sergi ve festival yoğunluğunu interaktif keşfedin.",
  className = "",
}: Props) {
  const [activeCity, setActiveCity] = useState<HeatmapCity>(DEFAULT_HEATMAP_CITIES[0]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredCities = useMemo(() => {
    if (selectedFilter === "all") return DEFAULT_HEATMAP_CITIES;
    return DEFAULT_HEATMAP_CITIES.filter(
      (c) => c.featuredEvent?.type === selectedFilter || c.eventCount > 4
    );
  }, [selectedFilter]);

  return (
    <section className={`py-12 bg-gradient-to-b from-card/80 via-background to-card/60 border-y border-border/60 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              <span>Canlı Kültür &amp; Sanat Yoğunluğu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
            {[
              { id: "all", label: "Tüm Etkinlikler", icon: Layers },
              { id: "konser", label: "Konser", icon: Music },
              { id: "tiyatro", label: "Tiyatro", icon: Theater },
              { id: "festival", label: "Festival", icon: Ticket },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Heatmap & Active Detail Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          {/* Map Canvas */}
          <div className="lg:col-span-8 relative aspect-[16/9] min-h-[300px] sm:min-h-[400px] bg-card/60 backdrop-blur-xs rounded-3xl border border-border/80 shadow-md p-4 overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Stylized Turkey Silhouette */}
            <svg
              className="w-full h-full opacity-15 text-primary pointer-events-none"
              viewBox="0 0 1000 500"
              fill="currentColor"
            >
              <path d="M 40 160 Q 200 90 420 110 T 820 140 Q 960 190 960 310 T 700 460 Q 420 420 200 390 T 40 260 Z" />
            </svg>

            {/* Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md border text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Kültür Yoğunluğu:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
                <span>Yüksek (10+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
                <span>Orta (5-9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                <span>Canlı (1-4)</span>
              </div>
            </div>

            {/* Heatmap City Pins */}
            {filteredCities.map((city) => {
              const isSelected = activeCity.slug === city.slug;
              const isHot = city.eventCount >= 10;
              const isMedium = city.eventCount >= 5 && city.eventCount < 10;

              const pinColor = isHot
                ? "bg-rose-500 text-white ring-rose-300 dark:ring-rose-900"
                : isMedium
                ? "bg-amber-500 text-white ring-amber-300 dark:ring-amber-900"
                : "bg-blue-600 text-white ring-blue-300 dark:ring-blue-900";

              return (
                <button
                  key={city.slug}
                  onClick={() => setActiveCity(city)}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform hover:scale-125 z-20"
                  title={`${city.name}: ${city.eventCount} Etkinlik`}
                >
                  {/* Heatmap Pulsing Aura */}
                  {(isHot || isSelected) && (
                    <span
                      className={`absolute -inset-2 rounded-full animate-ping opacity-60 ${
                        isHot ? "bg-rose-500" : "bg-primary"
                      }`}
                    />
                  )}

                  <div
                    className={`relative flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all shadow-md ring-2 ${
                      isSelected
                        ? "bg-foreground text-background ring-primary scale-110 shadow-lg"
                        : pinColor
                    }`}
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] whitespace-nowrap hidden sm:inline">{city.name}</span>
                    <span className="text-[10px] opacity-90 px-1 py-0.2 rounded-full bg-black/20">
                      {city.eventCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active City Card Widget */}
          <div className="lg:col-span-4 rounded-3xl border border-border bg-card p-6 shadow-md space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {activeCity.region} Bölgesi
                </span>
                <h3 className="text-2xl font-extrabold text-foreground mt-0.5">
                  {activeCity.name}
                </h3>
              </div>
              <Badge variant="secondary" className="gap-1 font-bold text-xs py-1 px-2.5">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                {activeCity.eventCount} Canlı Etkinlik
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeCity.highlight}
            </p>

            {/* Featured Event Box */}
            {activeCity.featuredEvent && (
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Öne Çıkan Etkinlik</span>
                  <span className="text-[11px] text-muted-foreground">
                    📅 {activeCity.featuredEvent.date}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-2">
                  {activeCity.featuredEvent.title}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {activeCity.featuredEvent.type}
                  </Badge>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Biletler Satışta / Ücretsiz
                  </span>
                </div>
              </div>
            )}

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button asChild size="sm" className="w-full text-xs font-bold gap-1 shadow-xs">
                <Link href={`/etkinlikler?sehir=${activeCity.slug}`}>
                  <span>Etkinlikleri Gör</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold gap-1">
                <Link href={`/sehir/${activeCity.slug}`}>
                  <span>Şehir Rehberi</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
