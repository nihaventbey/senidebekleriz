"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Eye,
  Loader2,
  Pencil,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";
import { polishMarkdown, TEMPLATE_HEADING_PATTERNS } from "@/lib/ai/editorial";
import { cleanPublisherText, stripTrailingSourceAttribution } from "@/lib/ai/clean-publisher";

type EditorialMarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  title: string;
  sourceName?: string;
  onCleanTitle?: (cleanedTitle: string) => void;
  uploadFolder: "news" | "events" | "articles";
  slugHint: string;
  targetMinChars: number;
  targetMaxChars: number;
  required?: boolean;
  placeholder?: string;
  invalid?: boolean;
};

/**
 * Standardized Markdown editor with AI heading formatter, deterministic
 * source/template cleanup, inline WebP image uploader, live preview,
 * auto-fitting textarea, and SEO character/structure meter.
 */
export function EditorialMarkdownEditor({
  id,
  label,
  value,
  onChange,
  title,
  sourceName,
  onCleanTitle,
  uploadFolder,
  slugHint,
  targetMinChars,
  targetMaxChars,
  required = false,
  placeholder,
  invalid = false,
}: EditorialMarkdownEditorProps) {
  const uploadInputId = useId();
  const helperId = useId();
  const [preview, setPreview] = useState(false);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [formattingPending, startFormattingTransition] = useTransition();

  const metrics = useMemo(() => {
    const trimmed = value.trim();
    const charCount = trimmed.length;
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const headings = Array.from(trimmed.matchAll(/^#{2,3}\s+(.+)$/gm)).map((m) =>
      m[1].trim()
    );
    const hasLeadParagraph = trimmed.length > 0 && !/^#{1,3}\s+/.test(trimmed);
    const hasTemplateHeading = headings.some((h) =>
      TEMPLATE_HEADING_PATTERNS.some((p) => p.test(h))
    );
    const hasSourceLeak =
      trimmed.length > 0 &&
      stripTrailingSourceAttribution(trimmed, title, sourceName) !== trimmed;

    let lengthStatus: "empty" | "short" | "ideal" | "long" = "empty";
    if (charCount === 0) lengthStatus = "empty";
    else if (charCount < Math.round(targetMinChars * 0.85)) lengthStatus = "short";
    else if (charCount <= Math.round(targetMaxChars * 1.25)) lengthStatus = "ideal";
    else lengthStatus = "long";

    const progressPercent = Math.min(
      100,
      Math.round((charCount / targetMaxChars) * 100)
    );

    return {
      charCount,
      wordCount,
      readingMinutes,
      headingsCount: headings.length,
      hasLeadParagraph,
      hasTemplateHeading,
      hasSourceLeak,
      lengthStatus,
      progressPercent,
    };
  }, [value, title, sourceName, targetMinChars, targetMaxChars]);

  const previewHtml = useMemo(() => renderMarkdown(value), [value]);

  function handleFormatHeadings() {
    if (!value.trim()) {
      toast.error("Önce metni girin veya üretin");
      return;
    }

    startFormattingTransition(async () => {
      try {
        const res = await fetch("/api/admin/format-news-headings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: value.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Başlıklandırma işlemi başarısız oldu");
        }
        if (data.content) {
          onChange(polishMarkdown(data.content, title, sourceName || undefined));
          toast.success("Metin bağlamına uygun Markdown alt başlıklarıyla düzenlendi ✨");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Başlıklandırılamadı");
      }
    });
  }

  function handleCleanText() {
    if (!value.trim() && !title.trim()) return;
    const cleanedTitle = title.trim() ? cleanPublisherText(title) : title;
    if (onCleanTitle && cleanedTitle && cleanedTitle !== title) {
      onCleanTitle(cleanedTitle);
    }
    const cleaned = polishMarkdown(
      value,
      cleanedTitle || title,
      sourceName || undefined
    );
    onChange(cleaned);
    toast.success("Kaynak kuyrukları, şablon başlıklar ve yazım kusurları temizlendi.");
  }

  function insertMarkdown(prefix: string, suffix = "", defaultPlaceholder = "Başlık") {
    const textarea = document.getElementById(id) as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(`${value.trimEnd()}\n\n${prefix}${defaultPlaceholder}${suffix}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const textToWrap = selected || defaultPlaceholder;
    const replacement = `${prefix}${textToWrap}${suffix}`;
    const nextContent = value.slice(0, start) + replacement + value.slice(end);

    onChange(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + textToWrap.length
      );
    }, 50);
  }

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInlineImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", uploadFolder);
      formData.append(
        "slugHint",
        `${slugHint || slugify(title) || uploadFolder}-detay-${Date.now().toString(36).slice(-4)}`
      );

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel yüklenemedi");

      const altText = title.trim() || file.name.replace(/\.[^/.]+$/, "");
      const markdownImg = `\n\n![${altText}](${data.url})\n\n`;
      onChange(value.trimEnd() + markdownImg);
      toast.success("Görsel WebP formatında yüklendi ve metne eklendi.");
    } catch (err) {
      toast.error(
        "Görsel eklenemedi",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setUploadingInlineImage(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id} className="text-xs font-semibold">
            {label} {required ? <span aria-hidden="true">*</span> : null}
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {metrics.charCount.toLocaleString("tr-TR")} kr · {metrics.wordCount} kelime · ~{metrics.readingMinutes} dk
          </span>
        </div>

        <Button
          type="button"
          variant={preview ? "default" : "outline"}
          size="sm"
          onClick={() => setPreview(!preview)}
          className="h-8 gap-1.5 text-xs"
        >
          {preview ? (
            <>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Düzenle</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Önizleme</span>
            </>
          )}
        </Button>
      </div>

      {!preview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/25 px-2.5 py-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("\n\n## ", "\n\n", "Alt Başlık")}
              className="h-7 px-2 text-xs font-bold"
              title="H2 Markdown alt başlığı ekle (## Başlık)"
            >
              H2
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("\n\n### ", "\n\n", "Ara Başlık")}
              className="h-7 px-2 text-xs font-bold"
              title="H3 Markdown ara başlığı ekle (### Başlık)"
            >
              H3
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown("**", "**", "kalın metin")}
              className="h-7 px-2 text-xs font-bold"
              title="Seçili metni kalın yap (**metin**)"
            >
              B
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                insertMarkdown("\n\n> ", "\n\n", "Önemli açıklama veya alıntı...")
              }
              className="h-7 px-2 text-xs font-medium"
              title="Alıntı bloğu ekle (> alıntı)"
            >
              Alıntı
            </Button>

            <label
              htmlFor={uploadInputId}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring"
            >
              {uploadingInlineImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>Görsel Ekle</span>
              <input
                id={uploadInputId}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingInlineImage}
                onChange={handleInlineImageUpload}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={formattingPending || !value.trim()}
              onClick={handleFormatHeadings}
              className="h-7 gap-1 border border-primary/20 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
              title="Yapay zeka metni analiz edip bağlama uygun '## Alt Başlık' başlıkları yerleştirir"
            >
              {formattingPending ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{formattingPending ? "Başlıklandırılıyor..." : "AI Başlıklandır"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!value.trim() && !title.trim()}
              onClick={handleCleanText}
              className="h-7 gap-1 px-2.5 text-xs font-medium"
              title="Kaynak kalıntılarını, şablon başlıkları ve yazım hatalarını temizler"
            >
              <Eraser className="h-3 w-3" aria-hidden="true" />
              <span>Temizle</span>
            </Button>
          </div>
        </div>
      )}

      {preview ? (
        <div className="min-h-[340px] rounded-xl border border-border/60 bg-muted/20 p-5">
          {value.trim() ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MarkdownContent html={previewHtml} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Önizlenecek içerik henüz girilmemiş.</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={15}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={helperId}
          className="w-full min-h-[15lh] max-h-[34lh] resize-y text-sm leading-relaxed"
        />
      )}

      {/* Slim Live SEO & Editorial Status Bar */}
      <div
        id={helperId}
        className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-[11px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-semibold text-foreground">
              Hedef: {targetMinChars.toLocaleString("tr-TR")}–{targetMaxChars.toLocaleString("tr-TR")} kr
            </span>
            <span className="inline-flex items-center gap-1">
              {metrics.hasLeadParagraph ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden="true" />
              )}
              Giriş
            </span>
            <span className="inline-flex items-center gap-1">
              {metrics.headingsCount >= 2 && !metrics.hasTemplateHeading ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden="true" />
              )}
              {metrics.headingsCount} alt başlık{metrics.hasTemplateHeading ? " (şablon)" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              {!metrics.hasSourceLeak ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden="true" />
              )}
              {metrics.hasSourceLeak ? "Kaynak kalıntısı var" : "Temiz"}
            </span>
          </div>

          <span
            className={`font-semibold ${
              metrics.lengthStatus === "ideal"
                ? "text-emerald-600 dark:text-emerald-400"
                : metrics.lengthStatus === "empty"
                ? "text-muted-foreground"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {metrics.lengthStatus === "ideal" && "İdeal Uzunluk"}
            {metrics.lengthStatus === "short" && "Kısa"}
            {metrics.lengthStatus === "long" && "Uzun"}
            {metrics.lengthStatus === "empty" && "Bekleniyor"}
          </span>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            style={{ width: `${metrics.progressPercent}%` }}
            className={`h-full transition-all duration-300 ${
              metrics.lengthStatus === "ideal"
                ? "bg-emerald-500"
                : metrics.lengthStatus === "empty"
                ? "bg-muted-foreground/30"
                : "bg-amber-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
