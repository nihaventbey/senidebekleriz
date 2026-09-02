"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
  Check,
  X,
  Wand2,
  Sliders,
} from "lucide-react";
import { toast } from "@/lib/toast";

type AiImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialTitle?: string;
  initialCity?: string;
  initialCategory?: string;
  titlePlaceholder?: string;
};

const STYLES = [
  { value: "photo", label: "📸 Gerçekçi Belgesel Fotoğrafı" },
  { value: "cinematic", label: "🎬 Sinematik Altın Saat Işığı" },
  { value: "historic", label: "🏛️ Tarihi & Arkeolojik Miras" },
  { value: "digital_art", label: "🎨 Kültür-Sanat Afişi / İllüstrasyon" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Geniş Ekran (Haber & Manşet Kapak)" },
  { value: "4:3", label: "4:3 Standart (Mekan & Galeri)" },
  { value: "1:1", label: "1:1 Kare (Sosyal & Kart)" },
];

export function AiImageModal({
  isOpen,
  onClose,
  onSelectImage,
  initialTitle = "",
  initialCity = "",
  initialCategory = "",
  titlePlaceholder = "Örn: Göbeklitepe'de yeni bulunan heykeller veya Aspendos Tiyatrosu konseri",
}: AiImageModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [customPrompt, setCustomPrompt] = useState("");
  const [style, setStyle] = useState("photo");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleGenerate() {
    if (!title.trim() && !customPrompt.trim()) {
      toast.error("Lütfen bir haber/etkinlik başlığı veya görsel konusu girin");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            prompt: customPrompt.trim(),
            style,
            aspectRatio,
            cityName: initialCity,
            category: initialCategory,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Görsel üretilemedi");

        setGeneratedUrl(data.imageUrl);
        setRefinedPrompt(data.refinedPrompt || data.prompt);
        toast.success("AI görseli başarıyla üretildi! ✨");
      } catch (err: any) {
        toast.error("Hata", err.message || "Görsel üretilirken sorun oluştu");
      }
    });
  }

  function handleConfirm() {
    if (!generatedUrl) return;
    onSelectImage(generatedUrl);
    toast.success("Görsel forma eklendi! Kaydedildiğinde otomatik olarak depolanacaktır. 🖼️");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">AI ile Kültür & Sanat Görseli Üret</h2>
              <p className="text-xs text-muted-foreground">
                Haber veya etkinliğinize özel, telifsiz ve yüksek çözünürlüklü görsel oluşturun.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title / Topic */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-img-title" className="text-xs font-semibold">
              Haber / Etkinlik / Konu Başlığı *
            </Label>
            <Input
              id="ai-img-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className="h-9 text-xs"
            />
          </div>

          {/* Options Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ai-img-style" className="text-xs font-semibold">
                Görsel Tarzı
              </Label>
              <Select value={style} onValueChange={(v) => v && setStyle(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tarz seçin" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-img-ratio" className="text-xs font-semibold">
                En-Boy Oranı
              </Label>
              <Select value={aspectRatio} onValueChange={(v) => v && setAspectRatio(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Oran seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Prompt Details */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-img-prompt" className="text-xs font-semibold flex items-center justify-between">
              <span>Özel İpuçları / Sahne Detayları (Opsiyonel)</span>
              <span className="text-[10px] text-muted-foreground font-normal">Boş bırakırsanız AI başlıktan kurgular</span>
            </Label>
            <Textarea
              id="ai-img-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Örn: Gün batımında antik sütunlar, drone çekimi, çevrede kazı ekibi ve arkeologlar..."
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Action Trigger Button */}
          <div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || (!title.trim() && !customPrompt.trim())}
              className="w-full h-10 text-xs font-semibold gap-2 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Yapay Zeka Görseli Oluşturuyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  {generatedUrl ? "Görseli Yeniden Üret (Farklı Varyasyon)" : "Görseli Oluştur"}
                </>
              )}
            </Button>
          </div>

          {/* Result Preview Area */}
          {generatedUrl && (
            <div className="rounded-xl border border-primary/30 bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" /> Üretilen Görsel Önizlemesi
                </span>
                <span className="text-[10px] text-muted-foreground">HD 1200px Kalite</span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black/40">
                <img
                  src={generatedUrl}
                  alt="AI Generated Preview"
                  className="h-full w-full object-cover"
                />
              </div>

              {refinedPrompt && (
                <p className="text-[11px] text-muted-foreground italic line-clamp-2" title={refinedPrompt}>
                  Prompt: {refinedPrompt}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/40">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Vazgeç
          </Button>

          <div className="flex items-center gap-2">
            {generatedUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isPending}
                className="text-xs gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Farklı Üret
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              disabled={!generatedUrl || isPending}
              onClick={handleConfirm}
              className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3.5 w-3.5" /> Bu Görseli Kullan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
