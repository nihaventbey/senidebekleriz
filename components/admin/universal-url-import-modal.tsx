"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link2,
  Loader2,
  Sparkles,
  Newspaper,
  CalendarDays,
  BookOpen,
  X,
  Send,
  Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";

type UniversalUrlImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: "auto" | "news" | "event" | "article";
  title?: string;
};

const TARGET_OPTIONS = [
  {
    id: "auto",
    label: "🪄 Otomatik Algıla (AI)",
    description: "Yapay zeka içeriği okuyup haber, etkinlik veya rehber olarak ayırır.",
  },
  {
    id: "news",
    label: "📰 Kültür Haberi",
    description: "Kazı buluşu, restorasyon, bakanlık duyurusu veya kültür haberi.",
  },
  {
    id: "event",
    label: "🎭 Etkinlik & Festival",
    description: "Tarihli konser, tiyatro, sergi veya festival duyurusu.",
  },
  {
    id: "article",
    label: "🗺️ Gezi Rehberi",
    description: "Şehir, antik kent, rota veya müze tanıtım makalesi.",
  },
];

export function UniversalUrlImportModal({
  isOpen,
  onClose,
  defaultTarget = "auto",
  title = "Tekil URL'den İçerik Çek & İçe Aktar",
}: UniversalUrlImportModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [targetType, setTargetType] = useState<string>(defaultTarget);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Lütfen geçerli bir web sitesi bağlantısı girin");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/universal-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            targetType,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "İçerik içe aktarılamadı");
        }

        const typeLabels: Record<string, string> = {
          news: "Kültür Haberi",
          event: "Etkinlik",
          article: "Gezi Rehberi",
        };

        const typeName = typeLabels[data.type] || "İçerik";
        toast.success(`${typeName} taslağı başarıyla oluşturuldu! ✨`);
        onClose();
        router.push(data.editUrl);
      } catch (err: any) {
        toast.error("İçe aktarma hatası", err.message || "İçerik çekilemedi");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">
                Bağlantıyı yapıştırın, yapay zeka metni ve görselleri çekip taslak oluştursun.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Hedef İçerik Türü</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTargetType(opt.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    targetType === opt.id
                      ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs ring-1 ring-primary/40"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <Label htmlFor="import-url" className="text-xs font-semibold">
              Kaynak Sayfa Bağlantısı (URL) *
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="import-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Örn: https://www.kulturportali.gov.tr/... veya haber linki"
                className="h-9 pl-9 text-xs"
                disabled={isPending}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              💡 Kültür Bakanlığı, AA, TRT, Biletix, Müze veya haber portallarından doğrudan link yapıştırabilirsiniz.
            </p>
          </div>

          {/* Action Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending || !url.trim()}
              className="w-full h-10 text-xs font-bold gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sayfa Okunuyor &amp; Yapay Zeka Taslağı Hazırlanıyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  İçeriği Çek &amp; Taslak Oluştur
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/40 text-xs text-muted-foreground">
          <span>Oluşturulan taslak doğrudan düzenleme formunda açılır.</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            Vazgeç
          </Button>
        </div>
      </div>
    </div>
  );
}
