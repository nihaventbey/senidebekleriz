import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { ContentReadinessStats } from "@/lib/data/admin-stats";

type Props = {
  stats: ContentReadinessStats;
};

type CheckItem = {
  label: string;
  passed: boolean;
  detail: string;
  href?: string;
};

export function AdSenseReadiness({ stats }: Props) {
  const coverPassed =
    stats.indexablePlaces >= 200 && stats.indexablePlacesWithoutCover === 0;

  const checks: CheckItem[] = [
    {
      label: "En az 30 yayında blog yazısı",
      passed: stats.publishedArticles >= 30,
      detail: `${stats.publishedArticles} / 30`,
      href: "/yonetim/yazilar",
    },
    {
      label: "En az 200 indekslenebilir premium mekan",
      passed: stats.indexablePlaces >= 200,
      detail: `${stats.indexablePlaces} / 200`,
      href: "/yonetim/mekanlar",
    },
    {
      label: "Editöryal mekanların kapak görseli",
      passed: coverPassed,
      detail:
        stats.indexablePlacesWithoutCover > 0
          ? `${stats.indexablePlacesWithoutCover} mekan kapaksız`
          : stats.indexablePlaces === 0
            ? "Önce premium mekan üretin"
            : coverPassed
              ? "Tamam"
              : `${stats.indexablePlaces} / 200 (kapak tamam)`,
      href: "/yonetim/mekanlar?gap=no-cover",
    },
    {
      label: "Şehir rehberleri (81 il)",
      passed: stats.citiesWithGuide >= 81,
      detail: `${stats.citiesWithGuide} / 81 şehir`,
      href: "/yonetim/yazilar/yeni",
    },
    {
      label: "Çerez onay banner'ı",
      passed: stats.hasCookieConsent,
      detail: stats.hasCookieConsent ? "Aktif (kabul/red)" : "Eksik",
    },
    {
      label: "Gizlilik politikası",
      passed: stats.hasPrivacyPage,
      detail: stats.hasPrivacyPage ? "Yayında" : "Eksik",
      href: "/yonetim/sayfalar",
    },
    {
      label: "Hakkımızda sayfası",
      passed: stats.hasAboutPage,
      detail: stats.hasAboutPage ? "Yayında" : "Eksik",
      href: "/yonetim/sayfalar",
    },
    {
      label: "ads.txt dosyası",
      passed: stats.hasAdsTxt,
      detail: stats.hasAdsTxt ? "public/ads.txt" : "Eksik",
    },
    {
      label: "Sitemap ince mekanları hariç tutar",
      passed: stats.sitemapExcludesThinPlaces,
      detail: `${stats.indexablePlaces} premium mekan`,
    },
    {
      label: "Search Console doğrulama",
      passed: stats.hasSiteVerification,
      detail: stats.hasSiteVerification
        ? "Env tanımlı"
        : "GOOGLE_SITE_VERIFICATION ekleyin",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const ready = passedCount === checks.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AdSense Hazırlık</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {passedCount}/{checks.length} kriter tamamlandı
          </p>
        </div>
        <Badge variant={ready ? "default" : "secondary"}>
          {ready ? "Başvuruya yakın" : "Devam edin"}
        </Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{check.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({check.detail})
                  </span>
                </div>
                {check.href && !check.passed && (
                  <Link
                    href={check.href}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Tamamla
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!ready && (
          <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold">⚠️ AdSense Onay İpuçları:</p>
            <ul className="mt-1 space-y-1 list-disc pl-4 text-muted-foreground">
              <li>Özgün blog yazısı sayınızı en az 30&apos;a ve kaliteli mekan sayınızı en az 200&apos;e çıkarın.</li>
              <li>Google Search Console&apos;a kaydolun ve <code className="font-mono text-xs">sitemap.xml</code> gönderin.</li>
              <li>Google&apos;da <code className="font-mono text-xs">site:senidebekleriz.com</code> yazarak en az 30+ sayfanın indekslendiğini doğruladıktan sonra başvuru yapın.</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
