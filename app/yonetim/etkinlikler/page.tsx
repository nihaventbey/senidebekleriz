import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminEvents, countPendingEvents } from "@/lib/data/admin-events";
import { EventsList } from "@/components/admin/events-list";
import { EventUrlImport } from "@/components/admin/event-url-import";
import { EventSyncButton } from "@/components/admin/event-sync-button";
import { Plus } from "lucide-react";

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

  const [events, pendingCount] = await Promise.all([
    getAdminEvents(status),
    countPendingEvents(),
  ]);

  const filters = [
    { key: undefined, label: "Tümü" },
    { key: "pending_review", label: "Onay Bekleyen" },
    { key: "published", label: "Yayında" },
    { key: "rejected", label: "Reddedilen" },
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
          <EventSyncButton />
          <Button asChild>
            <Link href="/yonetim/etkinlikler/yeni">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Etkinlik
            </Link>
          </Button>
        </div>
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
