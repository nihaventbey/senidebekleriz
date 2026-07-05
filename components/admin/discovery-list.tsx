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
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import {
  importDiscoveryAsArticle,
  importDiscoveryAsEvent,
  rejectDiscovery,
} from "@/lib/actions/discovery";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminDiscoveryListItem } from "@/lib/data/admin-discovery";
import { toast } from "@/lib/toast";

const TYPE_LABELS: Record<string, string> = {
  event: "Etkinlik",
  article: "Gezi / Yazı",
  unknown: "Belirsiz",
};

type Props = {
  items: AdminDiscoveryListItem[];
  filter?: string;
};

export function DiscoveryList({ items, filter }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    id: string,
    action: "event" | "article" | "reject",
    fn: () => Promise<void>
  ) {
    setPendingId(id);
    setPendingAction(action);
    startTransition(async () => {
      try {
        await fn();
        if (action === "reject") {
          toast.success("Keşif reddedildi");
          router.refresh();
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

  if (items.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        {filter === "pending_review"
          ? "Onay bekleyen keşif yok. Günlük tarama veya manuel sync deneyin."
          : "Henüz keşfedilen içerik yok."}
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
            <TableHead>Kaynak</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const busy = isPending && pendingId === item.id;

            return (
              <TableRow key={item.id}>
                <TableCell className="max-w-sm">
                  <span className="line-clamp-2 font-medium">{item.title}</span>
                  {item.snippet && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.snippet}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {TYPE_LABELS[item.content_type] || item.content_type}
                  </Badge>
                </TableCell>
                <TableCell>{getCityName(item.city_slug) || "—"}</TableCell>
                <TableCell>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    {item.source_name || "Kaynak"}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "pending_review" ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "event", () =>
                            importDiscoveryAsEvent(item.id)
                          )
                        }
                        title="Etkinlik olarak içe aktar"
                      >
                        {busy && pendingAction === "event" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarDays className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "article", () =>
                            importDiscoveryAsArticle(item.id)
                          )
                        }
                        title="Gezi rehberi / yazı olarak içe aktar"
                      >
                        {busy && pendingAction === "article" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "reject", () =>
                            rejectDiscovery(item.id)
                          )
                        }
                        title="Reddet"
                      >
                        {busy && pendingAction === "reject" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : item.status === "imported" ? (
                    <Badge variant="secondary">İçe aktarıldı</Badge>
                  ) : (
                    <Badge variant="outline">Reddedildi</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
