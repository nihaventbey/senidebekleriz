"use client";

import {
  BookOpen,
  Film,
  Music,
  History,
  Users,
  MapPin,
  Map,
  Compass,
  FileText,
  Calendar,
  Newspaper,
} from "lucide-react";

type CityQuickNavProps = {
  hasPlaces?: boolean;
  hasGuide?: boolean;
  hasCulture?: boolean;
  hasEvents?: boolean;
  hasNews?: boolean;
};

export function CityQuickNav({
  hasPlaces,
  hasGuide,
  hasCulture,
  hasEvents,
  hasNews,
}: CityQuickNavProps) {
  const items = [
    { id: "genel-bakis", label: "Genel Bakış", icon: Compass },
    ...(hasEvents ? [{ id: "etkinlikler", label: "Etkinlikler", icon: Calendar }] : []),
    ...(hasNews ? [{ id: "haberler", label: "Haberler", icon: Newspaper }] : []),
    ...(hasGuide ? [{ id: "rehber", label: "Gezi Rehberi", icon: FileText }] : []),
    ...(hasPlaces ? [{ id: "mekanlar", label: "Öne Çıkan Duraklar", icon: MapPin }] : []),
    ...(hasPlaces ? [{ id: "harita", label: "Harita", icon: Map }] : []),
    ...(hasCulture
      ? [
          { id: "edebiyat", label: "Edebiyat", icon: BookOpen },
          { id: "sinema", label: "Sinema", icon: Film },
          { id: "muzik", label: "Müzik", icon: Music },
          { id: "tarih", label: "Tarih", icon: History },
          { id: "sanatcilar", label: "Sanatçılar", icon: Users },
        ]
      : []),
  ];

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-14 z-30 -mt-6 mb-8 border-y border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
      <div className="container mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Hızlı Keşif:
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleScroll(item.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary shadow-xs"
              >
                <Icon className="h-3.5 w-3.5 text-primary/80" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
