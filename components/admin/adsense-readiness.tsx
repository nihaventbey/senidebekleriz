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
      label: "İndekslenebilir mekanların kapak görseli",
      passed: stats.indexablePlacesWithoutCover === 0,
      detail:
        stats.indexablePlacesWithoutCover === 0
          ? "Tamam"
          : `${stats.indexablePlacesWithoutCover} mekan kapaksız`,
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
      passed: true,
      detail: "Aktif",
    },
    {
      label: "Gizlilik politikası",
      passed: stats.hasPrivacyPage,
      detail: stats.hasPrivacyPage ? "Yayında" : "Eksik",
      href: "/yonetim/sayfalar",
    },
    {
      label: "Sitemap (ince mekanlar hariç)",
      passed: true,
      detail: `${stats.indexablePlaces} mekan + blog`,
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
          <p className="mt-4 text-xs text-muted-foreground">
            Önce özgün blog yazıları ve premium mekan açıklamaları üretin.
            İnce OSM/Wikipedia sayfaları otomatik noindex&apos;lenir.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
