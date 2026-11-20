"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwitchControl } from "@/components/ui/switch-control";
import { updateArtistCardSettings } from "@/lib/actions/site-settings";
import type { ArtistCardSettings } from "@/lib/settings/artist-cards";
import { toast } from "@/lib/toast";

export function ArtistCardSettingsForm({
  settings,
  compact = false,
}: {
  settings: ArtistCardSettings;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showCards, setShowCards] = useState(settings.showArtistInfoCards);
  const [autoEnrich, setAutoEnrich] = useState(settings.autoEnrichOnImport);
  const [statusMessage, setStatusMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("showArtistInfoCards", showCards ? "true" : "false");
    formData.set("autoEnrichOnImport", autoEnrich ? "true" : "false");

    startTransition(async () => {
      const result = await updateArtistCardSettings(formData);
      if (result.error) {
        setStatusMessage(result.error);
        toast.error("Kaydedilemedi", result.error);
        return;
      }
      setStatusMessage(result.success || "Ayarlar kaydedildi.");
      toast.success("Kaydedildi", result.success);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="sr-only">Sanatçı ve topluluk bilgi kartı görünürlük ayarları</legend>

        <SwitchControl
          id="showArtistInfoCards"
          name="showArtistInfoCards"
          label="Sanatçı / Topluluk Bilgi Kartlarını Sitede Göster"
          description="Kapatıldığında tüm etkinlik sayfalarındaki sanatçı, orkestra ve koreograf bilgi kartları ziyaretçilere gizlenir (veriler korunur)."
          checked={showCards}
          onCheckedChange={setShowCards}
        />

        {!compact && (
          <SwitchControl
            id="autoEnrichOnImport"
            name="autoEnrichOnImport"
            label="Biletleme & AI İçe Aktarmada Resmi Siteyi Otomatik Tara"
            description="Yeni etkinlikler çekilirken veya AI ile taslak oluşturulurken sanatçı/orkestra resmi web sitesi ve kısa bilgi notu otomatik araştırılır."
            checked={autoEnrich}
            onCheckedChange={setAutoEnrich}
          />
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground"
        >
          {statusMessage}
        </span>

        <Button type="submit" disabled={pending} size={compact ? "sm" : "default"} className="gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          Ayarları Kaydet
        </Button>
      </div>
    </form>
  );
}
