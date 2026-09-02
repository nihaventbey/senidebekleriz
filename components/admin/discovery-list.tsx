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
  Newspaper,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import {
  importDiscoveryAsArticle,
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
  rejectDiscovery,
  bulkRejectDiscovery,
  bulkDeleteDiscovery,
} from "@/lib/actions/discovery";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminDiscoveryListItem } from "@/lib/data/admin-discovery";
import { toast } from "@/lib/toast";

const TYPE_LABELS: Record<string, string> = {
  news: "📰 Haber",
  event: "🎭 Etkinlik",
  article: "🗺️ Gezi / Rehber",
  unknown: "Belirsiz",
};

type Props = {
  items: AdminDiscoveryListItem[];
  filter?: string;
};

export function DiscoveryList({ items, filter }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkReject() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} adet içeriği reddetmek istediğinize emin misiniz?`)) return;

    startTransition(async () => {
      try {
        await bulkRejectDiscovery(ids);
        toast.success(`${ids.length} adet keşif kaydı topluca reddedildi`);
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Toplu reddetme hatası", err.message);
      }
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} adet içeriği kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    startTransition(async () => {
      try {
        await bulkDeleteDiscovery(ids);
        toast.success(`${ids.length} adet keşif kaydı kalıcı olarak silindi 🗑️`);
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Toplu silme hatası", err.message);
      }
    });
  }

  function runAction(
    id: string,
    action: "news" | "event" | "article" | "reject",
    fn: () => Promise<{ slug: string } | void>
  ) {
    setPendingId(id);
    setPendingAction(action);
    startTransition(async () => {
      try {
        const result = await fn();
        if (action === "reject") {
          toast.success("Keşif kaydı reddedildi");
          router.refresh();
          return;
        }
        if (result && typeof result === "object" && "slug" in result) {
          const slug = (result as { slug: string }).slug;
          if (action === "news") {
            toast.success("Kültür haberi taslağı oluşturuldu! 📰");
            router.push(`/yonetim/haberler/${slug}/duzenle`);
          } else if (action === "article") {
            toast.success("Gezi rehberi taslağı oluşturuldu! 🗺️");
            router.push(`/yonetim/yazilar/${slug}/duzenle`);
          } else {
            toast.success("Etkinlik taslağı oluşturuldu! 🎭");
            router.push(`/yonetim/etkinlikler/${slug}/duzenle`);
          }
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
      <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
        <Sparkles className="h-10 w-10 mx-auto opacity-40 mb-2 text-primary" />
        <p className="text-sm font-medium">
          {filter === "pending_review"
            ? "Onay bekleyen keşif bulunmuyor. 'Şimdi Tara & Keşfet' butonunu kullanarak yeni içerik çekebilirsiniz."
            : "Henüz keşfedilen içerik yok."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar (When 1+ items selected) */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/30 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px]">
              {selectedIds.size}
            </span>
            <span>içerik seçildi</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleBulkReject}
              className="h-8 text-xs font-semibold text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Seçilenleri Reddet</span>
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleBulkDelete}
              className="h-8 text-xs font-bold gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Seçilenleri Sil ({selectedIds.size})</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 text-xs text-muted-foreground"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
        <Table className="w-full min-w-[880px] table-fixed">
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
              <TableHead className="w-[39%]">Başlık &amp; Özet</TableHead>
              <TableHead className="w-[11%]">Önerilen Tür</TableHead>
              <TableHead className="w-[11%]">Şehir</TableHead>
              <TableHead className="w-[12%]">Kaynak</TableHead>
              <TableHead className="w-[23%] text-right">AI İle İçe Aktar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const busy = isPending && pendingId === item.id;
              const isSelected = selectedIds.has(item.id);
              const formattedTitle =
                item.title.length > 85
                  ? `${item.title.slice(0, 85).trim()}...`
                  : item.title;
              const formattedSnippet =
                item.snippet && item.snippet.length > 120
                  ? `${item.snippet.slice(0, 120).trim()}...`
                  : item.snippet;

              return (
                <TableRow
                  key={item.id}
                  className={`hover:bg-muted/40 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <TableCell className="text-center py-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[380px] overflow-hidden py-3">
                    <div className="space-y-1">
                      <p
                        className="font-bold text-sm leading-snug line-clamp-2 break-words text-foreground"
                        title={item.title}
                      >
                        {formattedTitle}
                      </p>
                      {formattedSnippet && (
                        <p
                          className="line-clamp-2 text-xs text-muted-foreground break-words leading-relaxed"
                          title={item.snippet || undefined}
                        >
                          {formattedSnippet}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-medium whitespace-nowrap">
                      {TYPE_LABELS[item.content_type] || item.content_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium truncate block">
                      {getCityName(item.city_slug) || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:underline truncate max-w-[120px]"
                      title={item.source_name || item.source_url}
                    >
                      <span className="truncate">{item.source_name || "Kaynak"}</span>
                      <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {item.status === "pending_review" ? (
                      <div className="flex justify-end items-center gap-1.5">
                        {/* 1. News Button */}
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, "news", () =>
                              importDiscoveryAsNews(item.id)
                            )
                          }
                          className="h-7 px-2 text-[11px] font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          title="Kültür Haberi Olarak Taslağa Aktar"
                        >
                          {busy && pendingAction === "news" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Newspaper className="h-3 w-3" />
                          )}
                          <span>Haber</span>
                        </Button>

                        {/* 2. Event Button */}
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, "event", () =>
                              importDiscoveryAsEvent(item.id)
                            )
                          }
                          className="h-7 px-2 text-[11px] font-semibold gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                          title="Etkinlik Olarak Taslağa Aktar"
                        >
                          {busy && pendingAction === "event" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CalendarDays className="h-3 w-3" />
                          )}
                          <span>Etkinlik</span>
                        </Button>

                        {/* 3. Guide/Article Button */}
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, "article", () =>
                              importDiscoveryAsArticle(item.id)
                            )
                          }
                          className="h-7 px-2 text-[11px] font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          title="Gezi Rehberi Olarak Taslağa Aktar"
                        >
                          {busy && pendingAction === "article" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <BookOpen className="h-3 w-3" />
                          )}
                          <span>Rehber</span>
                        </Button>

                        {/* 4. Reject Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, "reject", () =>
                              rejectDiscovery(item.id)
                            )
                          }
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Reddet"
                        >
                          {busy && pendingAction === "reject" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ) : item.status === "imported" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        ✓ İçe Aktarıldı
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                        Reddedildi
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
