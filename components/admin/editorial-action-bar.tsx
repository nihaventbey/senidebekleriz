"use client";

import Link from "next/link";
import { ArrowLeft, Check, Eye, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EditorialActionBarProps = {
  backHref: string;
  backLabel: string;
  publicHref?: string;
  isPublished: boolean;
  isEdit: boolean;
  isFeatured?: boolean;
  savePending: boolean;
  deletePending: boolean;
  hasDelete: boolean;
  statusAnnouncement?: string;
  draftLabel?: string;
  onSaveDraft: () => void;
  onSavePublish: () => void;
  onDelete?: () => void;
};

/**
 * Sticky top action bar shared by News and Event editorial forms.
 */
export function EditorialActionBar({
  backHref,
  backLabel,
  publicHref,
  isPublished,
  isEdit,
  isFeatured,
  savePending,
  deletePending,
  hasDelete,
  statusAnnouncement,
  draftLabel = "Taslak (Sitede Görünmez)",
  onSaveDraft,
  onSavePublish,
  onDelete,
}: EditorialActionBarProps) {
  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" asChild className="gap-1.5 text-xs">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isPublished
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isPublished ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {isPublished ? "Durum: Yayında" : `Durum: ${draftLabel}`}
        </span>

        {isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
            🔥 Vitrin
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {publicHref && isPublished && (
          <Button type="button" variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link href={publicHref} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3.5 w-3.5" />
              Sitede Gör
            </Link>
          </Button>
        )}

        {hasDelete && onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deletePending || savePending}
            onClick={onDelete}
            className="gap-1.5 text-xs"
          >
            {deletePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Sil
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={savePending || deletePending}
          onClick={onSaveDraft}
          className="gap-1.5 text-xs font-semibold"
          title="İçeriği sitede yayınlamadan taslak olarak kaydeder"
        >
          {savePending && !isPublished ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          📝 Taslak Kaydet
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={savePending || deletePending}
          onClick={onSavePublish}
          className="gap-1.5 bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
        >
          {savePending && isPublished ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              {isPublished && isEdit ? "Güncelle (Yayında)" : "🚀 Kaydet ve Yayına Al"}
            </>
          )}
        </Button>
      </div>

      {statusAnnouncement ? (
        <span role="status" aria-live="polite" className="sr-only">
          {statusAnnouncement}
        </span>
      ) : null}
    </div>
  );
}
