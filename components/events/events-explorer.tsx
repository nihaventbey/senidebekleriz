"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  ExternalLink,
  ArrowRight,
  Clock,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicEvent } from "@/lib/data/events";

type City = { id: string; name: string; slug: string };

const TYPE_FILTERS = [
  { slug: "all", label: "Tümü", emoji: "✨" },
  { slug: "tiyatro", label: "Tiyatro", emoji: "🎭" },
  { slug: "konser", label: "Konser", emoji: "🎵" },
  { slug: "sergi", label: "Sergi", emoji: "🎨" },
  { slug: "festival", label: "Festival", emoji: "🎪" },
  { slug: "duyuru", label: "Gösteri & Duyuru", emoji: "📢" },
] as const;

const DATE_FILTERS = [
  { key: "all", label: "Tüm Tarihler" },
  { key: "upcoming", label: "En Yakın / Yaklaşanlar" },
  { key: "this_week", label: "Bu Hafta" },
  { key: "this_month", label: "Bu Ay" },
] as const;

const POPULAR_CITIES = [
  { slug: "istanbul", name: "İstanbul" },
  { slug: "ankara", name: "Ankara" },
  { slug: "izmir", name: "İzmir" },
  { slug: "antalya", name: "Antalya" },
  { slug: "canakkale", name: "Çanakkale" },
  { slug: "bursa", name: "Bursa" },
  { slug: "gaziantep", name: "Gaziantep" },
  { slug: "diyarbakir", name: "Diyarbakır" },
  { slug: "trabzon", name: "Trabzon" },
];

const TYPE_COLORS: Record<string, string> = {
  tiyatro: "bg-purple-600 text-white",
  konser: "bg-blue-600 text-white",
  sergi: "bg-amber-600 text-white",
  festival: "bg-emerald-600 text-white",
  duyuru: "bg-rose-600 text-white",
  diger: "bg-slate-700 text-white",
};

const TYPE_LABELS: Record<string, string> = {
  tiyatro: "Tiyatro",
  konser: "Konser",
  sergi: "Sergi",
  festival: "Festival",
  duyuru: "Duyuru",
  diger: "Kültür",
};

function parseDateComponents(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const day = d.getDate();
  const month = d.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const full = d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return { day, month, time, full, dateObj: d };
}

type Props = {
  initialEvents: PublicEvent[];
  cities: City[];
  initialCity?: string;
  initialType?: string;
};

