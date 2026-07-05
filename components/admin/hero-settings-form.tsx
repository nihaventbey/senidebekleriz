"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { updateHeroSettings } from "@/lib/actions/site-settings";
import type { HeroSettings } from "@/lib/settings/hero";
import { toast } from "@/lib/toast";

const EFFECT_OPTIONS = [
  { value: "pan", label: "Pan turu — görsel köşe köşe yavaşça gezinir" },
  { value: "zoom", label: "Yavaş zoom — usulca yakınlaşıp uzaklaşır" },
  { value: "parallax", label: "Parallax — sayfa kayarken görsel de kayar" },
  { value: "none", label: "Sabit — efekt yok" },
] as const;

export function HeroSettingsForm({ settings }: { settings: HeroSettings }) {
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [overlayOpacity, setOverlayOpacity] = useState(settings.overlayOpacity);
  const [blur, setBlur] = useState(settings.blur);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateHeroSettings(formData);
      if (result.error) {
        toast.error("Kaydedilemedi", result.error);
        return;
      }
      toast.success("Kaydedildi", result.success);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <Checkbox
          id="enabled"
          name="enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
        />
        <div>
          <Label htmlFor="enabled" className="font-semibold">
            Hero arka plan görselini etkinleştir
          </Label>
          <p className="text-sm text-muted-foreground">
            Kapalıyken ana sayfa varsayılan degrade arka planı kullanır.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Görsel</h2>

        {settings.imageUrl ? (
          <div className="overflow-hidden rounded-lg border">
            <img
              src={settings.imageUrl}
              alt="Mevcut hero arka planı"
              className="max-h-48 w-full object-cover"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz görsel seçilmedi.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="imageFile">Yeni görsel yükle (JPEG/PNG/WebP, max 5MB)</Label>
          <Input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">veya görsel URL&apos;si</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://..."
            defaultValue={settings.imageUrl ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Dosya yüklerseniz URL alanı yok sayılır; yüklenen dosya kullanılır.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Efekt</h2>
        <div className="space-y-2.5">
          {EFFECT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="effect"
                value={option.value}
                defaultChecked={settings.effect === option.value}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Okunabilirlik</h2>

        <div className="space-y-2">
          <Label>Kaplama tonu</Label>
          <div className="flex gap-2.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="overlayTone"
                value="light"
                defaultChecked={settings.overlayTone === "light"}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Açık — koyu yazılar korunur
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="overlayTone"
                value="dark"
                defaultChecked={settings.overlayTone === "dark"}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Koyu — yazılar beyaza döner
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="overlayOpacity">
            Kaplama yoğunluğu: %{overlayOpacity}
          </Label>
          <input
            id="overlayOpacity"
            name="overlayOpacity"
            type="range"
            min={0}
            max={90}
            step={5}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <p className="text-xs text-muted-foreground">
            Görselin üzerine binen ton; yazı okunabilirliği için %50+ önerilir.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blur">Bulanıklık: {blur}px</Label>
          <input
            id="blur"
            name="blur"
            type="range"
            min={0}
            max={12}
            step={1}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kaydet
      </Button>
    </form>
  );
}
