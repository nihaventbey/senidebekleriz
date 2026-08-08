"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { updateBrandSettings } from "@/lib/actions/site-settings";
import type { BrandSettings } from "@/lib/settings/branding";
import { toast } from "@/lib/toast";

type AssetFieldProps = {
  title: string;
  description: string;
  previewUrl: string | null;
  fileName: string;
  urlName: string;
  clearName: string;
  accept: string;
  previewClassName?: string;
};

function BrandAssetField({
  title,
  description,
  previewUrl,
  fileName,
  urlName,
  clearName,
  accept,
  previewClassName = "max-h-24 max-w-full object-contain",
}: AssetFieldProps) {
  const [clear, setClear] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <input type="hidden" name={clearName} value={clear ? "true" : "false"} />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {previewUrl && !clear ? (
        <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
          <img
            src={previewUrl}
            alt=""
            className={previewClassName}
          />
          <p className="text-xs text-muted-foreground break-all">{previewUrl}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Henüz yüklenmedi veya kaldırıldı.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor={fileName}>Dosya yükle</Label>
        <Input
          id={fileName}
          name={fileName}
          type="file"
          accept={accept}
          onChange={() => setClear(false)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={urlName}>veya URL</Label>
        <Input
          id={urlName}
          name={urlName}
          type="url"
          placeholder="https://..."
          defaultValue={previewUrl ?? ""}
          onChange={() => setClear(false)}
        />
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={clearName}
            checked={clear}
            onCheckedChange={(checked) => setClear(checked === true)}
          />
          <Label htmlFor={clearName} className="cursor-pointer text-sm text-destructive font-medium">
            Mevcut görseli tamamen kaldır
          </Label>
        </div>
      ) : null}
    </div>
  );
}

export function BrandingSettingsForm({ settings }: { settings: BrandSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateBrandSettings(formData);
      if (result.error) {
        toast.error("Kaydedilemedi", result.error);
        return;
      }
      toast.success("Kaydedildi", result.success);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BrandAssetField
        title="Site logosu"
        description="Header ve footer'da görünür. PNG, SVG veya WebP önerilir; yatay logo için şeffaf arka plan tercih edin."
        previewUrl={settings.logoUrl}
        fileName="logoFile"
        urlName="logoUrl"
        clearName="clearLogo"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        previewClassName="max-h-14 max-w-[220px] object-contain"
      />

      <BrandAssetField
        title="Favicon"
        description="Sekme ikonu. 32×32 veya 48×48 PNG/ICO/SVG yükleyin."
        previewUrl={settings.faviconUrl}
        fileName="faviconFile"
        urlName="faviconUrl"
        clearName="clearFavicon"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
        previewClassName="h-10 w-10 object-contain"
      />

      <BrandAssetField
        title="Apple Touch Icon"
        description="iOS ana ekrana ekleme ikonu. 180×180 PNG önerilir."
        previewUrl={settings.appleTouchIconUrl}
        fileName="appleTouchIconFile"
        urlName="appleTouchIconUrl"
        clearName="clearAppleTouchIcon"
        accept="image/png,image/jpeg,image/webp"
        previewClassName="h-16 w-16 object-contain rounded-xl"
      />

      <BrandAssetField
        title="Sosyal paylaşım görseli (OG)"
        description="Link paylaşıldığında görünen kapak. 1200×630 PNG veya WebP önerilir."
        previewUrl={settings.ogImageUrl}
        fileName="ogImageFile"
        urlName="ogImageUrl"
        clearName="clearOgImage"
        accept="image/png,image/jpeg,image/webp"
        previewClassName="max-h-32 w-full object-cover rounded-lg"
      />

      <Button type="submit" disabled={pending} size="lg">
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Marka görsellerini kaydet
      </Button>
    </form>
  );
}
