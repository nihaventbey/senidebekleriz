import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminEvents, countPendingEvents } from "@/lib/data/admin-events";
import { getArtistCardSettings } from "@/lib/data/site-settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventsList } from "@/components/admin/events-list";
import { EventImportModalButton } from "@/components/admin/event-import-modal-button";
import { TicketingSyncButton } from "@/components/admin/ticketing-sync-button";
import { Globe2, Plus } from "lucide-react";

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

  const statusLinks = [
    {
      key: "all",
      label: `Tümü (${totalCount})`,
      href: "/yonetim/etkinlikler",
      active: !status,
    },
    {
      key: "pending_review",
      label: `Onay Bekleyen (${pendingCount})`,
      href: "/yonetim/etkinlikler?durum=pending_review",
      active: status === "pending_review",
    },
    {
      key: "published",
      label: `Yayında (${publishedCount})`,
      href: "/yonetim/etkinlikler?durum=published",
      active: status === "published",
    },
    {
      key: "rejected",
      label: `Reddedilen (${rejectedCount})`,
      href: "/yonetim/etkinlikler?durum=rejected",
      active: status === "rejected",
    },
    ...(expiredCount > 0
      ? [
          {
            key: "expired",
            label: `Süresi Dolan (${expiredCount})`,
            href: "/yonetim/etkinlikler?durum=expired",
            active: status === "expired",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kültür Etkinlikleri"
        description="RSS, biletleme ve URL kaynaklarından gelen etkinlikleri yönetin."
        badge={
          pendingCount > 0 ? (
            <Badge variant="secondary" className="text-xs font-semibold">
              {pendingCount} onay bekliyor
            </Badge>
          ) : null
        }
        actions={
          <>
            <Link
              href="/yonetim/gorunum#bilgi-kartlari"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Sanatçı ve topluluk bilgi kartı genel ayarını değiştir"
            >
              <Globe2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Bilgi Kartları:</span>
              <strong
                className={
                  artistCardSettings.showArtistInfoCards
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {artistCardSettings.showArtistInfoCards ? "Açık" : "Gizli"}
              </strong>
            </Link>
            <TicketingSyncButton />
            <EventImportModalButton />
            <Button asChild size="sm" className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
              <Link href="/yonetim/etkinlikler/yeni">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Yeni Etkinlik</span>
              </Link>
            </Button>
          </>
        }
      />

      <EventsList events={events} filter={status} statusLinks={statusLinks} />
    </div>
  );
}
