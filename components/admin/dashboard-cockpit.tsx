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
  Zap,
  Camera,
  Bot,
  Layers,
} from "lucide-react";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { UniversalUrlImportModal } from "@/components/admin/universal-url-import-modal";
import { SocialMediaStudioModal } from "@/components/admin/social-media-studio-modal";
import { DiscoverySyncButton } from "@/components/admin/discovery-sync-button";
import { AdSenseReadiness } from "@/components/admin/adsense-readiness";
import type { AdminDashboardStats, ContentReadinessStats } from "@/lib/data/admin-stats";
import type { ContentGaps } from "@/lib/data/content-gaps";
import type { AdminDiscoveryListItem } from "@/lib/data/admin-discovery";
import {
  importDiscoveryAsNews,
  importDiscoveryAsEvent,
  importDiscoveryAsArticle,
  disaggregateDiscoveryBulletin,
  rejectDiscovery,
} from "@/lib/actions/discovery";
import { triggerAutopilotAction } from "@/lib/actions/autopilot";
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
  const [isUniversalImportModalOpen, setIsUniversalImportModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [quickAiUrl, setQuickAiUrl] = useState("");

  // Discovery triage state
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isTriagePending, startTriageTransition] = useTransition();
  const [isAutopilotRunning, startAutopilotTransition] = useTransition();
  const [isQuickImportPending, startQuickImportTransition] = useTransition();

  function handleRunAutopilot() {
    startAutopilotTransition(async () => {
      try {
        const res = await triggerAutopilotAction();
        if (res.eventsPublished > 0 || res.newsPublished > 0) {
          toast.success(
            `Oto-Pilot tamamlandı: ${res.eventsPublished} etkinlik, ${res.newsPublished} haber yayınlandı! 🚀`
          );
        } else {
          toast.info("Oto-Pilot kontrolü tamamlandı", res.details.join(" • "));
        }
        router.refresh();
      } catch (err: any) {
        toast.error("Oto-pilot çalıştırma hatası", err.message);
      }
    });
  }

  // Daily quote selection based on day of month
  const todayQuote = useMemo(() => {
    const day = new Date().getDate();
    return DAILY_QUOTES[day % DAILY_QUOTES.length];
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const todayDateStr = useMemo(() => getTodayFormatted(), []);

  function runDiscoveryAction(
    id: string,
    action: "news" | "event" | "article" | "reject" | "multi",
    fn: () => Promise<any>
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
        if (action === "multi") {
          const count = result?.extractedCount || 0;
          toast.success(`Bültenden ${count} adet bağımsız etkinlik ayrıştırıldı! 🎭`);
          router.push("/yonetim/etkinlikler?durum=pending_review");
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

    startQuickImportTransition(async () => {
      try {
        const res = await fetch("/api/admin/universal-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: quickAiUrl.trim(),
            targetType: "auto",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "İçerik çekilemedi");
        }

        const typeLabels: Record<string, string> = {
          news: "Kültür Haberi",
          event: "Etkinlik",
          article: "Gezi Rehberi",
        };

        const typeName = typeLabels[data.type] || "İçerik";
        toast.success(`${typeName} taslağı başarıyla oluşturuldu! ✨`, `"${data.title}" sayfasına yönlendiriliyorsunuz.`);
        setQuickAiUrl("");
        router.push(data.editUrl);
      } catch (err: any) {
        toast.error("İçe aktarma hatası", err.message || "İçerik çekilemedi");
      }
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
      {/* 1. Yönetim Üst Başlık ve Hızlı İşlem Çubuğu */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {todayDateStr}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Hazır
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {greeting}, Editör
            </h1>
          </div>

          {/* Hızlı İşlem Butonları */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Yeni İçerik Ekleme */}
            <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-1 border border-border/50">
              <Button
                asChild
                size="sm"
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Link href="/yonetim/haberler/yeni">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Haber</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              >
                <Link href="/yonetim/etkinlikler/yeni">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Etkinlik</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Link href="/yonetim/yazilar/yeni">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Rehber</span>
                </Link>
              </Button>
            </div>

            {/* Otomasyon & Tarama */}
            <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-1 border border-border/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isAutopilotRunning}
                onClick={handleRunAutopilot}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-background shadow-xs"
                title="Keşif kuyruğundaki onaylı taslakları otomatik yayınla"
              >
                {isAutopilotRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>Oto-Pilot</span>
              </Button>

              <DiscoverySyncButton />
            </div>
          </div>
        </div>

        {/* Bağlantıdan Otomatik Taslak Oluşturucu */}
        <div className="mt-4 pt-4 border-t border-border/60">
          <form onSubmit={handleQuickAiSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Bağlantıdan İçerik Üret:</span>
            </div>
            <div className="relative flex-1 w-full">
              <Input
                type="url"
                placeholder="Kültür Bakanlığı, haber sitesi, belediye bülteni veya etkinlik bağlantısı yapıştırın (https://...)"
                value={quickAiUrl}
                onChange={(e) => setQuickAiUrl(e.target.value)}
                className="h-9 text-xs pl-3 pr-8 bg-background/80"
              />
              {quickAiUrl && (
                <button
                  type="button"
                  onClick={() => setQuickAiUrl("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              variant="default"
              disabled={isQuickImportPending}
              className="h-9 text-xs font-semibold gap-1.5 w-full sm:w-auto shrink-0 shadow-xs"
            >
              {isQuickImportPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span>{isQuickImportPending ? "Hazırlanıyor..." : "Taslak Oluştur"}</span>
            </Button>
          </form>
        </div>
      </section>

      {/* 2. Temel İçerik Özeti Kartları */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {/* Kart 1: Kültür Haberleri */}
        <Link
          href="/yonetim/haberler"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:shadow-sm hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kültür Haberleri</span>
            <Newspaper className="h-4 w-4 text-blue-500 opacity-80 group-hover:scale-105 transition-transform" />
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

        {/* Kart 2: Etkinlikler */}
        <Link
          href="/yonetim/etkinlikler"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:shadow-sm hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Etkinlik Ajandası</span>
            <CalendarDays className="h-4 w-4 text-purple-500 opacity-80 group-hover:scale-105 transition-transform" />
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

        {/* Kart 3: Keşif Kuyruğu */}
        <Link
          href="/yonetim/kesif"
          className={`group rounded-2xl border p-4 transition-all hover:shadow-sm ${
            stats.pendingDiscoveries > 0
              ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
              : "border-border/70 bg-card hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Keşif Kuyruğu</span>
            <Compass className="h-4 w-4 text-amber-500 opacity-80 group-hover:scale-105 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.pendingDiscoveries.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.pendingDiscoveries > 0 ? `${stats.pendingDiscoveries} onay bekliyor` : "Kuyruk temiz"}
          </p>
        </Link>

        {/* Kart 4: Gezi Rehberleri */}
        <Link
          href="/yonetim/yazilar"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:shadow-sm hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Rehber &amp; Yazılar</span>
            <BookOpen className="h-4 w-4 text-indigo-500 opacity-80 group-hover:scale-105 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.articles.toLocaleString("tr-TR")}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.publishedArticles} yayında ({readiness.citiesWithGuide}/81 il)
          </div>
        </Link>

        {/* Kart 5: 81 İl Kültür Ajandası */}
        <Link
          href="/yonetim/sehirler"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:shadow-sm hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">81 İl Portalları</span>
            <Building2 className="h-4 w-4 text-emerald-500 opacity-80 group-hover:scale-105 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.cities.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold truncate">
            81 il aktif · {stats.places.toLocaleString("tr-TR")} mekan
          </p>
        </Link>

        {/* Kart 6: 81 İl Kapsama KPI (Etkinliksiz İller) */}
        <div
          className={`group rounded-2xl border p-4 transition-all ${
            stats.citiesWithoutActivity > 0
              ? "border-rose-500/40 bg-rose-500/5"
              : "border-emerald-500/40 bg-emerald-500/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">İl Kapsama KPI</span>
            <Globe className="h-4 w-4 text-rose-500 opacity-80" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {stats.citiesWithActivity} <span className="text-xs font-normal text-muted-foreground">/ 81</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 font-semibold truncate">
              {stats.citiesWithoutActivity} ilde etkinlik yok
            </span>
          </div>
        </div>
      </div>

      {/* 4. Live Discovery Queue & Quick Triage Stream */}
      <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                İçerik Keşif Kuyruğu
                {stats.pendingDiscoveries > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                    {stats.pendingDiscoveries} onay bekliyor
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Kültür portalları, ajanslar ve bültenlerden taranan maddeleri tek tıkla habere dönüştürün, etkinliğe ekleyin veya bülten ise alt etkinliklerine ayrıştırın.
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
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                      {item.content_type === "event" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            runDiscoveryAction(item.id, "event", () =>
                              importDiscoveryAsEvent(item.id)
                            )
                          }
                          className="h-8 px-3 text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                          title="Etkinlik Olarak Aktar"
                        >
                          {busy && pendingAction === "event" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CalendarDays className="h-3.5 w-3.5" />
                          )}
                          <span>Etkinlik Yap</span>
                        </Button>
                      ) : item.content_type === "article" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            runDiscoveryAction(item.id, "article", () =>
                              importDiscoveryAsArticle(item.id)
                            )
                          }
                          className="h-8 px-3 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          title="Gezi Rehberi Olarak Aktar"
                        >
                          {busy && pendingAction === "article" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                          <span>Rehber Yap</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            runDiscoveryAction(item.id, "news", () =>
                              importDiscoveryAsNews(item.id)
                            )
                          }
                          className="h-8 px-3 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          title="Kültür Haberi Yap"
                        >
                          {busy && pendingAction === "news" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Newspaper className="h-3.5 w-3.5" />
                          )}
                          <span>Haber Yap</span>
                        </Button>
                      )}

                      {/* Alternatif Olarak Ekle */}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          item.content_type === "event"
                            ? runDiscoveryAction(item.id, "news", () =>
                                importDiscoveryAsNews(item.id)
                              )
                            : runDiscoveryAction(item.id, "event", () =>
                                importDiscoveryAsEvent(item.id)
                              )
                        }
                        className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                        title={item.content_type === "event" ? "Haber Yap" : "Etkinlik Yap"}
                      >
                        {item.content_type === "event" ? "Haber Yap" : "Etkinlik Yap"}
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
                        title="Reddet / Listeden Kaldır"
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

      {/* 6. Yayın Uygunluğu & 81 İl Özeti */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdSenseReadiness
          stats={readiness}
          newsPublished={stats.newsPublished}
          eventsPublished={stats.eventsPublished}
        />

        {/* 81 İl İçerik & Kapsama KPI */}
        <Card className="rounded-3xl border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">81 İl Kültür Kapsama KPI</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Türkiye genelinde kültürel ajandası ve haberi eksik kalan illerin canlı takibi.
                </p>
              </div>
            </div>
            <DiscoverySyncButton />
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-3.5 bg-emerald-500/5 border-emerald-500/30">
                <p className="text-2xl font-extrabold text-foreground">
                  {stats.citiesWithActivity}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Aktif ajandası olan il
                </p>
              </div>
              <div className="rounded-2xl border p-3.5 bg-rose-500/5 border-rose-500/30">
                <p className="text-2xl font-extrabold text-foreground">
                  {stats.citiesWithoutActivity}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  İçerik bekleyen il
                </p>
              </div>
              <Link
                href="/yonetim/yazilar"
                className="rounded-2xl border p-3.5 transition-colors hover:bg-muted/50 bg-muted/10"
              >
                <p className="text-2xl font-extrabold text-foreground">
                  {readiness.citiesWithGuide}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gezi rehberi hazır il
                </p>
              </Link>
              <Link
                href="/yonetim/mekanlar"
                className="rounded-2xl border p-3.5 transition-colors hover:bg-muted/50 bg-muted/10"
              >
                <p className="text-2xl font-extrabold text-foreground">
                  {stats.places.toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Müze ve antik mekan
                </p>
              </Link>
            </div>

            {stats.missingActivityCityNames.length > 0 && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Etkinlik/Haber Bekleyen Öncelikli İller ({stats.citiesWithoutActivity}):
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {stats.missingActivityCityNames.slice(0, 16).join(", ")}
                  {stats.missingActivityCityNames.length > 16 ? "…" : ""}
                </p>
                <p className="text-[11px] text-muted-foreground/80 pt-1 border-t border-rose-200 dark:border-rose-900/50">
                  Yukarıdaki &quot;Şimdi Tara &amp; Keşfet&quot; butonu; 81 ilin valilik, belediye ve yerel basın akışlarını AI filtresinden geçirerek eksik illeri otomatik besler.
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

      {/* Universal URL Importer */}
      <UniversalUrlImportModal
        isOpen={isUniversalImportModalOpen}
        onClose={() => setIsUniversalImportModalOpen(false)}
        defaultTarget="auto"
        title="Kokpit Hızlı URL Çekici"
      />

      {/* Social Media & Instagram Studio Modal */}
      <SocialMediaStudioModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
      />
    </div>
  );
}
