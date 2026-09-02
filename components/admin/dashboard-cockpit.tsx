"use client";

import { useState, useTransition, useMemo } from "react";
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
  Flame,
  Globe,
  Quote,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { DiscoverySyncButton } from "@/components/admin/discovery-sync-button";
import { AdSenseReadiness } from "@/components/admin/adsense-readiness";
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

const DAILY_QUOTES = [
  {
    quote: "Seyahat et ki, sıhhat bulasın ve rızıklanasın.",
    author: "Evliya Çelebi",
    tag: "Seyahatname",
  },
  {
    quote: "Kültür, bir milletin hafızasıdır; geçmişi bugüne, bugünü yarına bağlar.",
    author: "Ahmet Hamdi Tanpınar",
    tag: "Beş Şehir",
  },
  {
    quote: "Gözlerini açtığında karşında Ege'yi göreceksin; burası mavi sürgünün cennetidir.",
    author: "Halikarnas Balıkçısı",
    tag: "Mavi Sürgün",
  },
  {
    quote: "Bir insanı sevmekle başlar her şey; bir şehri tanımakla başlar yolculuk.",
    author: "Sait Faik Abasıyanık",
    tag: "Edebiyat",
  },
  {
    quote: "Tarih, taşların ve sütunların sessizliğinde yaşayan en büyük şiirdir.",
    author: "Yahya Kemal Beyatlı",
    tag: "Aziz İstanbul",
  },
  {
    quote: "Anadolu; binlerce yıllık medeniyetlerin birbiri üstüne dokuduğu zengin bir kilimdir.",
    author: "Yaşar Kemal",
    tag: "Kültür Mirası",
  },
  {
    quote: "Yollar yürümek içindir, yeni yerler görmek ve insanı yeniden keşfetmek için.",
    author: "Sabahattin Ali",
    tag: "Yol Notları",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️ Günaydın";
  if (hour >= 12 && hour < 18) return "🌤️ İyi Günler";
  if (hour >= 18 && hour < 22) return "🌇 İyi Akşamlar";
  return "🌙 İyi Geceler";
}

function getTodayFormatted(): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "Bugün";
  }
}

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

  // Discovery triage state
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isTriagePending, startTriageTransition] = useTransition();

  // Daily quote selection based on day of month
  const todayQuote = useMemo(() => {
    const day = new Date().getDate();
    return DAILY_QUOTES[day % DAILY_QUOTES.length];
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const todayDateStr = useMemo(() => getTodayFormatted(), []);

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
      toast.error("Lütfen bir haber veya etkinlik kaynak linki girin");
      return;
    }
    // Prefill news create page with sourceUrl query param
    router.push(`/yonetim/haberler/yeni?sourceUrl=${encodeURIComponent(quickAiUrl.trim())}`);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
      {/* 1. Cockpit Header Bar with Dynamic Greeting & Quote */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-background to-card p-6 sm:p-8 shadow-sm">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {todayDateStr}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Canlı &amp; Hazır
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, Editör! 🚀
            </h1>

            {/* Daily Cultural Inspiration */}
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-background/60 backdrop-blur-xs p-3 text-xs text-muted-foreground mt-2">
              <Quote className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="italic text-foreground font-medium">
                  &ldquo;{todayQuote.quote}&rdquo;
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  — <strong>{todayQuote.author}</strong> ({todayQuote.tag})
                </p>
              </div>
            </div>
          </div>

          {/* Quick Cockpit Action Suite */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Button
              type="button"
              onClick={() => setIsAiImageModalOpen(true)}
              className="h-10 px-4 text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <Wand2 className="h-4 w-4 text-amber-100" />
              <span>AI Görsel Üret</span>
            </Button>

            <DiscoverySyncButton />

            <Button asChild variant="outline" size="sm" className="h-10 px-3.5 text-xs font-semibold gap-1.5 shadow-xs">
              <Link href="/yonetim/haberler/yeni">
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Haber</span>
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-10 px-3.5 text-xs font-semibold gap-1.5 shadow-xs">
              <Link href="/yonetim/etkinlikler/yeni">
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Etkinlik</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Quick AI News Launcher Box (Kokpitten Doğrudan Linkle Haber Başlatma) */}
      <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleQuickAiSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground shrink-0">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Hızlı AI Haber Başlatıcı:</span>
          </div>
          <div className="relative flex-1 w-full">
            <Input
              type="url"
              placeholder="Kültür Bakanlığı, AA, TRT veya haber sitesi linki yapıştırın (https://...)"
              value={quickAiUrl}
              onChange={(e) => setQuickAiUrl(e.target.value)}
              className="h-9 text-xs pl-3 pr-8"
            />
            {quickAiUrl && (
              <button
                type="button"
                onClick={() => setQuickAiUrl("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="h-9 text-xs font-semibold gap-1.5 w-full sm:w-auto shrink-0 shadow-xs">
            <Send className="h-3.5 w-3.5" /> Habere Dönüştür
          </Button>
        </form>
      </section>

      {/* 3. Core Cockpit KPI Cards (6'lı Canlı Veri Grid) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Kültür Haberleri */}
        <Link
          href="/yonetim/haberler"
          className="group rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-blue-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Kültür Haberi</span>
            <Newspaper className="h-4 w-4 text-blue-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.newsTotal.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="text-emerald-600 font-semibold">{stats.newsPublished} yayında</span>
            {stats.newsDraft > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-medium">{stats.newsDraft} taslak</span>
              </>
            )}
          </div>
        </Link>

        {/* Card 2: Etkinlikler */}
        <Link
          href="/yonetim/etkinlikler"
          className="group rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-purple-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Etkinlikler</span>
            <CalendarDays className="h-4 w-4 text-purple-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.eventsTotal.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
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
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card to-card hover:border-amber-500/60"
              : "border-border/60 bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Keşif Kuyruğu</span>
            <Compass className="h-4 w-4 text-amber-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.pendingDiscoveries.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.pendingDiscoveries > 0 ? "Onay bekleyen içerik" : "Kuyruk temiz"}
          </p>
        </Link>

        {/* Card 4: Gezi Rehberleri / Blog */}
        <Link
          href="/yonetim/yazilar"
          className="group rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-indigo-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Rehber &amp; Yazı</span>
            <BookOpen className="h-4 w-4 text-indigo-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.articles.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.publishedArticles} yayında ({readiness.citiesWithGuide}/81 İl)
          </div>
        </Link>

        {/* Card 5: Mekanlar */}
        <Link
          href="/yonetim/mekanlar"
          className="group rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-teal-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Kültür Mekanları</span>
            <MapPinned className="h-4 w-4 text-teal-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.places.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.indexablePlaces} indekslenebilir
          </div>
        </Link>

        {/* Card 6: 81 Şehir */}
        <Link
          href="/yonetim/sehirler"
          className="group rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 transition-all hover:shadow-md hover:border-emerald-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">81 İl Kapsamı</span>
            <Building2 className="h-4 w-4 text-emerald-500 opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.cities.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold truncate">
            Tamamı Tanımlı
          </p>
        </Link>
      </section>

      {/* 4. Live Discovery Queue & Quick Triage Stream */}
      <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Canlı İçerik Keşfi &amp; Hızlı Triaj İstasyonu
                {stats.pendingDiscoveries > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                    {stats.pendingDiscoveries} onay bekliyor
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Google Haberler ve Kültür Portalı&apos;ndan taranan maddeleri tek tıkla habere veya etkinliğe dönüştürün.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold self-start sm:self-center">
            <Link href="/yonetim/kesif">
              Tüm Keşif Kuyruğu ({stats.pendingDiscoveries})
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {pendingDiscoveries.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="h-9 w-9 mx-auto text-emerald-500 opacity-70" />
            <p className="text-sm font-semibold text-foreground">Onay bekleyen keşif kaydı bulunmuyor. Her şey güncel!</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Yeni kültür-sanat akışlarını taramak için üst bardaki &quot;Şimdi Tara &amp; Keşfet&quot; butonuna basabilirsiniz.
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground leading-snug" title={item.title}>
                        {formattedTitle}
                      </span>
                      {item.city_slug && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 font-medium">
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
                      className="inline-flex items-center text-[11px] text-primary hover:underline gap-1 mt-0.5"
                    >
                      <span className="truncate max-w-[220px] font-medium">{item.source_name || "Kaynak Linki"}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        runDiscoveryAction(item.id, "news", () =>
                          importDiscoveryAsNews(item.id)
                        )
                      }
                      className="h-8 px-3 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      title="Kültür Haberi Yap"
                    >
                      {busy && pendingAction === "news" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Newspaper className="h-3.5 w-3.5" />
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
                      className="h-8 px-3 text-xs font-semibold gap-1.5"
                      title="Etkinlik Yap"
                    >
                      {busy && pendingAction === "event" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CalendarDays className="h-3.5 w-3.5" />
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
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Reddet"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Live Two-Column Stream (Son Haberler & Son Etkinlikler) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Son Kültür Haberleri */}
        <Card className="rounded-3xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Newspaper className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold">Son Kültür Haberleri</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold">
              <Link href="/yonetim/haberler">
                Tüm Haberler ({stats.newsTotal}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {stats.recentNews.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Henüz eklenen haber bulunmuyor.</p>
            ) : (
              stats.recentNews.map((news) => (
                <div
                  key={news.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {news.coverImage ? (
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        <img src={news.coverImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl border bg-muted/60 text-muted-foreground">
                        <Newspaper className="h-5 w-5 opacity-40" />
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
                        <span className="font-medium text-foreground/80">{news.cityName || "Genel"}</span>
                        <span>·</span>
                        <span>{formatDate(news.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={news.isPublished ? "default" : "secondary"} className="text-[10px]">
                      {news.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
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

        {/* Right: Son Etkinlikler & Festivaller */}
        <Card className="rounded-3xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <CalendarDays className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold">Son Kültür Etkinlikleri</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold">
              <Link href="/yonetim/etkinlikler">
                Tüm Etkinlikler ({stats.eventsTotal}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {stats.recentEvents.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Henüz kayıtlı etkinlik yok.</p>
            ) : (
              stats.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-3 hover:bg-muted/30 transition-colors"
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
                      <span className="capitalize font-medium text-foreground/80">{evt.eventType || "Etkinlik"}</span>
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
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-purple-600">
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

      {/* 6. Content Quality, 81 Cities Health & AdSense Readiness */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdSenseReadiness stats={readiness} />

        {/* 81 Cities Health & Editorial Gaps */}
        <Card className="rounded-3xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Globe className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold">81 İl İçerik &amp; Kalite Sağlığı</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold">
              <Link href="/yonetim/sehirler">
                İlleri Yönet <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/yonetim/mekanlar?gap=no-cover"
                className="rounded-2xl border p-3.5 transition-colors hover:bg-muted/50 bg-muted/10"
              >
                <p className="text-2xl font-extrabold text-foreground">
                  {gaps.placesWithoutCover.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fotoğrafı eksik mekan
                </p>
              </Link>
              <Link
                href="/yonetim/mekanlar?gap=thin"
                className="rounded-2xl border p-3.5 transition-colors hover:bg-muted/50 bg-muted/10"
              >
                <p className="text-2xl font-extrabold text-foreground">
                  {gaps.placesThinContent.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  İnce içerikli mekan (&lt;150 kelime)
                </p>
              </Link>
              <div className="rounded-2xl border p-3.5 bg-muted/10">
                <p className="text-2xl font-extrabold text-foreground">
                  {readiness.citiesWithoutGuide}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rehberi olmayan il
                </p>
              </div>
              <div className="rounded-2xl border p-3.5 bg-muted/10">
                <p className="text-2xl font-extrabold text-foreground">
                  {gaps.citiesWithoutCover}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kapaksız il
                </p>
              </div>
            </div>

            {readiness.missingGuideCities.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1 text-xs">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Öncelikli Rehber Yazılacak İller:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {readiness.missingGuideCities.join(", ")}
                  {readiness.citiesWithoutGuide > 12 ? "…" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global AI Image Modal */}
      <AiImageModal
        isOpen={isAiImageModalOpen}
        onClose={() => setIsAiImageModalOpen(false)}
        onSelectImage={(url) => {
          navigator.clipboard.writeText(url).then(() => {
            toast.success("Görsel URL bağlantısı panoya kopyalandı! İstediğiniz içerikte kullanabilirsiniz. 📋");
          });
        }}
      />
    </div>
  );
}
