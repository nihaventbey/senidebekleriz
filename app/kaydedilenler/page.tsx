"use client";

import { useState } from "react";
import Link from "next/link";
import { useBookmarks, type BookmarkItem } from "@/lib/hooks/use-bookmarks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Heart,
  CheckCircle2,
  Trash2,
  Sparkles,
  Share2,
  ArrowRight,
  Newspaper,
  Award,
  Ticket,
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

  const [activeTab, setActiveTab] = useState<"all" | "events" | "news" | "attended" | "saved">("all");

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

  // Calculate unique cities
  const uniqueCities = new Set(
    bookmarks
      .filter((b) => b.cityName)
      .map((b) => b.cityName)
  );

  // Determine Culture Level Badge
  let badgeTitle = "Kültür Meraklısı 🎟️";
  let badgeColor = "bg-primary/10 text-primary border-primary/30";
  if (visitedCount >= 10 || bookmarks.length >= 15) {
    badgeTitle = "Sanat & Sahne Tutkunu 🎭";
    badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/30";
  } else if (visitedCount >= 5 || bookmarks.length >= 8) {
    badgeTitle = "Kültür Ajandası Takipçisi 📜";
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/30";
  }

  const filteredBookmarks = bookmarks.filter((item) => {
    if (activeTab === "attended") return item.status === "visited";
    if (activeTab === "saved") return item.status !== "visited";
    if (activeTab === "events") return item.type === "event";
    if (activeTab === "news") return item.type === "news" || item.type === "article";
    return true;
  });

  function getDetailUrl(item: BookmarkItem) {
    if (item.type === "event") return `/etkinlik/${item.slug}`;
    if (item.type === "news") return `/haber/${item.slug}`;
    if (item.type === "article") return `/haber/${item.slug}`;
    return `/etkinlikler`;
  }

  function handleShareAgenda() {
    const shareText = `🎭 Seni de Bekleriz Kültür Ajandam:\n🎟️ ${bookmarks.length} Kültür Etkinliği & Haber Kaydedildi\n📍 ${uniqueCities.size} Farklı Şehir\n🏆 Ünvan: ${badgeTitle}\nSen de kültür ajandanı oluştur: https://www.senidebekleriz.com/etkinlikler`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success("Kültür Ajandası Kopyalandı! 📋", "Arkadaşlarınızla ve sosyal medyada paylaşabilirsiniz.");
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
                {bookmarks.length} Kayıtlı İçerik
              </Badge>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Kültür Ajandam &amp; Kayıtlılar
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Katılmak istediğiniz tiyatro oyunlarını, konserleri, sergileri ve takip ettiğiniz kültür haberlerini buradan yönetin.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareAgenda}
                className="gap-2 border-primary/30 hover:bg-primary/5"
              >
                <Share2 className="h-4 w-4 text-primary" />
                Ajandamı Paylaş
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Katıldığım Etkinlikler</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {visitedCount}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Gitmek İstediklerim</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {bucketlistCount}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">İlgilendiğim Şehirler</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {uniqueCities.size}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Toplam Ajanda Kaydı</p>
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
            variant={activeTab === "events" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("events")}
            className="gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            Etkinlikler &amp; Sahneler
          </Button>
          <Button
            variant={activeTab === "news" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("news")}
            className="gap-1.5"
          >
            <Newspaper className="h-3.5 w-3.5" />
            Kültür Haberleri
          </Button>
          <Button
            variant={activeTab === "saved" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("saved")}
            className="gap-1.5"
          >
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Planladıklarım ({bucketlistCount})
          </Button>
          <Button
            variant={activeTab === "attended" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("attended")}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Gittiklerim ({visitedCount})
          </Button>
        </div>

        {/* Empty State */}
        {filteredBookmarks.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary opacity-50" />
            <h3 className="text-lg font-bold text-foreground">Ajandanızda henüz kayıt yok</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Etkinlik takviminden ve kültür haberlerinden ilginizi çeken sergileri, konserleri ve oyunları kalp ikonuna basarak ajandanıza ekleyebilirsiniz.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="sm">
                <Link href="/etkinlikler">Etkinlikleri Keşfet</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/haberler">Kültür Haberleri</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map((item) => {
              const isVisited = item.status === "visited";

              return (
                <Card
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden border-border/70 transition-all hover:shadow-md hover:border-primary/40"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <Badge
                        variant="secondary"
                        className="bg-background/90 text-xs font-semibold backdrop-blur-xs"
                      >
                        {item.type === "event" ? "🎭 Etkinlik" : "📰 Kültür Haberi"}
                      </Badge>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeBookmark(item.id)}
                        className="h-7 w-7 rounded-full bg-background/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground backdrop-blur-xs"
                        title="Ajandadan Kaldır"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col p-4 space-y-3">
                    <div>
                      {item.cityName && (
                        <p className="flex items-center gap-1 text-xs font-medium text-primary">
                          <MapPin className="h-3 w-3" />
                          <span>{item.cityName}</span>
                        </p>
                      )}
                      <h4 className="mt-1 line-clamp-2 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        <Link href={getDetailUrl(item)}>
                          {item.title}
                        </Link>
                      </h4>
                    </div>

                    {/* Visited Status Toggle */}
                    <div className="mt-auto pt-3 border-t flex items-center justify-between">
                      <Button
                        size="sm"
                        variant={isVisited ? "secondary" : "outline"}
                        onClick={() => updateStatus(item.id, isVisited ? "bucketlist" : "visited")}
                        className={`h-7 text-xs font-semibold gap-1.5 ${
                          isVisited ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" : ""
                        }`}
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 ${isVisited ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <span>{isVisited ? "Katıldım ✓" : "Gideceğim"}</span>
                      </Button>

                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-bold text-primary gap-1">
                        <Link href={getDetailUrl(item)}>
                          İncele
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
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
