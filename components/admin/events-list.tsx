"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  EyeOff,
  Loader2,
  Pencil,
  X,
  Search,
  ExternalLink,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import { approveEvent, rejectEvent, unpublishEvent } from "@/lib/actions/events";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminEventListItem } from "@/lib/data/admin-events";
import { toast } from "@/lib/toast";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Onay Bekliyor",
  published: "Yayında",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const TYPE_LABELS: Record<string, string> = {
  tiyatro: "Tiyatro",
  konser: "Konser",
  sergi: "Sergi",
  festival: "Festival",
  duyuru: "Duyuru",
  diger: "Kültür",
};

const TYPE_COLORS: Record<string, string> = {
  tiyatro: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200",
  konser: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200",
  sergi: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200",
  festival: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200",
  duyuru: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200",
  diger: "bg-slate-50 text-slate-700 border-slate-200",
};

function formatDate(iso: string | null) {
  if (!iso) return "Tarih Belirsiz";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  events: AdminEventListItem[];
  filter?: string;
};

export function EventsList({ events, filter }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    let list = events;

    if (selectedType !== "all") {
      list = list.filter((e) => e.event_type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.city_slug && e.city_slug.toLowerCase().includes(q)) ||
          (e.source_name && e.source_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [events, selectedType, searchQuery]);

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

  function handleUnpublish(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await unpublishEvent(id);
        toast.success("Etkinlik taslağa alındı");
        router.refresh();
      } catch (error) {
        toast.error(
          "Taslağa alınamadı",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search & Type Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {["all", "tiyatro", "konser", "sergi", "festival", "duyuru"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedType === type
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "Tüm Türler" : TYPE_LABELS[type] || type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Etkinlik veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 pl-8 text-xs"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-muted-foreground text-sm">
          {filter === "pending_review"
            ? "Onay bekleyen etkinlik bulunmuyor."
            : "Arama kriterine uygun etkinlik bulunamadı."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="w-full min-w-[780px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Afiş</TableHead>
                <TableHead className="w-[35%]">Başlık & Kaynak</TableHead>
                <TableHead className="w-[12%]">Kategori</TableHead>
                <TableHead className="w-[13%]">Şehir</TableHead>
                <TableHead className="w-[15%]">Tarih</TableHead>
                <TableHead className="w-[15%] text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => {
                const busy = isPending && pendingId === event.id;
                const typeColor = TYPE_COLORS[event.event_type] || TYPE_COLORS.diger;
                const cityName = getCityName(event.city_slug) || event.city_slug;

                return (
                  <TableRow key={event.id}>
                    {/* Poster */}
                    <TableCell>
                      {event.cover_image ? (
                        <div className="relative h-12 w-16 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={event.cover_image}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground">
                          <Calendar className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </TableCell>

                    {/* Title & Source */}
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[320px]" title={event.title}>
                        <Link
                          href={`/etkinlik/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary flex items-center gap-1.5"
                        >
                          <span className="truncate">{event.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </Link>
                      </div>
                      {event.source_name && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[280px]">
                          Kaynak: {event.source_name}
                        </p>
                      )}
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${typeColor}`}>
                        {TYPE_LABELS[event.event_type] || event.event_type}
                      </Badge>
                    </TableCell>

                    {/* City */}
                    <TableCell>
                      {cityName ? (
                        <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{cityName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.starts_at)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {event.status === "pending_review" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={busy}
                              onClick={() => handleApprove(event.id)}
                              title="Onayla ve Yayınla"
                              className="h-7 w-7 p-0"
                            >
                              {busy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleReject(event.id)}
                              title="Reddet"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {event.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleUnpublish(event.id)}
                            title="Taslağa al"
                            className="h-7 w-7 p-0"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild className="gap-1 h-7 px-2 text-xs">
                          <Link href={`/yonetim/etkinlikler/${event.slug}/duzenle`}>
                            <Pencil className="h-3 w-3 text-amber-600" />
                            <span>Düzenle</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
