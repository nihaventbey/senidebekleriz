"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Download,
  Copy,
  Sparkles,
  X,
  Layers,
  Image as ImageIcon,
  Check,
  Share2,
} from "lucide-react";
import { toast } from "@/lib/toast";

type SocialMediaStudioModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title?: string;
    summary?: string;
    badgeText?: string;
    imageUrl?: string;
    slug?: string;
  };
};

export function SocialMediaStudioModal({
  isOpen,
  onClose,
  initialData,
}: SocialMediaStudioModalProps) {
  const [title, setTitle] = useState(initialData?.title || "Kültür ve Sanat Dünyasından Yeni Bir Keşif");
  const [badgeText, setBadgeText] = useState(initialData?.badgeText || "🏛️ KÜLTÜREL MİRAS KEŞFİ");
  const [summary, setSummary] = useState(
    initialData?.summary || "Türkiye'nin bin yıllık mirasını ve kültürel rotalarını yakından keşfedin."
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl || "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80"
  );
  const [format, setFormat] = useState<"post" | "story">("post"); // post: 1080x1350, story: 1080x1920
  const [theme, setTheme] = useState<"amber" | "rose" | "indigo">("amber");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialData?.title) setTitle(initialData.title);
    if (initialData?.badgeText) setBadgeText(initialData.badgeText);
    if (initialData?.summary) setSummary(initialData.summary);
    if (initialData?.imageUrl) setImageUrl(initialData.imageUrl);
  }, [initialData]);

  if (!isOpen) return null;

  const themes = {
    amber: {
      gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.85) 60%, rgba(15,23,42,0.98) 100%)",
      accent: "#f59e0b",
      badgeBg: "rgba(245, 158, 11, 0.2)",
      badgeBorder: "rgba(245, 158, 11, 0.5)",
      badgeText: "#fbbf24",
    },
    rose: {
      gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(20,5,15,0.85) 60%, rgba(20,5,15,0.98) 100%)",
      accent: "#f43f5e",
      badgeBg: "rgba(244, 63, 94, 0.2)",
      badgeBorder: "rgba(244, 63, 94, 0.5)",
      badgeText: "#fda4af",
    },
    indigo: {
      gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(10,15,40,0.85) 60%, rgba(10,15,40,0.98) 100%)",
      accent: "#6366f1",
      badgeBg: "rgba(99, 102, 241, 0.2)",
      badgeBorder: "rgba(99, 102, 241, 0.5)",
      badgeText: "#a5b4fc",
    },
  };

  const currentTheme = themes[theme];

  const handleDownloadPng = async () => {
    setIsGenerating(true);
    try {
      const width = 1080;
      const height = format === "post" ? 1350 : 1920;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas oluşturulamadı");

      // 1. Draw Background Image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue even if cors fails, will draw solid bg
      });

      if (img.complete && img.naturalWidth > 0) {
        // Draw centered and cover
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw Dark Aesthetic Gradient Overlay
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(10, 15, 30, 0.2)");
      grad.addColorStop(0.4, "rgba(10, 15, 30, 0.5)");
      grad.addColorStop(0.75, "rgba(10, 15, 30, 0.92)");
      grad.addColorStop(1, "rgba(10, 15, 30, 0.99)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Top Branding Header
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("SENİ DE BEKLERİZ", 60, 90);

      ctx.fillStyle = currentTheme.badgeText;
      ctx.font = "600 20px sans-serif";
      ctx.fillText("KÜLTÜR, SANAT VE TARİH REHBERİ", 60, 125);

      // 4. Badge
      const badgeY = height - 480;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.roundRect?.(60, badgeY, 360, 48, 12);
      ctx.fill();

      ctx.fillStyle = currentTheme.badgeText;
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(badgeText.toUpperCase(), 80, badgeY + 32);

      // 5. Main Title (Word wrap)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px sans-serif";
      const titleLines = wrapText(ctx, title, width - 120);
      let textY = badgeY + 100;
      titleLines.slice(0, 3).forEach((line) => {
        ctx.fillText(line, 60, textY);
        textY += 65;
      });

      // 6. Summary / Snippet
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "400 26px sans-serif";
      const summaryLines = wrapText(ctx, summary, width - 120);
      textY += 15;
      summaryLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 60, textY);
        textY += 38;
      });

      // 7. Footer CTA
      const footerY = height - 70;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(60, footerY - 40);
      ctx.lineTo(width - 60, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("🔗 Detaylar ve Harita: senidebekleriz.com", 60, footerY);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Görsel dışa aktarılamadı");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `senidebekleriz-${format}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Sosyal medya kartı yüksek kalitede indirildi! 📸");
      }, "image/png");
    } catch (err: any) {
      toast.error("Görsel üretilemedi", err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    const caption = `${badgeText}\n\n📍 ${title}\n\n${summary}\n\n✨ Türkiye'nin kültür ve sanat duraklarını keşfetmek için bizi takip edin!\n🔗 Detaylı rota ve bilgiler senidebekleriz.com'da.\n\n#senidebekleriz #kültürsanat #türkiye #gezi #tarih #etkinlik #müze #arkeoloji`;
    navigator.clipboard.writeText(caption);
    toast.success("Instagram açıklaması ve etiketler panoya kopyalandı! 📋");
  };

  function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 text-white shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Sosyal Medya &amp; Instagram Kart Stüdyosu
              </h2>
              <p className="text-xs text-muted-foreground">
                İçeriğinizi tek tıkla Instagram Post veya Story afişine dönüştürüp indirin.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Layout */}
        <div className="grid md:grid-cols-12 gap-6 p-6">
          {/* Controls Column (Left) */}
          <div className="md:col-span-6 space-y-4">
            {/* Format Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Görsel Formatı</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("post")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    format === "post"
                      ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary/30"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs block">📸 Instagram Post (4:5)</span>
                  <span className="text-[10px] text-muted-foreground">1080 x 1350 px</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("story")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    format === "story"
                      ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary/30"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs block">📱 Story / Reels (9:16)</span>
                  <span className="text-[10px] text-muted-foreground">1080 x 1920 px</span>
                </button>
              </div>
            </div>

            {/* Badge Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori / Şehir Rozeti</Label>
              <Input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Örn: 🏛️ ARKEOLOJİ KEŞFİ • ADIYAMAN"
                className="h-8.5 text-xs"
              />
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ana Başlık</Label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={2}
                placeholder="Paylaşım başlığı..."
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Summary Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Alt Metin / Açıklama</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Kısa açıklama..."
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Renk Atmosferi</Label>
              <div className="flex items-center gap-2">
                {[
                  { id: "amber", label: "Altın Miras", color: "bg-amber-500" },
                  { id: "rose", label: "Kültür Ateşi", color: "bg-rose-500" },
                  { id: "indigo", label: "Gece Mavisi", color: "bg-indigo-500" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      theme === t.id
                        ? "border-primary bg-primary/10 text-foreground font-bold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={handleDownloadPng}
                disabled={isGenerating}
                className="w-full h-10 text-xs font-bold gap-1.5 shadow-xs bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white"
              >
                <Download className="h-4 w-4" />
                <span>PNG Olarak İndir</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCaption}
                className="w-full h-10 text-xs font-semibold gap-1.5"
              >
                <Copy className="h-4 w-4" />
                <span>Metni Kopyala</span>
              </Button>
            </div>
          </div>

          {/* Live Visual Preview (Right) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Canlı Önizleme ({format === "post" ? "4:5 Post" : "9:16 Story"})
            </span>

            {/* Card Mockup Frame */}
            <div
              className={`relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl transition-all ${
                format === "post" ? "w-[270px] aspect-[4/5]" : "w-[240px] aspect-[9/16]"
              }`}
            >
              {/* Background Image */}
              <img
                src={imageUrl}
                alt="Social Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div
                className="absolute inset-0"
                style={{ background: currentTheme.gradient }}
              />

              {/* Card Content Layout */}
              <div className="relative h-full p-4 flex flex-col justify-between text-white select-none">
                {/* Header Branding */}
                <div className="space-y-0.5">
                  <p className="text-[10px] font-extrabold tracking-wider text-white/95">
                    SENİ DE BEKLERİZ
                  </p>
                  <p
                    className="text-[8px] font-semibold tracking-wider uppercase"
                    style={{ color: currentTheme.badgeText }}
                  >
                    Kültür, Sanat ve Tarih Rehberi
                  </p>
                </div>

                {/* Bottom Content Area */}
                <div className="space-y-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border"
                    style={{
                      backgroundColor: currentTheme.badgeBg,
                      borderColor: currentTheme.badgeBorder,
                      color: currentTheme.badgeText,
                    }}
                  >
                    {badgeText}
                  </span>

                  <h3 className="text-xs font-extrabold leading-snug line-clamp-3 text-white drop-shadow-xs">
                    {title}
                  </h3>

                  <p className="text-[9px] text-white/80 line-clamp-2 leading-relaxed">
                    {summary}
                  </p>

                  <div className="pt-1 border-t border-white/20 flex items-center justify-between text-[8px] text-white/90">
                    <span className="font-semibold">🔗 senidebekleriz.com</span>
                    <span className="opacity-75">Tüm Rotalar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
