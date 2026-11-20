"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function TicketingSyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/events/sync-ticketing", {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Biletleme senkronizasyonu başarısız");
        }

        toast.success(
          "Dünyaca ünlü etkinlikler tarandı! 🌍",
          `${data.itemsInserted} yeni etkinlik (${data.artistCardsEnriched} bilgi kartı), ${data.itemsSkipped} atlandı.`
        );
        router.refresh();
      } catch (error) {
        toast.error(
          "Etkinlikler çekilemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSync}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
      )}
      {isPending
        ? "Biletleme Siteleri Taranıyor..."
        : "🌍 Dünyaca Ünlü Etkinlikleri Çek"}
    </Button>
  );
}
