"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, ArrowRight, Sparkles, Filter } from "lucide-react";
import type { PublicEvent } from "@/lib/data/events";

const TYPE_FILTERS = [
  { key: "all", label: "Tümü", emoji: "✨" },
  { key: "tiyatro", label: "Tiyatro", emoji: "🎭" },
  { key: "sergi", label: "Sergi", emoji: "🎨" },
  { key: "konser", label: "Konser", emoji: "🎵" },
  { key: "festival", label: "Festival", emoji: "🎪" },
] as const;

const POPULAR_CITIES = [
  { slug: "all", label: "Tüm Şehirler" },
  { slug: "istanbul", label: "İstanbul" },
  { slug: "ankara", label: "Ankara" },
  { slug: "izmir", label: "İzmir" },
  { slug: "antalya", label: "Antalya" },
  { slug: "bursa", label: "Bursa" },
] as const;

function formatDate(iso: string | null) {
  if (!iso) return "Güncel Etkinlik";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

const TYPE_COLORS: Record<string, string> = {
  tiyatro: "bg-purple-600/90 text-white",
  konser: "bg-emerald-600/90 text-white",
  sergi: "bg-blue-600/90 text-white",
  festival: "bg-amber-600/90 text-white",
  duyuru: "bg-indigo-600/90 text-white",
};

export function HomeAgendaSection({ events }: { events: PublicEvent[] }) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchType = selectedType === "all" || e.eventType === selectedType;
      const matchCity = selectedCity === "all" || e.citySlug === selectedCity;
      return matchType && matchCity;
    });
  }, [events, selectedType, selectedCity]);

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Header with Title and "Tümünü Gör" Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Calendar className="h-4 w-4" />
            <span>Şehir Ajandası</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Bu Hafta Ne Var?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tiyatro sahnelerinden müze galerilerine, konserlerden açık hava festivallerine.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="shrink-0 font-semibold">
          <Link href="/etkinlikler">
            <span>Tüm Etkinlik Takvimi</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Interactive Filters: Genre & City Chips */}
      <div className="flex flex-col gap-3 mb-8 p-3 rounded-2xl bg-muted/30 border border-border/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
            Tür:
          </span>
          {TYPE_FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={selectedType === f.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedType(f.key)}
              className="h-8 rounded-full text-xs font-semibold px-3"
            >
              <span className="mr-1">{f.emoji}</span>
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/30 pt-2.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
            Şehir:
          </span>
          {POPULAR_CITIES.map((c) => (
            <Button
              key={c.slug}
              variant={selectedCity === c.slug ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCity(c.slug)}
              className="h-7 rounded-full text-xs px-2.5"
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Card Grid */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-14 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto text-primary opacity-40 mb-2" />
          <p className="text-sm font-medium">Bu filtreye uygun güncel etkinlik bulunamadı.</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedType("all");
              setSelectedCity("all");
            }}
            className="mt-2 text-xs"
          >
            Filtreleri Temizle
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.slice(0, 8).map((event) => (
            <article
              key={event.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40"
            >
              {/* Media Region with aspect ratio and object fit cover */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/15 to-muted flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary/40" />
                  </div>
                )}

                {/* Genre Badge overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <Badge
                    className={`${
                      TYPE_COLORS[event.eventType] || "bg-primary text-white"
                    } border-0 text-[11px] font-bold shadow-xs`}
                  >
                    {event.eventType.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Primary Link Overlay for accessible card click */}
              <Link
                href={`/etkinlik/${event.slug}`}
                className="card-link absolute inset-0 z-10"
                aria-label={event.title}
              />

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-4 space-y-2.5">
                {/* Meta details: Date & City */}
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1 text-primary">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDate(event.startsAt)}</span>
                  </span>

                  {event.cityName && (
                    <span className="flex items-center gap-1 truncate max-w-[110px]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.cityName}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                  {event.title}
                </h3>

                {/* Venue name if available */}
                {event.venueName && (
                  <p className="line-clamp-1 text-xs text-muted-foreground/90 font-medium">
                    📍 {event.venueName}
                  </p>
                )}

                {/* Summary */}
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed mt-auto">
                  {event.summary || event.title}
                </p>

                {/* Footer action */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Detayları İncele</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