export function EventsExplorer({
  initialEvents,
  cities,
  initialCity = "all",
  initialType = "all",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");

  // Filtering & Sorting
  const filteredEvents = useMemo(() => {
    let list = [...initialEvents];
    const now = new Date();

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.summary && e.summary.toLowerCase().includes(q)) ||
          (e.venueName && e.venueName.toLowerCase().includes(q)) ||
          (e.cityName && e.cityName.toLowerCase().includes(q))
      );
    }

    // 2. Type Filter
    if (selectedType && selectedType !== "all") {
      list = list.filter((e) => e.eventType === selectedType);
    }

    // 3. City Filter
    if (selectedCity && selectedCity !== "all") {
      list = list.filter((e) => e.citySlug === selectedCity);
    }

    // 4. Date Filter & Sorting
    if (selectedDateFilter === "this_week") {
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      list = list.filter((e) => {
        if (!e.startsAt) return false;
        const d = new Date(e.startsAt);
        return d >= now && d <= weekAhead;
      });
    } else if (selectedDateFilter === "this_month") {
      const monthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      list = list.filter((e) => {
        if (!e.startsAt) return false;
        const d = new Date(e.startsAt);
        return d >= now && d <= monthAhead;
      });
    } else if (selectedDateFilter === "upcoming") {
      list.sort((a, b) => {
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
        return timeA - timeB;
      });
    }

    return list;
  }, [initialEvents, searchQuery, selectedType, selectedCity, selectedDateFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    selectedCity !== "all" ||
    selectedDateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCity("all");
    setSelectedDateFilter("all");
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 p-6 sm:p-10 md:p-12 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Türkiye Kültür & Sanat Takvimi
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:leading-[1.15]">
            Kültür, Sanat ve Festival Etkinlikleri
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Devlet Tiyatroları, Kültür Yolu Festivalleri, konserler, sergiler ve açık hava etkinliklerini tek çatı altında keşfedin. Tarihe, şehre ve kategoriye göre anında filtreleyin.
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Interactive Filter Toolbar */}
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
        {/* Row 1: Search, Date Filter & City Filter */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Input */}
          <div className="lg:col-span-5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Etkinlik, sanatçı, mekan veya şehir ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-9 text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Date Filter */}
          <div className="lg:col-span-4">
            <Select
              value={selectedDateFilter}
              onValueChange={(v) => {
                if (v) setSelectedDateFilter(v);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Tarih Filtresi" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((df) => (
                  <SelectItem key={df.key} value={df.key}>
                    📅 {df.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div className="lg:col-span-3">
            <Select
              value={selectedCity}
              onValueChange={(v) => {
                if (v) setSelectedCity(v);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Tüm Şehirler" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">📍 Tüm Şehirler (81 İl)</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Category Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">
            Tür:
          </span>
          {TYPE_FILTERS.map((tf) => {
            const isActive = selectedType === tf.slug;
            return (
              <button
                key={tf.slug}
                onClick={() => setSelectedType(tf.slug)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tf.emoji}</span>
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Popular City Chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3 text-xs">
          <span className="font-medium text-muted-foreground mr-1">
            Popüler Şehirler:
          </span>
          {POPULAR_CITIES.map((pc) => (
            <button
              key={pc.slug}
              onClick={() => setSelectedCity(selectedCity === pc.slug ? "all" : pc.slug)}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedCity === pc.slug
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {pc.name}
            </button>
          ))}
        </div>

        {/* Status Bar / Results Count & Clear Button */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            Toplam <strong>{filteredEvents.length}</strong> etkinlik bulundu
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">
            Aramanıza Uygun Etkinlik Bulunamadı
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Seçtiğiniz tarih, şehir veya kategori kriterlerine uygun etkinlik bulunamadı. Filtreleri temizleyerek tüm etkinlikleri görebilirsiniz.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-4 text-xs font-semibold"
          >
            Filtreleri Sıfırla
          </Button>
        </div>
      )}

      {/* Events Grid */}
      {filteredEvents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const dateInfo = parseDateComponents(event.startsAt);
            const typeColor = TYPE_COLORS[event.eventType] || TYPE_COLORS.diger;
            const typeLabel = TYPE_LABELS[event.eventType] || "Kültür";
            const ctaUrl = event.ticketUrl || event.sourceUrl;

            return (
              <Card
                key={event.id}
                className="group flex flex-col justify-between overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                {/* Event Poster / Image Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {event.coverImage ? (
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-muted to-purple-500/10 text-muted-foreground">
                      <Calendar className="h-10 w-10 text-primary/40" />
                      <span className="text-xs font-medium">Kültür Etkinliği</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Date Badge (Calendar Leaf on top left) */}
                  {dateInfo && (
                    <div className="absolute left-3 top-3 flex flex-col items-center justify-center rounded-xl bg-background/95 px-2.5 py-1.5 shadow-md backdrop-blur-xs border border-border/40">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                        {dateInfo.month}
                      </span>
                      <span className="text-base font-black leading-none text-foreground">
                        {dateInfo.day}
                      </span>
                    </div>
                  )}

                  {/* Category & City Badges on top right */}
                  <div className="absolute right-3 top-3 flex flex-wrap gap-1.5 justify-end">
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 shadow-xs border-0 ${typeColor}`}>
                      {typeLabel}
                    </Badge>
                    {event.cityName && (
                      <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-[10px] backdrop-blur-xs">
                        {event.cityName}
                      </Badge>
                    )}
                  </div>

                  {/* Time badge on bottom right */}
                  {dateInfo?.time && dateInfo.time !== "00:00" && (
                    <div className="absolute bottom-2.5 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-xs">
                      <Clock className="h-3 w-3" />
                      <span>{dateInfo.time}</span>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <CardContent className="flex flex-1 flex-col justify-between p-5">
                  <div className="space-y-2.5">
                    {/* Venue & Location */}
                    {event.venueName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate font-medium" title={event.venueName}>
                          {event.venueName}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-bold leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/etkinlik/${event.slug}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </h3>

                    {/* Summary */}
                    {event.summary && (
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {event.summary}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="flex-1 text-xs font-semibold h-8"
                    >
                      <Link href={`/etkinlik/${event.slug}`}>
                        Detayları Gör
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {ctaUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 px-2.5 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                        title={event.ticketUrl ? "Bilet Al" : "Kaynak Sayfası"}
                      >
                        <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                          {event.ticketUrl ? (
                            <>
                              <Ticket className="h-3.5 w-3.5 text-primary" />
                              <span className="hidden sm:inline">Bilet</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Kaynak</span>
                            </>
                          )}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
