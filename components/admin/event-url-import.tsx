"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, ExternalLink } from "lucide-react";
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
        Kültür Yolu Festivali, Kültür Portalı, Biletinial, Biletix veya tiyatro/konser linki yapıştırın. AI etkinlik tarihi, mekanı ve görselini otomatik çıkarır.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="import-url" className="sr-only">
            Etkinlik URL
          </Label>
          <Input
            id="import-url"
            type="url"
            placeholder="https://kulturyolufestivali.com/... veya https://www.kulturportali.gov.tr/..."
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

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Önerilen Resmi Kaynaklar:</span>
        <a
          href="https://kulturyolufestivali.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-primary hover:underline font-medium"
        >
          🎭 Kültür Yolu Festivali (kulturyolufestivali.com)
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://www.kulturportali.gov.tr/etkinlikler"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-primary hover:underline font-medium"
        >
          🏛️ Kültür Portalı Etkinlikleri
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

