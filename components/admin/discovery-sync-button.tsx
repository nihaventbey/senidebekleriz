"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

export function DiscoverySyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/discovery/sync", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Keşif sync başarısız");
        }

        toast.success(
          "Keşif taraması tamamlandı",
          `${data.itemsInserted} yeni, ${data.itemsSkipped} atlandı`
        );
        router.refresh();
      } catch (error) {
        toast.error(
          "Keşif sync başarısız",
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
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Şimdi Tara
    </Button>
  );
}
