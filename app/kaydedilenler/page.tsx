"use client";

import { useState } from "react";
import Link from "next/link";
import { useBookmarks, type BookmarkItem } from "@/lib/hooks/use-bookmarks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  MapPin,
  Heart,
  CheckCircle2,
  Trash2,
  Sparkles,
  Share2,
  ArrowRight,
  Landmark,
  Calendar,
  BookOpen,
  Newspaper,
  Award,
} from "lucide-react";
import { toast } from "@/lib/toast";

export default function BookmarksPage() {
  const {
    bookmarks,
    isLoaded,
    removeBookmark,
    updateStatus,
    visitedCount,
    bucketlistCount,
  } = useBookmarks();

  const [activeTab, setActiveTab] = useState<"all" | "visited" | "bucketlist" | "places" | "articles">("all");

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-8 w-48 rounded-lg bg-muted" />
          <div className="mx-auto h-4 w-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  // Calculate unique visited cities
  const uniqueCities = new Set(
    bookmarks
      .filter((b) => b.cityName)
      .map((b) => b.cityName)
  );

  const cityProgress = Math.min(100, Math.round((uniqueCities.size / 81) * 100));

  // Determine Culture Explorer Badge
  let badgeTitle = "Çırak Gezgin";
  let badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/30";
  if (visitedCount >= 10 || uniqueCities.size >= 5) {
    badgeTitle = "Antik Çağ Kaşifi 🏛️";
    badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/30";
  } else if (visitedCount >= 5 || uniqueCities.size >= 3) {
    badgeTitle = "Kültür Elçisi 📜";
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/30";
  }

  const filteredBookmarks = bookmarks.filter((item) => {
    if (activeTab === "visited") return item.status === "visited";
    if (activeTab === "bucketlist") return item.status !== "visited";
    if (activeTab === "places") return item.type === "place";
    if (activeTab === "articles") return item.type === "article";
    return true;
  });

  function getDetailUrl(item: BookmarkItem) {
    if (item.type === "place") return `/mekan/${item.slug}`;
    if (item.type === "article") return `/blog/${item.slug}`;
    if (item.type === "event") return `/etkinlik/${item.slug}`;
    if (item.type === "news") return `/haber/${item.slug}`;
    return `/sehir/${item.slug}`;
  }

  function handleSharePassport() {
    const shareText = `🏛️ Seni de Bekleriz Kültür Pasaportum:\n✨ ${visitedCount} Tarihi Mekan Gezildi\n📍 ${uniqueCities.size} Farklı Şehir Keşfedildi\n🏆 Ünvan: ${badgeTitle}\nSen de Türkiye'yi keşfet: https://senidebekleriz.com`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success("Kültür Pasaportu Kopyalandı! 📋", "Arkadaşlarınızla ve sosyal medyada paylaşabilirsiniz.");
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header Banner */}
      <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-sm font-semibold ${badgeColor}`}>
                <Award className="h-4 w-4" />
                {badgeTitle}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {uniqueCities.size} / 81 İl Keşfedildi (%{cityProgress})
              </Badge>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Kültür Pasaportum & Gezi Listem
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Türkiye genelinde gezdiğiniz müzeleri damgalayın, gitmek istediğiniz tarihi mekanları listenize ekleyin.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSharePassport}
                className="gap-2 border-primary/30 hover:bg-primary/5"
              >
                <Share2 className="h-4 w-4 text-primary" />
                Pasaportumu Paylaş
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Gezilen Mekanlar</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {visitedCount}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Hedefler / Gezi Listesi</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {bucketlistCount}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Keşif Yapılan İller</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {uniqueCities.size}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Toplam Kayıt</p>
              <p className="mt-1 text-2xl font-extrabold text-primary">
                {bookmarks.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b pb-4">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            Tümü ({bookmarks.length})
          </Button>
          <Button
            variant={activeTab === "visited" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("visited")}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Gezdiklerim ({visitedCount})
          </Button>
          <Button
            variant={activeTab === "bucketlist" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("bucketlist")}
            className="gap-1.5"
          >
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Hedeflerim ({bucketlistCount})
          </Button>
          <Button
            variant={activeTab === "places" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("places")}
            className="gap-1.5"
          >
            <Landmark className="h-3.5 w-3.5" />
            Kültür Mekanları
          </Button>
          <Button
            variant={activeTab === "articles" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("articles")}
            className="gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Gezi Rehberleri
          </Button>
        </div>

        {/* Empty State */}
        {filteredBookmarks.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold">Listenizde henüz içerik yok</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {activeTab === "visited"
                ? "Henüz 'Gezdim' olarak işaretlediğiniz bir kültürel mekan yok. Mekan detayından damganızı ekleyin!"
                : "Tarihi mekanları, antik kentleri ve gezi rehberlerini listenize ekleyerek keşfe başlayın."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/sehirler">Şehirleri Keşfet</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/blog">Gezi Rehberleri</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Bookmarks Grid */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBookmarks.map((item) => {
              const isVisited = item.status === "visited";

              return (
                <Card
                  key={item.id}
                  className="card-hover flex h-full flex-col justify-between overflow-hidden border-border/70"
                >
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-background to-muted">
                        <Landmark className="h-10 w-10 text-primary/40" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isVisited ? (
                        <Badge className="bg-emerald-600 text-white gap-1 shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                          Gezildi ✔️
                        </Badge>
                      ) : (
                        <Badge className="bg-black/60 text-white backdrop-blur-xs gap-1">
                          <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                          Hedefimde 🎯
                        </Badge>
                      )}
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-background/85 backdrop-blur-xs text-[11px] font-semibold">
                        {item.type === "place"
                          ? "Mekan"
                          : item.type === "article"
                          ? "Rehber"
                          : item.type === "event"
                          ? "Etkinlik"
                          : "Haber"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      {item.cityName && (
                        <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-primary">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.cityName}</span>
                        </div>
                      )}
                      <Link href={getDetailUrl(item)}>
                        <h3 className="line-clamp-2 text-base font-bold leading-snug hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="flex items-center justify-between gap-2">
                        {isVisited ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => updateStatus(item.id, "bucketlist")}
                          >
                            Hedeflere Taşı
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => {
                              updateStatus(item.id, "visited");
                              toast.success("Pasaportuna Damga Vuruldu! 🏛️", `"${item.title}" gezilenler arasına eklendi.`);
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Gezdim
                          </Button>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                            onClick={() => {
                              removeBookmark(item.id);
                              toast.info("Listeden Çıkarıldı", item.title);
                            }}
                            title="Listeden Çıkar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Detayları İncele"
                          >
                            <Link href={getDetailUrl(item)}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
