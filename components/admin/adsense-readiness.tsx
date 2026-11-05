import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { ContentReadinessStats } from "@/lib/data/admin-stats";

type Props = {
  stats: ContentReadinessStats;
  newsPublished?: number;
  eventsPublished?: number;
};

type CheckItem = {
  label: string;
  passed: boolean;
  detail: string;
  href?: string;
};

export function AdSenseReadiness({
  stats,
  newsPublished = 0,
  eventsPublished = 0,
}: Props) {
  const checks: CheckItem[] = [
    {
      label: "En az 30 yayında kültür & gezi rehberi",
      passed: stats.publishedArticles >= 30,
      detail: `${stats.publishedArticles} / 30 yazı yayında`,
      href: "/yonetim/yazilar",
    },
    {
      label: "Güncel kültür & sanat haber akışı",
      passed: newsPublished >= 10,
      detail: `${newsPublished} haber yayında`,
      href: "/yonetim/haberler",
    },
    {
      label: "Canlı şehir etkinlik ajandası",
      passed: eventsPublished >= 20,
      detail: `${eventsPublished} aktif etkinlik`,
      href: "/yonetim/etkinlikler",
    },
    {
      label: "81 İl Şehir Rehberi kapsamı",
      passed: stats.citiesWithGuide >= 30,
      detail: `${stats.citiesWithGuide} / 81 il rehberi hazır`,
      href: "/yonetim/yazilar/yeni",
    },
    {
      label: "Çerez aydınlatma ve onay bildirimi",
      passed: stats.hasCookieConsent,
      detail: stats.hasCookieConsent ? "Aktif" : "Eksik",
    },
    {
      label: "Gizlilik politikası sayfası",
      passed: stats.hasPrivacyPage,
      detail: stats.hasPrivacyPage ? "Yayında" : "Eksik",
      href: "/yonetim/sayfalar",
    },
    {
      label: "Hakkımızda ve künye sayfası",
      passed: stats.hasAboutPage,
      detail: stats.hasAboutPage ? "Yayında" : "Eksik",
      href: "/yonetim/sayfalar",
    },
    {
      label: "Reklam doğrulama dosyası (ads.txt)",
      passed: stats.hasAdsTxt,
      detail: stats.hasAdsTxt ? "Tanımlı" : "Eksik",
    },
    {
      label: "Temiz site haritası ve yapısal veri",
      passed: stats.sitemapExcludesThinPlaces,
      detail: "Haber, etkinlik ve rehber şemaları aktif",
    },
    {
      label: "Google Arama Konsolu doğrulaması",
      passed: stats.hasSiteVerification,
      detail: stats.hasSiteVerification
        ? "Search Console doğrulaması aktif"
        : "Site doğrulama kodu bekleniyor",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const percentage = Math.round((passedCount / checks.length) * 100);
  const ready = percentage >= 80;

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Yayın &amp; Reklam Uygunluk Durumu
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Arama motoru ve reklam onay kriterleri ({passedCount} / {checks.length} tamamlandı)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right">
            <span className="text-lg font-extrabold text-foreground">%{percentage}</span>
          </div>
          <Badge
            variant={ready ? "default" : "secondary"}
            className={ready ? "bg-emerald-600 text-white text-xs font-semibold" : "text-xs"}
          >
            {ready ? "🚀 Başvuruya Uygun" : "⏳ Geliştiriliyor"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              ready
                ? "bg-emerald-500"
                : percentage > 50
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {checks.map((check) => (
            <div
              key={check.label}
              className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 text-xs transition-colors ${
                check.passed
                  ? "border-emerald-500/20 bg-emerald-500/5 text-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                {check.passed ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{check.label}</p>
                  <p className="text-[11px] text-muted-foreground">{check.detail}</p>
                </div>
              </div>

              {check.href && !check.passed && (
                <Link
                  href={check.href}
                  className="shrink-0 font-medium text-primary hover:underline inline-flex items-center gap-0.5 text-[11px]"
                >
                  Tamamla <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
