import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats, getContentReadinessStats } from "@/lib/data/admin-stats";
import { AdSenseReadiness } from "@/components/admin/adsense-readiness";
import {
  Building2,
  MapPinned,
  FileText,
  Tags,
  Star,
  ArrowRight,
  Plus,
  UserCog,
  BookOpen,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const statCards = [
  {
    key: "cities" as const,
    label: "Şehir",
    icon: Building2,
    accent: "from-violet-500/15 to-violet-500/5 text-violet-700",
  },
  {
    key: "places" as const,
    label: "Toplam Mekan",
    icon: MapPinned,
    accent: "from-blue-500/15 to-blue-500/5 text-blue-700",
  },
  {
    key: "activePlaces" as const,
    label: "Aktif Mekan",
    icon: Sparkles,
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-700",
  },
  {
    key: "featuredPlaces" as const,
    label: "Öne Çıkan",
    icon: Star,
    accent: "from-amber-500/15 to-amber-500/5 text-amber-700",
  },
  {
    key: "indexablePlaces" as const,
    label: "İndekslenebilir",
    icon: Sparkles,
    accent: "from-teal-500/15 to-teal-500/5 text-teal-700",
  },
  {
    key: "publishedArticles" as const,
    label: "Yayında Yazı",
    icon: BookOpen,
    accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-700",
  },
  {
    key: "pages" as const,
    label: "CMS Sayfa",
    icon: FileText,
    accent: "from-rose-500/15 to-rose-500/5 text-rose-700",
  },
  {
    key: "categories" as const,
    label: "Kategori",
    icon: Tags,
    accent: "from-cyan-500/15 to-cyan-500/5 text-cyan-700",
  },
];

const quickActions = [
  {
    href: "/yonetim/yazilar/yeni",
    label: "Yeni Blog Yazısı",
    icon: BookOpen,
  },
  {
    href: "/yonetim/mekanlar/yeni",
    label: "Yeni Mekan",
    icon: Plus,
  },
  {
    href: "/yonetim/sayfalar/yeni",
    label: "Yeni Sayfa",
    icon: FileText,
  },
  {
    href: "/yonetim/mekanlar",
    label: "Mekanları Yönet",
    icon: MapPinned,
  },
  {
    href: "/yonetim/hesap",
    label: "Hesap Ayarları",
    icon: UserCog,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const [stats, readiness] = await Promise.all([
    getAdminDashboardStats(),
    getContentReadinessStats(),
  ]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4">Yönetim Paneli</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Platform Özeti
          </h1>
          <p className="mt-3 text-muted-foreground md:text-lg">
            Türkiye genelindeki kültür ve gezi içeriğinizi buradan yönetin.
            Büyük listeler artık sayfa sayfa yüklenir.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key];
          return (
            <Card
              key={card.key}
              className={`border-0 bg-gradient-to-br ${card.accent} shadow-sm`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {value.toLocaleString("tr-TR")}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdSenseReadiness stats={readiness} />

        <Card>
          <CardHeader>
            <CardTitle>İçerik Boşlukları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Şehir rehberi eksik</p>
              <p className="text-muted-foreground">
                {readiness.citiesWithoutGuide} şehirde yayınlanmış rehber yok.
              </p>
              {readiness.missingGuideCities.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Öncelik: {readiness.missingGuideCities.join(", ")}
                  {readiness.citiesWithoutGuide > 12 ? "…" : ""}
                </p>
              )}
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href="/yonetim/yazilar/yeni">AI ile rehber oluştur</Link>
              </Button>
            </div>
            <div>
              <p className="font-medium">Premium mekan hedefi</p>
              <p className="text-muted-foreground">
                {readiness.indexablePlaces} / 200 indekslenebilir mekan (Manuel
                açıklama veya öne çıkan).
              </p>
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href="/yonetim/mekanlar">Mekanları düzenle</Link>
              </Button>
            </div>
            <div>
              <p className="font-medium">Editoryal iş akışı</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>Gemini ile taslak üret</li>
                <li>Kalite kontrol listesini tamamla</li>
                <li>Yayınla ve şehre bağla</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant="outline"
                  className="justify-start"
                  asChild
                >
                  <Link href={action.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Son Güncellenen Mekanlar</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/yonetim/mekanlar">
                Tümünü gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentPlaces.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Henüz mekan yok.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentPlaces.map((place) => (
                  <Link
                    key={place.slug}
                    href={`/yonetim/mekanlar/${place.slug}/duzenle`}
                    className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{place.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {place.cityName || "Şehir yok"} ·{" "}
                        {formatDate(place.updatedAt)}
                      </p>
                    </div>
                    {place.isFeatured && (
                      <Badge variant="secondary">Öne çıkan</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
