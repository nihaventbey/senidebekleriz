"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

type Props = {
  count?: number;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
};

export function CityDescriptionRefreshButton({
  count,
  variant = "outline",
  size = "default",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    const label =
      count != null
        ? `${count} valilik kaynaklı açıklama AI ile yenilenecek. Devam edilsin mi?`
        : "Valilik kaynaklı açıklamalar AI ile yenilenecek. Devam edilsin mi?";

    if (!window.confirm(label)) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/refresh-city-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "valilik" }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Güncelleme başarısız");
        }

        toast.success(
          "Açıklama güncelleme tamamlandı",
          `${data.updated} güncellendi, ${data.skipped} atlandı, ${data.failed} hata`
        );
        router.refresh();
      } catch (error) {
        toast.error(
          "Güncelleme başarısız",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isPending || count === 0}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Valilik açıklamalarını yenile
    </Button>
  );
}
