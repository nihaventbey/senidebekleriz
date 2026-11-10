"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CloudUpload,
  CheckCircle2,
  Loader2,
  Upload,
  Sparkles,
  Move,
  RotateCcw,
  Crosshair,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import {
  parseCoverImage,
  formatCoverImageUrl,
  DEFAULT_FOCAL_X,
  DEFAULT_FOCAL_Y,
} from "@/lib/media/cover-position";

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
  const clean = url.split("#")[0];
  const isSupabase =
    clean.includes("/storage/v1/object/public/media") ||
    clean.includes("/storage/v1/object/authenticated/media");
  return isSupabase && /\.webp(\?|$)/i.test(clean);
}

const FOCAL_PRESETS = [
  { label: "⬆️ Üst (Kafa Payı)", x: 50, y: 10 },
  { label: "👤 Portre İdeal", x: 50, y: 22 },
  { label: "🎯 Tam Merkez", x: 50, y: 50 },
  { label: "⬇️ Alt Odak", x: 50, y: 80 },
] as const;

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
  const [previewRatio, setPreviewRatio] = useState<"16/9" | "21/9">("16/9");
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const parsed = parseCoverImage(value);
  const trimmed = parsed.src;
  const isExternalOrNonWebp =
    trimmed.startsWith("http") && !checkIsStoredWebp(trimmed);
  const isStoredWebp = checkIsStoredWebp(trimmed);
  const storedFileName = isStoredWebp
    ? trimmed.split("?")[0].split("/").pop() || "webp"
    : null;

  function updateFocalPoint(nextX: number, nextY: number) {
    if (!trimmed) return;
    const encoded = formatCoverImageUrl(trimmed, nextX, nextY, true);
    onChange(encoded);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!trimmed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: parsed.x,
      startY: parsed.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragStartRef.current || !previewContainerRef.current) {
      return;
    }
    const rect = previewContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Dragging image down reveals top (decreases Y%); dragging right reveals left (decreases X%)
    const deltaXPercent = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;

    const nextX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startX - deltaXPercent)));
    const nextY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startY - deltaYPercent)));
    updateFocalPoint(nextX, nextY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already lost
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }

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

      const nextUrl = parsed.hasCustomPosition
        ? formatCoverImageUrl(data.url, parsed.x, parsed.y, true)
        : data.url;
      onChange(nextUrl);
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

  const previewSrc =
    trimmed && previewVersion
      ? `${trimmed}${trimmed.includes("?") ? "&" : "?"}v=${previewVersion}`
      : trimmed;

  return (
    <div className="space-y-3">
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

      {/* Hidden input carries full value including #pos=X,Y for native FormData */}
      <input type="hidden" name={name} value={value} />

      <div className="flex gap-2">
        <Input
          id={name}
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
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span>Kadraj &amp; Kafa Payı Konumlandırma</span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                X: {parsed.x}% · Y: {parsed.y}%
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewRatio("16/9")}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  previewRatio === "16/9"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Kart (16:9)
              </button>
              <button
                type="button"
                onClick={() => setPreviewRatio("21/9")}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  previewRatio === "21/9"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Detay Hero (21:9)
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-12 items-center">
            {/* Interactive Drag-to-Pan Frame */}
            <div className="md:col-span-7">
              <div
                ref={previewContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  aspectRatio: previewRatio === "21/9" ? "21 / 9" : "16 / 9",
                }}
                className={`group relative w-full overflow-hidden rounded-xl border border-border bg-black/40 select-none touch-none ${
                  isDragging ? "cursor-grabbing ring-2 ring-primary" : "cursor-grab"
                }`}
                title="Fotoğrafı basılı tutup sürükleyerek yukarı/aşağı veya sağa/sola kaydırabilirsiniz"
              >
                <img
                  src={previewSrc}
                  alt="Kapak görseli kadraj önizleme"
                  draggable={false}
                  style={{ objectPosition: parsed.objectPosition }}
                  className="h-full w-full object-cover pointer-events-none select-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Rule of thirds guide grid */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-0 group-hover:opacity-60 transition-opacity">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-white/25" />
                  <div className="border-r border-white/25" />
                  <div />
                </div>

                {/* Focal point crosshair marker */}
                <div
                  style={{ left: `${parsed.x}%`, top: `${parsed.y}%` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-white shadow-md ring-2 ring-white/90 transition-transform"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </div>

                <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white/90">
                  ✋ Fareyle sürükleyerek kaydırın
                </div>
              </div>
            </div>

            {/* Sliders & Quick Presets */}
            <div className="md:col-span-5 space-y-3">
              {/* Y Axis Slider (Primary for head clipping) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">
                    Dikey Hizalama (Y — Üst/Alt):
                  </span>
                  <span className="font-mono text-muted-foreground">{parsed.y}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={parsed.y}
                  onChange={(e) => updateFocalPoint(parsed.x, Number(e.target.value))}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0% (En Üst / Kafa)</span>
                  <span>50% (Orta)</span>
                  <span>100% (En Alt)</span>
                </div>
              </div>

              {/* X Axis Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">
                    Yatay Hizalama (X — Sol/Sağ):
                  </span>
                  <span className="font-mono text-muted-foreground">{parsed.x}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={parsed.x}
                  onChange={(e) => updateFocalPoint(Number(e.target.value), parsed.y)}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0% (Sol)</span>
                  <span>50% (Merkez)</span>
                  <span>100% (Sağ)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Hızlı Kadraj:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FOCAL_PRESETS.map((preset) => {
                    const active = parsed.x === preset.x && parsed.y === preset.y;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateFocalPoint(preset.x, preset.y)}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${
                          active
                            ? "border-primary bg-primary/15 text-primary shadow-2xs"
                            : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  {parsed.hasCustomPosition && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(
                          formatCoverImageUrl(
                            trimmed,
                            DEFAULT_FOCAL_X,
                            DEFAULT_FOCAL_Y,
                            false
                          )
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      title="Varsayılan portre kadrajına sıfırla"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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
