"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  ExplorerHeroSection,
  pickCityHeroMosaic,
} from "@/components/explorer/explorer-hero-section";
import { TURKEY_REGIONS } from "@/lib/cities/regions";

export type CityListItem = {
  slug: string;
  name: string;
  region: string;
  description: string;
  coverImage: string | null;
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function CityCard({ city }: { city: CityListItem }) {
  return (
    <Link href={`/sehir/${city.slug}`}>
      <Card className="card-hover h-full overflow-hidden border-border/60">
        {city.coverImage ? (
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src={city.coverImage}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-semibold text-white drop-shadow">{city.name}</p>
              <p className="text-xs text-white/85">{city.region}</p>
            </div>
          </div>
        ) : (
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{city.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{city.region}</p>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={city.coverImage ? "pt-4" : ""}>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {city.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

type Props = {
  cities: CityListItem[];
};

export function CitiesExplorer({ cities }: Props) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("");

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());

    return cities.filter((city) => {
      if (region && city.region !== region) return false;
      if (!q) return true;

      const haystack = normalizeText(
        `${city.name} ${city.region} ${city.description} ${city.slug}`
      );
      return haystack.includes(q);
    });
  }, [cities, query, region]);

  const grouped = useMemo(() => {
    if (query.trim() || region) return null;

    return TURKEY_REGIONS.map((r) => ({
      region: r,
      cities: filtered.filter((c) => c.region === r),
    })).filter((g) => g.cities.length > 0);
  }, [filtered, query, region]);

  const hasFilters = Boolean(query.trim() || region);

  const heroMosaic = useMemo(() => pickCityHeroMosaic(cities), [cities]);

  function clearFilters() {
    setQuery("");
    setRegion("");
  }

  return (
    <div>
      <ExplorerHeroSection
        mosaicImages={heroMosaic}
        badge="81 İl · Kültür Rehberi"
        title="Türkiye'nin Şehirlerini Keşfet"
        description={`Müzeler, tarihi yerler ve sanat mekanlarıyla ${cities.length} ili gezmeye başla.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Şehir adı veya bölge ara..."
            className="h-12 rounded-xl border-white/20 bg-background/95 pl-12 pr-4 text-base shadow-lg backdrop-blur"
            aria-label="Şehir ara"
          />
        </div>
      </ExplorerHeroSection>

      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <AdBanner
            slot="cities-top"
            className="min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={!region ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setRegion("")}
            >
              Tümü
            </Button>
            {TURKEY_REGIONS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={region === r ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setRegion(region === r ? "" : r)}
              >
                {r}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filtered.length.toLocaleString("tr-TR")} şehir
              {hasFilters ? " bulundu" : ""}
            </span>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Temizle
              </Button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-muted/20 py-16 text-center">
            <p className="text-muted-foreground">
              Aramanızla eşleşen şehir bulunamadı.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Filtreleri temizle
            </Button>
          </div>
        ) : grouped ? (
          grouped.map(({ region: regionName, cities: regionCities }) => (
            <section key={regionName} className="mb-12 last:mb-0">
              <h2 className="mb-6 text-2xl font-bold tracking-tight">
                {regionName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {regionCities.map((city) => (
                  <CityCard key={city.slug} city={city} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((city) => (
              <CityCard key={city.slug} city={city} />
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-12">
        <AdBanner
          slot="cities-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>
    </div>
  );
}
