"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CityPoint = {
  name: string;
  slug: string;
  x: number; // percentage
  y: number; // percentage
  region: string;
  highlight?: string;
};

const POPULAR_CITIES: CityPoint[] = [
  { name: "İstanbul", slug: "istanbul", x: 23, y: 22, region: "Marmara", highlight: "10 Tarihi Müze" },
  { name: "İzmir", slug: "izmir", x: 12, y: 55, region: "Ege", highlight: "Efes & Bergama" },
  { name: "Ankara", slug: "ankara", x: 42, y: 38, region: "İç Anadolu", highlight: "Anadolu Medeniyetleri" },
  { name: "Nevşehir", slug: "nevsehir", x: 50, y: 52, region: "İç Anadolu", highlight: "Kapadokya Yeraltı Şehri" },
  { name: "Şanlıurfa", slug: "sanliurfa", x: 74, y: 72, region: "Güneydoğu", highlight: "Göbeklitepe" },
  { name: "Trabzon", slug: "trabzon", x: 72, y: 20, region: "Karadeniz", highlight: "Sümela Manastırı" },
  { name: "Denizli", slug: "denizli", x: 22, y: 62, region: "Ege", highlight: "Pamukkale Travertenleri" },
  { name: "Antalya", slug: "antalya", x: 30, y: 78, region: "Akdeniz", highlight: "Aspendos Tiyatrosu" },
  { name: "Gaziantep", slug: "gaziantep", x: 68, y: 70, region: "Güneydoğu", highlight: "Zeugma Mozaikleri" },
  { name: "Kars", slug: "kars", x: 92, y: 26, region: "Doğu Anadolu", highlight: "Ani Harabeleri" },
  { name: "Adıyaman", slug: "adiyaman", x: 65, y: 62, region: "Güneydoğu", highlight: "Nemrut Dağı" },
  { name: "Çanakkale", slug: "canakkale", x: 10, y: 30, region: "Marmara", highlight: "Troya Antik Kenti" },
  { name: "Mardin", slug: "mardin", x: 80, y: 74, region: "Güneydoğu", highlight: "Tarihi Taş Evler" },
  { name: "Burdur", slug: "burdur", x: 27, y: 68, region: "Akdeniz", highlight: "Sagalassos" },
  { name: "Ağrı", slug: "agri", x: 92, y: 38, region: "Doğu Anadolu", highlight: "İshak Paşa Sarayı" },
  { name: "Sivas", slug: "sivas", x: 60, y: 40, region: "İç Anadolu", highlight: "Divriği Ulu Camii" },
  { name: "Sinop", slug: "sinop", x: 50, y: 12, region: "Karadeniz", highlight: "Tarihi Cezaevi" },
  { name: "Edirne", slug: "edirne", x: 10, y: 14, region: "Marmara", highlight: "Selimiye Camii" },
];

export function TurkeyInteractiveMap() {
  const [activeCity, setActiveCity] = useState<CityPoint>(POPULAR_CITIES[0]);

  return (
    <section className="py-16 bg-muted/20 border-y border-border/60 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 border-amber-500/30 text-amber-600 bg-amber-500/5">
            <Sparkles className="w-3.5 h-3.5" />
            İnteraktif Keşif Haritası
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Türkiye'nin Tarihi ve Kültürel Rotalarını Keşfedin
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Haritadaki şehirlere tıklayarak o şehrin öne çıkan antik kentlerini, müzelerini ve detaylı gezi rehberlerini inceleyin.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          {/* Map Area */}
          <div className="lg:col-span-8 relative aspect-[16/9] bg-gradient-to-br from-amber-500/5 via-background to-primary/5 rounded-2xl border border-border/80 shadow-sm p-4 overflow-hidden group">
            {/* Background Decorative Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Stylized Turkey Silhouette Overlay */}
            <svg
              className="w-full h-full opacity-20 text-muted-foreground"
              viewBox="0 0 1000 500"
              fill="currentColor"
            >
              <path d="M 50 150 Q 200 100 400 120 T 800 150 Q 950 200 950 300 T 700 450 Q 400 400 200 380 T 50 250 Z" />
            </svg>

            {/* City Pins */}
            {POPULAR_CITIES.map((city) => {
              const isSelected = activeCity.slug === city.slug;
              return (
                <button
                  key={city.slug}
                  onClick={() => setActiveCity(city)}
                  onMouseEnter={() => setActiveCity(city)}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group/pin transition-all duration-300 z-10 ${
                    isSelected ? "scale-125 z-20" : "hover:scale-110"
                  }`}
                  aria-label={`${city.name} Gezi Rehberi`}
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`absolute w-6 h-6 rounded-full animate-ping opacity-40 ${
                        isSelected ? "bg-amber-500" : "bg-primary"
                      }`}
                    />
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-white ring-4 ring-amber-500/20"
                          : "bg-background text-primary border border-border/80 hover:bg-primary hover:text-white"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  <span
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all ${
                      isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-background/90 text-foreground border border-border/60 backdrop-blur-sm"
                    }`}
                  >
                    {city.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active City Card */}
          <div className="lg:col-span-4 bg-background rounded-2xl border border-border/80 p-6 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {activeCity.region} Bölgesi
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Öne Çıkan</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground">{activeCity.name}</h3>
                <p className="text-sm font-medium text-amber-600 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {activeCity.highlight}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeCity.name} şehrindeki ören yerleri, tarihi yapılar, müzeler ve gezilecek en popüler rotaların detaylı gezi rehberi.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href={`/sehir/${activeCity.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
              >
                <span>{activeCity.name} Rehberini İncele</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
