"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, CheckCircle2, Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { AiImageModal } from "@/components/admin/ai-image-modal";

type CoverImageInputProps = {
  value: string;
  onChange: (newUrl: string) => void;
  folder: "news" | "events" | "articles" | "places" | "uploads";
  slugHint?: string;
  label?: string;
  name?: string;
  onOpenAiModal?: () => void;
};

function checkIsStoredWebp(url: string): boolean {
  if (!url) return false;
  const isSupabase =
    url.includes("/storage/v1/object/public/media") ||
    url.includes("/storage/v1/object/authenticated/media");
  return isSupabase && /\.webp(\?|$)/i.test(url);
}

export function CoverImageInput({
  value,
  onChange,
  folder,
  slugHint = "kapak",
  label = "Kapak Görseli URL",
  name = "cover_image",
  onOpenAiModal,
}: CoverImageInputProps) {
  const [transferring, setTransferring] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<number>(0);
  const [isInternalAiModalOpen, setIsInternalAiModalOpen] = useState(false);

  const trimmed = (value || "").trim();
  const isExternalOrNonWebp =
    trimmed.startsWith("http") && !checkIsStoredWebp(trimmed);
  const isStoredWebp = checkIsStoredWebp(trimmed);
  const storedFileName = isStoredWebp
    ? trimmed.split("?")[0].split("/").pop() || "webp"
    : null;

  async function handleTransferUrl() {
    if (!trimmed) {
      toast.error("Önce bir görsel URL'si girin.");
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: trimmed,
          folder,
          slugHint: slugHint || "kapak",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Görsel sunucuya aktarılamadı.");
      }

      onChange(data.url);
      setPreviewVersion(Date.now());
      toast.success("Görsel başlık slug'ına göre WebP formatında (EXIF temiz) sunucuya aktarıldı!");
    } catch (err) {
      toast.error(
        "Sunucuya aktarılamadı",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setTransferring(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("slugHint", slugHint || file.name.replace(/\.[^.]+$/, ""));

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Dosya yüklenemedi.");
      }

      onChange(data.url);
      setPreviewVersion(Date.now());
      toast.success("Dosya başlık slug'ına göre WebP formatında (EXIF temiz) yüklendi!");
    } catch (err) {
      toast.error(
        "Görsel yüklenemedi",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={name} className="text-xs font-semibold">
            {label}
          </Label>
          {isStoredWebp && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[10px] font-semibold gap-1 px-2 py-0.5 max-w-[260px] truncate"
              title={storedFileName || undefined}
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="truncate">WebP ({storedFileName})</span>
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onOpenAiModal) onOpenAiModal();
              else setIsInternalAiModalOpen(true);
            }}
            className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
            title="Yapay zeka ile bu konuya uygun görsel üret (Flux)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            AI Görsel
          </Button>

          <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
            {uploadingFile ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>Dosya Seç</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingFile}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          id={name}
          name={name}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (Dış bağlantı yapıştırıp 'Sunucuya Aktar'a tıklayın)"
          className="h-9 text-xs flex-1"
        />
        <Button
          type="button"
          variant={isExternalOrNonWebp ? "default" : "secondary"}
          size="sm"
          disabled={!trimmed || transferring}
          onClick={handleTransferUrl}
          className="h-9 shrink-0 gap-1.5 text-xs font-semibold"
          title="Görseli indirir, EXIF bilgilerini temizler, WebP formatına çevirip Supabase sunucusuna kaydeder"
        >
          {transferring ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Aktarılıyor...
            </>
          ) : (
            <>
              <CloudUpload className="h-3.5 w-3.5" />
              Sunucuya Aktar (WebP)
            </>
          )}
        </Button>
      </div>

      {trimmed && (
        <div className="relative aspect-video max-w-sm overflow-hidden rounded-xl border bg-muted/30">
          <img
            src={
              previewVersion
                ? `${trimmed}${trimmed.includes("?") ? "&" : "?"}v=${previewVersion}`
                : trimmed
            }
            alt="Kapak görseli önizleme"
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {!onOpenAiModal && (
        <AiImageModal
          isOpen={isInternalAiModalOpen}
          onClose={() => setIsInternalAiModalOpen(false)}
          onSelectImage={(newUrl) => {
            onChange(newUrl);
            setPreviewVersion(Date.now());
          }}
          initialTitle={slugHint?.replace(/[-_]/g, " ")}
        />
      )}
    </div>
  );
}
