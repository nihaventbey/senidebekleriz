"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { approveEvent, rejectEvent } from "@/lib/actions/events";
import type { AdminEventListItem } from "@/lib/data/admin-events";
import { toast } from "@/lib/toast";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Onay Bekliyor",
  published: "Yayında",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

type Props = {
  events: AdminEventListItem[];
  filter?: string;
};

export function EventsList({ events, filter }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await approveEvent(id);
        toast.success("Etkinlik yayınlandı");
        router.refresh();
      } catch (error) {
        toast.error(
          "Yayınlanamadı",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleReject(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await rejectEvent(id);
        toast.success("Etkinlik reddedildi");
        router.refresh();
      } catch (error) {
        toast.error(
          "Reddedilemedi",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        {filter === "pending_review"
          ? "Onay bekleyen etkinlik yok. RSS sync veya URL import deneyin."
          : "Henüz etkinlik yok."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Şehir</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="max-w-xs font-medium">
                <span className="line-clamp-2">{event.title}</span>
                {event.source_name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.source_name}
                  </p>
                )}
              </TableCell>
              <TableCell>{event.event_type}</TableCell>
              <TableCell>{event.city_slug || "—"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    event.status === "published"
                      ? "default"
                      : event.status === "pending_review"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {STATUS_LABELS[event.status] || event.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {event.status === "pending_review" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPending && pendingId === event.id}
                        onClick={() => handleApprove(event.id)}
                      >
                        {isPending && pendingId === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending && pendingId === event.id}
                        onClick={() => handleReject(event.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/yonetim/etkinlikler/${event.slug}/duzenle`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
