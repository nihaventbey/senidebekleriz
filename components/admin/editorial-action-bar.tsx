"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  FilePenLine,
  Flame,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type EditorialActionBarProps = {
  heading?: string;
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
 * Sticky top action bar shared by News, Event, and Guide editorial forms.
 * Positioned directly beneath the 56px (`h-14`) admin layout header.
 */
export function EditorialActionBar({
  heading,
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
  draftLabel = "Taslak",
  onSaveDraft,
  onSavePublish,
  onDelete,
}: EditorialActionBarProps) {
  return (
    <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-1.5 text-xs"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </Button>

        {heading ? (
          <h1 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
            {heading}
          </h1>
        ) : null}

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isPublished
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPublished ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {isPublished ? "Yayında" : draftLabel}
        </span>

        {isFeatured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
            <Flame className="h-3 w-3" aria-hidden="true" />
            Vitrin
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {publicHref && isPublished ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            className="h-9 gap-1.5 text-xs"
          >
            <Link href={publicHref} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sitede Gör</span>
            </Link>
          </Button>
        ) : null}

        {hasDelete && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deletePending || savePending}
            onClick={onDelete}
            className="h-9 gap-1.5 text-xs"
          >
            {deletePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Sil</span>
          </Button>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={savePending || deletePending}
          onClick={onSaveDraft}
          className="h-9 gap-1.5 text-xs font-semibold"
          title="İçeriği sitede yayınlamadan taslak olarak kaydeder"
        >
          {savePending && !isPublished ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Taslak Kaydet</span>
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={savePending || deletePending}
          onClick={onSavePublish}
          className="h-9 gap-1.5 bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
        >
          {savePending && isPublished ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isPublished && isEdit ? "Güncelle" : "Kaydet ve Yayınla"}
              </span>
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
