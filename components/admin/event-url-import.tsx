"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "@/lib/toast";

export function EventUrlImport() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleImport() {
    if (!url.trim()) {
      toast.error("URL girin");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/events/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Import başarısız");
        }

        toast.success("URL kuyruğa eklendi", "Onay bekleyenler listesinde.");
        setUrl("");
        router.refresh();
      } catch (error) {
        toast.error(
          "Import başarısız",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h2 className="font-semibold">URL&apos;den İçe Aktar</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Biletinial, Devlet Tiyatro, Biletix vb. link yapıştırın. AI metadata
        çıkarır; scraping yapmaz, yalnızca sayfa özeti okunur.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="import-url" className="sr-only">
            Etkinlik URL
          </Label>
          <Input
            id="import-url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={handleImport}
          disabled={isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          İçe Aktar
        </Button>
      </div>
    </div>
  );
}
