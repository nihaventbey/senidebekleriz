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
  CheckSquare,
  Square,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeftRight,
  ShieldCheck,
} from "lucide-react";
import {
  toggleAdPlacementActive,
  bulkToggleAdPlacements,
  toggleAllAdPlacements,
  invertAllAdPlacements,
  bulkDeleteAdPlacements,
  deleteAdPlacement,
} from "@/lib/actions/admin";
import type { AdminAdPlacementData } from "@/lib/data/admin";
import { toast } from "@/lib/toast";

type Props = {
  placements: AdminAdPlacementData[];
};

export function AdsList({ placements }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAllSelected =
    placements.length > 0 && selectedIds.size === placements.length;
  const activeCount = placements.filter((p) => p.is_active).length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(placements.map((p) => p.id)));
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

  function handleToggleSingle(id: string, currentActive: boolean) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await toggleAdPlacementActive(id, !currentActive);
        toast.success(
          !currentActive ? "Reklam alanı aktif edildi ✅" : "Reklam alanı pasife alındı ⏸️"
        );
        router.refresh();
      } catch (err: any) {
        toast.error("İşlem başarısız", err.message);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleToggleAll(isActive: boolean) {
    startTransition(async () => {
      try {
        await toggleAllAdPlacements(isActive);
        toast.success(
          isActive
            ? "Tüm reklam alanları aktif edildi ✅"
            : "Tüm reklam alanları pasife alındı ⏸️"
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Toplu işlem başarısız", err.message);
      }
    });
  }

  function handleInvertAll() {
    startTransition(async () => {
      try {
        await invertAllAdPlacements();
        toast.success("Reklam durumları tersine çevrildi: Aktifler kapatıldı, pasifler açıldı 🔄");
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("İşlem başarısız", err.message);
      }
    });
  }

  function handleBulkToggle(isActive: boolean) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await bulkToggleAdPlacements(ids, isActive);
        toast.success(
          isActive
            ? `${ids.length} reklam alanı aktif edildi ✅`
            : `${ids.length} reklam alanı pasife alındı ⏸️`
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Toplu işlem başarısız", err.message);
      }
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Seçili ${ids.length} reklam alanını silmek istediğinize emin misiniz?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await bulkDeleteAdPlacements(ids);
        toast.success(`${ids.length} reklam alanı silindi 🗑️`);
        setSelectedIds(new Set());
        router.refresh();
      } catch (err: any) {
        toast.error("Silme işlemi başarısız", err.message);
      }
    });
  }

  function handleDeleteSingle(id: string, name: string) {
    if (!confirm(`"${name}" reklam alanını silmek istediğinize emin misiniz?`)) {
      return;
    }
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteAdPlacement(id);
        toast.success("Reklam alanı silindi 🗑️");
        router.refresh();
      } catch (err: any) {
        toast.error("Silinemedi", err.message);
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* 1. Tek Tuşla Master Reklam Aç / Kapa Kartı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-foreground">Sistem Geneli Reklam Anahtarı</h2>
            <Badge
              variant={activeCount > 0 ? "default" : "secondary"}
              className={
                activeCount > 0
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-muted text-muted-foreground"
              }
            >
              {activeCount > 0 ? "● REKLAMLAR AÇIK" : "○ REKLAMLAR KAPALI (REKLAMSIZ MOD)"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Sitedeki tüm AdSense reklam alanlarını tek tıkla kapatabilir veya açabilirsiniz. Reklamlar kapalıyken sitede hiçbir boşluk veya reklam çerçevesi görünmez.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            size="default"
            disabled={isPending}
            onClick={() => handleToggleAll(activeCount === 0)}
            className={`font-bold text-xs sm:text-sm h-10 px-5 transition-all shadow-xs ${
              activeCount > 0
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : activeCount > 0 ? (
              <PowerOff className="mr-2 h-4 w-4" />
            ) : (
              <Power className="mr-2 h-4 w-4" />
            )}
            {activeCount > 0 ? "Tüm Reklamları Kapat" : "Tüm Reklamları Aç"}
          </Button>
        </div>
      </div>

      {/* 2. Toplu Kontrol ve Durum Çevirme Araç Çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Toplam {placements.length} reklam alanı
          </span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {activeCount} aktif
          </span>
          <span>•</span>
          <span>{placements.length - activeCount} pasif</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || activeCount === placements.length}
            onClick={() => handleToggleAll(true)}
            className="h-8 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
            title="Sitedeki tüm reklam alanlarını aktif duruma getirir"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            Tümünü Aktif Et
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || activeCount === 0}
            onClick={() => handleToggleAll(false)}
            className="h-8 text-xs font-semibold gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
            title="Sitedeki tüm reklam alanlarını pasif duruma getirir"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PowerOff className="h-3.5 w-3.5" />
            )}
            Tümünü Pasif Yap
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || placements.length === 0}
            onClick={handleInvertAll}
            className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
            title="Aktif olanları kapatır, pasif olanları açar"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowLeftRight className="h-3.5 w-3.5" />
            )}
            Aktifleri Kapat, Pasifleri Aç
          </Button>
        </div>
      </div>

      {/* Selected Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.size} reklam alanı seçildi
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkToggle(true)}
              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Power className="h-3.5 w-3.5" />
              Seçilenleri Aktif Et
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkToggle(false)}
              className="h-7 text-xs gap-1"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Seçilenleri Pasif Yap
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
              Seçilenleri Sil
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

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto shadow-xs">
        <Table>
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
              <TableHead>Ad</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>Slot ID</TableHead>
              <TableHead>Biçim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Henüz reklam alanı eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              placements.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const busy = isPending && pendingId === p.id;

                return (
                  <TableRow
                    key={p.id}
                    className={isSelected ? "bg-primary/5" : undefined}
                  >
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {p.position}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {p.ad_unit_id || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.ad_format || "auto"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleSingle(p.id, p.is_active)}
                        title={
                          p.is_active
                            ? "Pasif yapmak için tıklayın"
                            : "Aktif etmek için tıklayın"
                        }
                        className="cursor-pointer"
                      >
                        <Badge
                          variant={p.is_active ? "default" : "secondary"}
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                          {p.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleToggleSingle(p.id, p.is_active)}
                          className="h-7 px-2 text-xs"
                          title={p.is_active ? "Pasife Al" : "Aktif Et"}
                        >
                          {p.is_active ? (
                            <PowerOff className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <Power className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs gap-1">
                          <Link href={`/yonetim/reklamlar/${p.id}/duzenle`}>
                            <Pencil className="h-3 w-3" />
                            Düzenle
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDeleteSingle(p.id, p.name)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
