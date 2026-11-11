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
  CheckSquare,
  Square,
  Trash2,
  Star,
} from "lucide-react";
import {
  approveEvent,
  rejectEvent,
  unpublishEvent,
  toggleFeaturedEvent,
  bulkFeaturedEvents,
  bulkUpdateEventsStatus,
  bulkDeleteEvents,
} from "@/lib/actions/events";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  function handleToggleFeatured(id: string, current: boolean) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await toggleFeaturedEvent(id, !current);
        toast.success(
          !current
            ? "Etkinlik Vitrin slider'ına eklendi 🔥"
            : "Etkinlik Vitrinden çıkarıldı"
        );
        router.refresh();
      } catch (error) {
        toast.error(
          "Vitrin durumu güncellenemedi",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleBulkFeatured(featured: boolean) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkFeaturedEvents(ids, featured);
        toast.success(
          featured
            ? `${ids.length} etkinlik Vitrin slider'ına eklendi 🔥`
            : `${ids.length} etkinlik Vitrinden çıkarıldı`
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (error) {
        toast.error(
          "Toplu vitrin işlemi başarısız",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  const isAllSelected =
    filteredEvents.length > 0 &&
    filteredEvents.every((e) => selectedIds.has(e.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkStatus(status: "published" | "pending_review" | "rejected") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkUpdateEventsStatus(ids, status);
        toast.success(
          status === "published"
            ? `${ids.length} etkinlik yayına alındı ✅`
            : status === "pending_review"
            ? `${ids.length} etkinlik taslağa alındı ⏸️`
            : `${ids.length} etkinlik reddedildi`
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (error) {
        toast.error(
          "Toplu işlem başarısız",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Seçili ${ids.length} etkinliği kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await bulkDeleteEvents(ids);
        toast.success(`${ids.length} etkinlik silindi 🗑️`);
        setSelectedIds(new Set());
        router.refresh();
      } catch (error) {
        toast.error(
          "Toplu silme başarısız",
          error instanceof Error ? error.message : undefined
        );
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

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.size} etkinlik seçildi
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkStatus("published")}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              Onayla &amp; Yayınla
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkStatus("pending_review")}
              className="h-7 text-xs gap-1"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Taslağa Al
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkFeatured(true)}
              className="h-7 text-xs gap-1 text-amber-600 border-amber-300"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              Vitrine Ekle (Slider)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkStatus("rejected")}
              className="h-7 text-xs gap-1 text-destructive border-destructive/30"
            >
              <X className="h-3.5 w-3.5" />
              Reddet
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={handleBulkDelete}
              className="h-7 text-xs gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs"
            >
              Seçimi Kaldır
            </Button>
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-muted-foreground text-sm">
          {filter === "pending_review"
            ? "Onay bekleyen etkinlik bulunmuyor."
            : "Arama kriterine uygun etkinlik bulunamadı."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="w-full min-w-[820px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[44px] text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title={isAllSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[9%]">Afiş</TableHead>
                <TableHead className="w-[33%]">Başlık & Kaynak</TableHead>
                <TableHead className="w-[11%]">Kategori</TableHead>
                <TableHead className="w-[12%]">Şehir</TableHead>
                <TableHead className="w-[14%]">Tarih</TableHead>
                <TableHead className="w-[16%] text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => {
                const busy = isPending && pendingId === event.id;
                const isSelected = selectedIds.has(event.id);
                const typeColor = TYPE_COLORS[event.event_type] || TYPE_COLORS.diger;
                const cityName = getCityName(event.city_slug) || event.city_slug;

                return (
                  <TableRow key={event.id} className={isSelected ? "bg-primary/5" : undefined}>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(event.id)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
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
                      <div className="flex items-center gap-1.5 max-w-[320px]" title={event.title}>
                        <Link
                          href={`/etkinlik/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary flex items-center gap-1.5 min-w-0"
                        >
                          <span className="truncate">{event.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </Link>
                        {event.is_featured && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] bg-amber-500/10 text-amber-600 border-amber-300"
                          >
                            🔥 Vitrin
                          </Badge>
                        )}
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
                      <div className="flex justify-end items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                          title={event.is_featured ? "Vitrinden çıkar" : "Vitrin slider'ına ekle"}
                          className={`h-7 w-7 p-0 ${
                            event.is_featured
                              ? "text-amber-500"
                              : "text-muted-foreground hover:text-amber-500"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </Button>
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
                          <Link href={`/yonetim/etkinlikler/${event.slug}/duzenle`} prefetch={false}>
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
