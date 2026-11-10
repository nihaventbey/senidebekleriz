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
  ChevronDown,
} from "lucide-react";
import {
  importDiscoveryAsArticle,
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
  disaggregateDiscoveryBulletin,
  rejectDiscovery,
  bulkImportDiscovery,
  bulkRejectDiscovery,
  bulkDeleteDiscovery,
  deleteAllDiscoveredContentByFilter,
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
  typeFilter?: string;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export function DiscoveryList({
  items,
  filter = "pending_review",
  typeFilter,
  totalCount,
  totalPages,
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  function handleBulkImport(publish: boolean = false) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const confirmMsg = publish
      ? `${ids.length} adet içeriği yapay zeka ile üretip DOĞRUDAN YAYINA ALMAK istediğinize emin misiniz?`
      : `${ids.length} adet içeriği taslak olarak içe aktarmak istediğinize emin misiniz? (Daha sonra Haberler / Etkinlikler menüsünden inceleyip yayınlayabilirsiniz)`;
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        const res = await bulkImportDiscovery(ids, { publish });
        toast.success(
          publish
            ? `${res.count} adet içerik üretildi ve doğrudan yayına alındı! 🚀`
            : `${res.count} adet içerik taslak olarak aktarıldı! 📝 Haberler ve Etkinlikler menüsünden inceleyip yayınlayabilirsiniz.`
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Toplu içe aktarma hatası", err.message);
      }
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

  function handleClearAllInFilter() {
    const filterName =
      filter === "pending_review"
        ? "Onay Bekleyen"
        : filter === "imported"
        ? "İçe Aktarılan"
        : filter === "rejected"
        ? "Reddedilen"
        : "Bu filtredeki";

    if (
      !confirm(
        `DİKKAT: ${filterName} kategorisindeki TÜM (${totalCount}) içerik kalıcı olarak silinecek. Emin misiniz?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteAllDiscoveredContentByFilter(filter);
        toast.success(`${filterName} kategorisindeki tüm kayıtlar temizlendi! 🧹`);
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Temizleme hatası", err.message);
      }
    });
  }

  function getPageUrl(targetPage: number, targetLimit?: number) {
    const params = new URLSearchParams();
    if (filter) params.set("durum", filter);
    if (typeFilter) params.set("tip", typeFilter);
    params.set("sayfa", targetPage.toString());
    params.set("limit", (targetLimit || pageSize).toString());
    return `/yonetim/kesif?${params.toString()}`;
  }

  function runAction(
    id: string,
    action: "news" | "event" | "article" | "reject" | "multi",
    fn: () => Promise<any>
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
        if (action === "multi") {
          const count = result?.extractedCount || 0;
          if (count === 0) {
            toast.error("Etkinlik ayrıştırılamadı", "Metin içinden geçerli bir alt etkinlik çıkarılamadı.");
            return;
          }
          toast.success(`Bültenden ${count} adet bağımsız etkinlik ayrıştırıldı! 🎭`);
          router.push("/yonetim/etkinlikler?durum=pending_review");
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
      {/* Top Controls: Total Count, Page Size Selector, & Clear All Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            Toplam {totalCount.toLocaleString("tr-TR")} içerik
          </span>
          <span>·</span>
          <span>Sayfa {currentPage} / {totalPages}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Sayfa Başı:</span>
            {[25, 50, 100].map((l) => (
              <Button
                key={l}
                variant={pageSize === l ? "secondary" : "ghost"}
                size="sm"
                asChild
                className="h-7 px-2 text-xs"
              >
                <Link href={getPageUrl(1, l)}>{l}</Link>
              </Button>
            ))}
          </div>

          {totalCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleClearAllInFilter}
              className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 font-medium"
              title="Bu filtredeki tüm içerikleri kalıcı olarak sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bu Listeyi Temizle</span>
            </Button>
          )}
        </div>
      </div>

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
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkImport(true)}
              className="h-8 text-xs font-bold gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Seçilen içerikleri AI ile yazar ve doğrudan sitede yayınlar"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>🚀 Seçilenleri Üret &amp; Yayınla ({selectedIds.size})</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkImport(false)}
              className="h-8 text-xs font-semibold gap-1.5"
              title="Seçilen içerikleri AI ile yazar ama sitede yayınlamadan taslak olarak kaydeder"
            >
              <span>📝 Taslaklara Aktar ({selectedIds.size})</span>
            </Button>

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
        <Table className="w-full min-w-[1020px] table-fixed">
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
              <TableHead className="w-[45%]">Başlık &amp; Özet</TableHead>
              <TableHead className="w-[10%]">Önerilen Tür</TableHead>
              <TableHead className="w-[10%]">Şehir</TableHead>
              <TableHead className="w-[12%]">Kaynak</TableHead>
              <TableHead className="w-[180px] text-right">İşlem &amp; Aktar</TableHead>
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
                  <TableCell className="overflow-hidden py-3 pr-3">
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
                  <TableCell className="overflow-hidden pr-2">
                    <Badge variant="outline" className="text-[11px] font-medium whitespace-nowrap">
                      {TYPE_LABELS[item.content_type] || item.content_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="overflow-hidden pr-2">
                    <span className="text-xs text-muted-foreground font-medium truncate block">
                      {getCityName(item.city_slug) || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="overflow-hidden pr-3">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-primary hover:underline truncate max-w-full"
                      title={item.source_name || item.source_url}
                    >
                      <span className="truncate">{item.source_name || "Kaynak"}</span>
                      <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap pl-2">
                    {item.status === "pending_review" ? (() => {
                      const isEvent = item.content_type === "event";
                      const isArticle = item.content_type === "article";
                      const isBulletin = (item.content_type as string) === "bulletin";

                      const primaryConfig = isEvent
                        ? {
                            key: "event",
                            label: "Etkinlik",
                            icon: CalendarDays,
                            className: "bg-blue-600 hover:bg-blue-700 text-white",
                            fn: () => runAction(item.id, "event", () => importDiscoveryAsEvent(item.id)),
                          }
                        : isArticle
                        ? {
                            key: "article",
                            label: "Rehber",
                            icon: BookOpen,
                            className: "bg-emerald-600 hover:bg-emerald-700 text-white",
                            fn: () => runAction(item.id, "article", () => importDiscoveryAsArticle(item.id)),
                          }
                        : isBulletin
                        ? {
                            key: "multi",
                            label: "Ayrıştır",
                            icon: Layers,
                            className: "bg-purple-600 hover:bg-purple-700 text-white",
                            fn: () => runAction(item.id, "multi", () => disaggregateDiscoveryBulletin(item.id)),
                          }
                        : {
                            key: "news",
                            label: "Haber",
                            icon: Newspaper,
                            className: "bg-amber-600 hover:bg-amber-700 text-white",
                            fn: () => runAction(item.id, "news", () => importDiscoveryAsNews(item.id)),
                          };

                      const PrimaryIcon = primaryConfig.icon;
                      const isMenuOpen = openMenuId === item.id;

                      return (
                        <div className="relative inline-flex items-center justify-end gap-1">
                          {/* 1. Primary AI recommended action */}
                          <Button
                            size="sm"
                            variant="default"
                            disabled={busy}
                            onClick={primaryConfig.fn}
                            className={`h-7 px-2.5 text-[11px] font-semibold gap-1.5 shadow-xs ${primaryConfig.className}`}
                            title={`Önerilen: ${primaryConfig.label} olarak aktar`}
                          >
                            {busy && pendingAction === primaryConfig.key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <PrimaryIcon className="h-3 w-3" />
                            )}
                            <span>{primaryConfig.label}</span>
                          </Button>

                          {/* 2. Secondary Dropdown Trigger */}
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                              className="h-7 w-6 p-0 text-muted-foreground hover:text-foreground"
                              title="Farklı türe dönüştür"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border/80 bg-card p-1 shadow-lg text-left animate-in fade-in zoom-in-95">
                                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Farklı Türde Aktar:
                                  </p>
                                  {primaryConfig.key !== "news" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        runAction(item.id, "news", () => importDiscoveryAsNews(item.id));
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted font-medium"
                                    >
                                      <Newspaper className="h-3.5 w-3.5 text-amber-600" />
                                      <span>Haber Yap</span>
                                    </button>
                                  )}
                                  {primaryConfig.key !== "event" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        runAction(item.id, "event", () => importDiscoveryAsEvent(item.id));
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted font-medium"
                                    >
                                      <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                                      <span>Etkinlik Yap</span>
                                    </button>
                                  )}
                                  {primaryConfig.key !== "article" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        runAction(item.id, "article", () => importDiscoveryAsArticle(item.id));
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted font-medium"
                                    >
                                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Rehber Yap</span>
                                    </button>
                                  )}
                                  {primaryConfig.key !== "multi" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        runAction(item.id, "multi", () => disaggregateDiscoveryBulletin(item.id));
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted font-medium"
                                    >
                                      <Layers className="h-3.5 w-3.5 text-purple-600" />
                                      <span>Bülteni Ayrıştır</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* 3. Reject Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => runAction(item.id, "reject", () => rejectDiscovery(item.id))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Listeden Kaldır / Reddet"
                          >
                            {busy && pendingAction === "reject" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      );
                    })() : item.status === "imported" ? (
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs">
          <p className="text-muted-foreground">
            Sayfa <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages} (Toplam {totalCount.toLocaleString("tr-TR")} kayıt)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
              className="h-8 px-3 text-xs"
            >
              {currentPage > 1 ? (
                <Link href={getPageUrl(currentPage - 1)}>← Önceki</Link>
              ) : (
                <span>← Önceki</span>
              )}
            </Button>

            {/* Quick page numbers around current */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 2
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;

                  return (
                    <span key={p} className="flex items-center">
                      {hasGap && <span className="px-1 text-muted-foreground">…</span>}
                      <Button
                        variant={p === currentPage ? "default" : "outline"}
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 text-xs"
                      >
                        <Link href={getPageUrl(p)}>{p}</Link>
                      </Button>
                    </span>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
              className="h-8 px-3 text-xs"
            >
              {currentPage < totalPages ? (
                <Link href={getPageUrl(currentPage + 1)}>Sonraki →</Link>
              ) : (
                <span>Sonraki →</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
