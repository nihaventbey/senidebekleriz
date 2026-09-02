"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  MapPinned,
  FileText,
  Tags,
  Star,
  ArrowRight,
  Plus,
  BookOpen,
  Sparkles,
  Newspaper,
  CalendarDays,
  Compass,
  Wand2,
  ExternalLink,
  Pencil,
  Loader2,
  CheckCircle2,
  Activity,
  Image as ImageIcon,
  Check,
  X,
} from "lucide-react";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { DiscoverySyncButton } from "@/components/admin/discovery-sync-button";
import { AdSenseReadiness } from "@/components/admin/adsense-readiness";
import { CityCoverRefreshButton } from "@/components/admin/city-cover-refresh-button";
import type { AdminDashboardStats, ContentReadinessStats } from "@/lib/data/admin-stats";
import type { ContentGaps } from "@/lib/data/content-gaps";
import type { AdminDiscoveryListItem } from "@/lib/data/admin-discovery";
import {
  importDiscoveryAsNews,
  importDiscoveryAsEvent,
  importDiscoveryAsArticle,
  rejectDiscovery,
} from "@/lib/actions/discovery";
import { toast } from "@/lib/toast";

type CockpitProps = {
  stats: AdminDashboardStats;
  readiness: ContentReadinessStats;
  gaps: ContentGaps;
  pendingDiscoveries: AdminDiscoveryListItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function DashboardCockpit({
  stats,
  readiness,
  gaps,
  pendingDiscoveries,
}: CockpitProps) {
  const router = useRouter();
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [quickAiUrl, setQuickAiUrl] = useState("");
  const [quickAiPending, startQuickAiTransition] = useTransition();

  // Discovery triage state
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isTriagePending, startTriageTransition] = useTransition();

  function runDiscoveryAction(
    id: string,
    action: "news" | "event" | "article" | "reject",
    fn: () => Promise<{ slug: string } | void>
  ) {
    setPendingId(id);
    setPendingAction(action);
    startTriageTransition(async () => {
      try {
        const result = await fn();
        if (action === "reject") {
          toast.success("Keşif kaydı reddedildi");
          router.refresh();
          return;
        }
        if (result && typeof result === "object" && "slug" in result) {
          const slug = (result as { slug: string }).slug;
          if (action === "news") {
            toast.success("Kültür haberi taslağı oluşturuldu! 📰");
            router.push(`/yonetim/haberler/${slug}/duzenle`);
          } else if (action === "article") {
            toast.success("Gezi rehberi taslağı oluşturuldu! 🗺️");
            router.push(`/yonetim/yazilar/${slug}/duzenle`);
          } else {
            toast.success("Etkinlik taslağı oluşturuldu! 🎭");
            router.push(`/yonetim/etkinlikler/${slug}/duzenle`);
          }
        }
      } catch (error) {
        toast.error(
          "İşlem başarısız",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  }

  function handleQuickAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickAiUrl.trim()) {
      toast.error("Lütfen bir haber veya etkinlik kaynak URL'si girin");
      return;
    }
    // Redirect to news create page with sourceUrl prefilled
    router.push(`/yonetim/haberler/yeni?sourceUrl=${encodeURIComponent(quickAiUrl.trim())}`);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* 1. Cockpit Header Bar */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7 shadow-xs">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground font-semibold px-2.5 py-0.5 text-xs shadow-xs">
                🎯 Kokpit & Kontrol Merkezi
              </Badge>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Seni de Bekleriz Yönetim Kokpiti
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Türkiye&apos;nin 81 ili için kültür-sanat haberleri, etkinlikler, gezi rehberleri ve yapay zeka üretim araçlarını tek ekrandan yönetin.
            </p>
          </div>

          {/* Quick Cockpit Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              onClick={() => setIsAiImageModalOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI Görsel Üret</span>
            </Button>

            <DiscoverySyncButton />

            <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold gap-1">
              <Link href="/yonetim/haberler/yeni">
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Haber</span>
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold gap-1">
              <Link href="/yonetim/etkinlikler/yeni">
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Etkinlik</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Core Cockpit KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Kültür Haberleri */}
        <Link
          href="/yonetim/haberler"
          className="group rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-blue-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Kültür Haberi</span>
            <Newspaper className="h-4 w-4 text-blue-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.newsTotal.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="text-emerald-600 font-semibold">{stats.newsPublished} yayında</span>
            <span>·</span>
            <span>{stats.newsDraft} taslak</span>
          </div>
        </Link>

        {/* Card 2: Etkinlikler */}
        <Link
          href="/yonetim/etkinlikler"
          className="group rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-purple-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Etkinlikler</span>
            <CalendarDays className="h-4 w-4 text-purple-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.eventsTotal.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="text-emerald-600 font-semibold">{stats.eventsPublished} yayında</span>
            {stats.eventsPending > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-semibold">{stats.eventsPending} onayda</span>
              </>
            )}
          </div>
        </Link>

        {/* Card 3: Keşif Kuyruğu */}
        <Link
          href="/yonetim/kesif"
          className={`group rounded-2xl border p-4 transition-all hover:shadow-md ${
            stats.pendingDiscoveries > 0
              ? "border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-card"
              : "border-border/60 bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Keşif Kuyruğu</span>
            <Compass className="h-4 w-4 text-amber-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.pendingDiscoveries.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.pendingDiscoveries > 0 ? "Onay bekleyen içerik" : "Kuyruk temiz"}
          </p>
        </Link>

        {/* Card 4: Gezi Rehberleri / Blog */}
        <Link
          href="/yonetim/yazilar"
          className="group rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-indigo-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Rehber & Yazı</span>
            <BookOpen className="h-4 w-4 text-indigo-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.articles.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.publishedArticles} yayında ({readiness.citiesWithGuide}/81 İl)
          </div>
        </Link>

        {/* Card 5: Mekanlar */}
        <Link
          href="/yonetim/mekanlar"
          className="group rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-teal-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Kültür Mekanları</span>
            <MapPinned className="h-4 w-4 text-teal-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.places.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.indexablePlaces} indekslenebilir
          </div>
        </Link>

        {/* Card 6: 81 Şehir */}
        <Link
          href="/yonetim/sehirler"
          className="group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">81 İl Kapsamı</span>
            <Building2 className="h-4 w-4 text-emerald-500 opacity-70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {stats.cities.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold truncate">
            Tamamı Tanımlı
          </p>
        </Link>
      </section>

      {/* 3. Pending Discoveries Quick Action Cockpit Stream */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                Canlı İçerik Keşfi & Hızlı Triaj Kuyruğu
                {stats.pendingDiscoveries > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {stats.pendingDiscoveries} onay bekliyor
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Google Haberler ve Kültür Portalı&apos;ndan taranan yeni maddeleri tek tıkla habere veya etkinliğe dönüştürün.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <Link href="/yonetim/kesif">
              Tüm Keşifleri Gör ({stats.pendingDiscoveries})
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {pendingDiscoveries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 opacity-60" />
            <p className="text-xs sm:text-sm font-medium">Onay bekleyen keşif kaydı bulunmuyor. Her şey güncel!</p>
            <p className="text-[11px] text-muted-foreground">
              Yeni kültür-sanat akışlarını taramak için yukarıdaki &quot;Şimdi Tara &amp; Keşfet&quot; butonunu kullanabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDiscoveries.slice(0, 4).map((item) => {
              const busy = isTriagePending && pendingId === item.id;
              const formattedTitle =
                item.title.length > 80 ? `${item.title.slice(0, 80).trim()}...` : item.title;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-1" title={item.title}>
                        {formattedTitle}
                      </span>
                      {item.city_slug && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.city_slug}
                        </Badge>
                      )}
                    </div>
                    {item.snippet && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.snippet}
                      </p>
                    )}
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[11px] text-primary hover:underline gap-1"
                    >
                      <span className="truncate max-w-[200px]">{item.source_name || "Kaynak Linki"}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        runDiscoveryAction(item.id, "news", () =>
                          importDiscoveryAsNews(item.id)
                        )
                      }
                      className="h-7 px-2.5 text-[11px] font-semibold gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      title="Kültür Haberi Yap"
                    >
                      {busy && pendingAction === "news" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Newspaper className="h-3 w-3" />
                      )}
                      <span>Habere Dönüştür</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        runDiscoveryAction(item.id, "event", () =>
                          importDiscoveryAsEvent(item.id)
                        )
                      }
                      className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                      title="Etkinlik Yap"
                    >
                      {busy && pendingAction === "event" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CalendarDays className="h-3 w-3" />
                      )}
                      <span>Etkinlik</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        runDiscoveryAction(item.id, "reject", () =>
                          rejectDiscovery(item.id)
                        )
                      }
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Reddet"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Two-Column Live Activity Stream (Son Haberler & Son Etkinlikler) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Son Eklenen Kültür Haberleri */}
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-bold">Son Kültür Haberleri</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link href="/yonetim/haberler">
                Tümü ({stats.newsTotal}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentNews.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Henüz eklenen haber yok.</p>
            ) : (
              stats.recentNews.map((news) => (
                <div
                  key={news.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {news.coverImage ? (
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <img src={news.coverImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground">
                        <Newspaper className="h-4 w-4 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/yonetim/haberler/${news.slug}/duzenle`}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary hover:underline line-clamp-1"
                        title={news.title}
                      >
                        {news.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{news.cityName || "Genel"}</span>
                        <span>·</span>
                        <span>{formatDate(news.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={news.isPublished ? "default" : "secondary"} className="text-[10px]">
                      {news.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                      <Link href={`/yonetim/haberler/${news.slug}/duzenle`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Son Eklenen Etkinlikler */}
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm sm:text-base font-bold">Son Kültür Etkinlikleri</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link href="/yonetim/etkinlikler">
                Tümü ({stats.eventsTotal}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Henüz etkinlik yok.</p>
            ) : (
              stats.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/yonetim/etkinlikler/${evt.slug}/duzenle`}
                      className="font-bold text-xs sm:text-sm text-foreground hover:text-purple-600 hover:underline line-clamp-1"
                      title={evt.title}
                    >
                      {evt.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="capitalize">{evt.eventType || "Etkinlik"}</span>
                      <span>·</span>
                      <span>{evt.cityName || "Şehir yok"}</span>
                      <span>·</span>
                      <span>{formatDate(evt.startsAt || evt.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={evt.status === "published" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {evt.status === "published" ? "Yayında" : "Onay Bekliyor"}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-purple-600">
                      <Link href={`/yonetim/etkinlikler/${evt.slug}/duzenle`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Content Quality, Gaps & AdSense Readiness */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdSenseReadiness stats={readiness} />

        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base font-bold">İçerik Kalitesi &amp; Eksiklik Takibi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/yonetim/mekanlar?gap=no-cover"
                className="rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <p className="text-2xl font-bold text-foreground">
                  {gaps.placesWithoutCover.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Görseli eksik mekan
                </p>
              </Link>
              <Link
                href="/yonetim/mekanlar?gap=thin"
                className="rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <p className="text-2xl font-bold text-foreground">
                  {gaps.placesThinContent.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  İnce içerikli mekan
                </p>
              </Link>
              <div className="rounded-xl border p-3">
                <p className="text-2xl font-bold text-foreground">
                  {gaps.citiesWithoutCover.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground">Kapaksız şehir</p>
              </div>
              <Link
                href="/yonetim/sehirler?cover=valilik"
                className="rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <p className="text-2xl font-bold text-foreground">
                  {gaps.citiesValilikCover.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valilik kaynaklı kapak
                </p>
              </Link>
            </div>
            {gaps.citiesValilikCover > 0 && (
              <CityCoverRefreshButton
                count={gaps.citiesValilikCover}
                size="sm"
              />
            )}
            <div>
              <p className="font-medium text-xs sm:text-sm">Şehir rehberi durumu</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {readiness.citiesWithoutGuide} şehirde henüz yayınlanmış gezi rehberi yok.
              </p>
              {readiness.missingGuideCities.length > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Öncelikli iller: {readiness.missingGuideCities.join(", ")}
                  {readiness.citiesWithoutGuide > 12 ? "…" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global AI Image Modal */}
      <AiImageModal
        isOpen={isAiImageModalOpen}
        onClose={() => setIsAiImageModalOpen(false)}
        onSelectImage={(url) => {
          // Open new news form or copy to clipboard
          navigator.clipboard.writeText(url).then(() => {
            toast.success("Görsel bağlantısı panoya kopyalandı! İstediğiniz içerikte kullanabilirsiniz. 📋");
          });
        }}
      />
    </div>
  );
}
