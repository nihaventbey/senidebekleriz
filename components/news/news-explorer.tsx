"use client";

import { useState, useMemo } from "react";
import { Search, X, Newspaper, Sparkles, Building2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewsCard, FeaturedNewsHero, NEWS_CATEGORY_LABELS } from "@/components/news/news-card";
import type { PublicNewsArticle, NewsCategory } from "@/lib/data/news";

type City = { id: string; name: string; slug: string };

const CATEGORY_TABS = [
  { key: "all", label: "Tüm Haberler", emoji: "📰" },
  { key: "arkeoloji", label: "Arkeoloji & Kazı", emoji: "🏛️" },
  { key: "restorasyon", label: "Restorasyon & Tarih", emoji: "🏰" },
  { key: "muze_sergi", label: "Müze & Sergi", emoji: "🖼️" },
  { key: "kultur_sanat", label: "Kültür & Sanat", emoji: "🎨" },
  { key: "festival_haberleri", label: "Festival Gündemi", emoji: "🎪" },
] as const;

type Props = {
  initialNews: PublicNewsArticle[];
  featuredNews: PublicNewsArticle[];
  cities: City[];
  initialCategory?: string;
  initialCity?: string;
};

export function NewsExplorer({
  initialNews,
  featuredNews,
  cities,
  initialCategory = "all",
  initialCity = "all",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);

  const filteredNews = useMemo(() => {
    let list = [...initialNews];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          (n.cityName && n.cityName.toLowerCase().includes(q)) ||
          (n.sourceName && n.sourceName.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter((n) => n.category === selectedCategory);
    }

    if (selectedCity !== "all") {
      list = list.filter((n) => n.citySlug === selectedCity);
    }

    return list;
  }, [initialNews, searchQuery, selectedCategory, selectedCity]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedCategory !== "all" || selectedCity !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedCity("all");
  };

  const selectedCityLabel =
    selectedCity === "all"
      ? "Tüm Şehirler (81 İl)"
      : cities.find((c) => c.slug === selectedCity)?.name || "Tüm Şehirler";

  return (
    <div className="space-y-10">
      {/* Featured Headlines Hero (Show only when no filters active) */}
      {!hasActiveFilters && featuredNews.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Gündemdeki Kültür & Sanat Haberleri
          </div>
          <FeaturedNewsHero newsList={featuredNews} />
        </section>
      )}

      {/* Filter Toolbar */}
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-12">
          {/* Search Input */}
          <div className="sm:col-span-8">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Haber başlığı, konu, müze veya şehir ara..."
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

          {/* City Selector */}
          <div className="sm:col-span-4">
            <Select
              value={selectedCity}
              onValueChange={(v) => {
                if (v) setSelectedCity(v);
              }}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Tüm Şehirler">
                  {selectedCityLabel}
                </SelectValue>
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

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Count Bar */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            Toplam <strong>{filteredNews.length}</strong> kültür haberi listeleniyor
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredNews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">
            Aramanıza Uygun Haber Bulunamadı
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Seçilen kategori veya arama kelimesine uygun haber içeriği bulunamadı. Filtreleri temizleyerek tüm haberleri görebilirsiniz.
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

      {/* News Grid */}
      {filteredNews.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      )}
    </div>
  );
}
