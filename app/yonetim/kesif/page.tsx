import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  countPendingDiscoveries,
  getDiscoveredContent,
} from "@/lib/data/admin-discovery";
import { DiscoveryList } from "@/components/admin/discovery-list";
import { DiscoverySyncButton } from "@/components/admin/discovery-sync-button";
import type { DiscoveryContentType, DiscoveryStatus } from "@/lib/discovery/types";

export const metadata: Metadata = {
  title: "İçerik Keşfi",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ durum?: string; tip?: string }>;
};

export default async function AdminDiscoveryPage({ searchParams }: Props) {
  const { durum, tip } = await searchParams;

  const status: DiscoveryStatus | undefined =
    durum === "pending_review" ||
    durum === "imported" ||
    durum === "rejected"
      ? durum
      : "pending_review";

  const contentType: DiscoveryContentType | undefined =
    tip === "news" || tip === "event" || tip === "article" ? tip : undefined;

  const [items, pendingCount] = await Promise.all([
    getDiscoveredContent(status, contentType),
    countPendingDiscoveries(),
  ]);

  const statusFilters = [
    { key: "pending_review", label: "⏳ Onay Bekleyen" },
    { key: "imported", label: "✅ İçe Aktarılan" },
    { key: "rejected", label: "❌ Reddedilen" },
  ] as const;

  const typeFilters = [
    { key: undefined, label: "Tüm Tipler" },
    { key: "news", label: "📰 Kültür Haberleri" },
    { key: "event", label: "🎭 Etkinlikler" },
    { key: "article", label: "🗺️ Gezi & Rehber" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İçerik Keşfi</h1>
          <p className="text-muted-foreground">
            Google Haberler ve benzeri kaynaklardan günlük kültür-sanat taraması.
            Seçilen içerikler etkinlik veya gezi rehberi olarak düzenlenip
            onaylanır.
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} onay bekliyor
              </Badge>
            )}
          </p>
        </div>
        <DiscoverySyncButton />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Button
            key={f.key}
            variant={status === f.key ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={`/yonetim/kesif?durum=${f.key}${tip ? `&tip=${tip}` : ""}`}
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {typeFilters.map((f) => (
          <Button
            key={f.label}
            variant={
              (!tip && !f.key) || tip === f.key ? "default" : "outline"
            }
            size="sm"
            asChild
          >
            <Link
              href={
                f.key
                  ? `/yonetim/kesif?durum=${status}&tip=${f.key}`
                  : `/yonetim/kesif?durum=${status}`
              }
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DiscoveryList items={items} filter={status} />
    </div>
  );
}
