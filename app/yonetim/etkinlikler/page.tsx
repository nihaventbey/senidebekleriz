import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminEvents, countPendingEvents } from "@/lib/data/admin-events";
import { getArtistCardSettings } from "@/lib/data/site-settings";
import { EventsList } from "@/components/admin/events-list";
import { EventUrlImport } from "@/components/admin/event-url-import";
import { TicketingSyncButton } from "@/components/admin/ticketing-sync-button";
import { Globe2, Plus, Settings2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Etkinlikler",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ durum?: string }>;
};

export default async function AdminEventsPage({ searchParams }: Props) {
  const { durum } = await searchParams;
  const status =
    durum === "published" ||
    durum === "pending_review" ||
    durum === "rejected" ||
    durum === "expired"
      ? durum
      : undefined;

  const [events, allEvents, pendingCount, artistCardSettings] = await Promise.all([
    getAdminEvents(status),
    status ? getAdminEvents(undefined) : Promise.resolve(null),
    countPendingEvents(),
    getArtistCardSettings(),
  ]);

  const countSource = allEvents ?? events;
  const totalCount = countSource.length;
  const publishedCount = countSource.filter((e) => e.status === "published").length;
  const rejectedCount = countSource.filter((e) => e.status === "rejected").length;
  const expiredCount = countSource.filter((e) => e.status === "expired").length;

  const filters = [
    { key: undefined, label: `Tümü (${totalCount})` },
    { key: "pending_review", label: `⏳ Onay Bekleyen (${pendingCount})` },
    { key: "published", label: `✅ Yayında (${publishedCount})` },
    { key: "rejected", label: `✕ Reddedilen (${rejectedCount})` },
    ...(expiredCount > 0
      ? [{ key: "expired" as const, label: `⌛ Süresi Dolan (${expiredCount})` }]
      : []),
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kültür Etkinlikleri</h1>
          <p className="text-muted-foreground">
            RSS ve URL kaynaklarından gelen etkinlikleri onaylayın.
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} onay bekliyor
              </Badge>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TicketingSyncButton />
          <Button asChild>
            <Link href="/yonetim/etkinlikler/yeni">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Etkinlik
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-foreground">
          <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>
            Sanatçı &amp; Topluluk Bilgi Kartları:{" "}
            <strong className={artistCardSettings.showArtistInfoCards ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
              {artistCardSettings.showArtistInfoCards ? "Sitede Gösteriliyor" : "Site Genelinde Gizli"}
            </strong>
          </span>
        </div>
        <Link
          href="/yonetim/gorunum#bilgi-kartlari"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          Görünüm Ayarını Değiştir
        </Link>
      </div>

      <EventUrlImport />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.label}
            variant={status === f.key || (!status && !f.key) ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={
                f.key
                  ? `/yonetim/etkinlikler?durum=${f.key}`
                  : "/yonetim/etkinlikler"
              }
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <EventsList events={events} filter={status} />
    </div>
  );
}
