"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
  Sparkles,
  ArrowLeft,
  Trash2,
  Check,
  Eye,
  Pencil,
  Upload,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "@/lib/toast";
import { slugify } from "@/lib/slugify";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { CoverImageInput } from "@/components/admin/cover-image-input";
import type { NewsActionResult } from "@/lib/actions/news";

type CityOption = { slug: string; name: string };

const CATEGORY_OPTIONS = [
  { value: "arkeoloji", label: "🏛️ Arkeoloji & Kazı" },
  { value: "restorasyon", label: "🏰 Tarihi Miras & Restorasyon" },
  { value: "muze_sergi", label: "🖼️ Müze & Sergi" },
  { value: "sinema", label: "🎬 Sinema & Görsel Sanatlar" },
  { value: "kultur_sanat", label: "🎨 Kültür & Sanat" },
  { value: "festival_haberleri", label: "🎪 Festival Gündemi" },
  { value: "genel", label: "📰 Genel Kültür" },
];

type NewsFormProps = {
  action: (formData: FormData) => Promise<NewsActionResult>;
  cities: CityOption[];
  currentSlug?: string;
  initialSourceUrl?: string;
  deleteAction?: () => Promise<void>;
  defaultValues?: {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    category?: string;
    cover_image?: string | null;
    city_slug?: string | null;
    source_name?: string | null;
    source_url?: string | null;
    is_published?: boolean;
    is_featured?: boolean;
  };
};

export function NewsForm({
  action,
  cities,
  currentSlug,
  initialSourceUrl,
  deleteAction,
  defaultValues = {},
}: NewsFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultValues.title || "");
  const [slug, setSlug] = useState(defaultValues.slug || "");
  const [summary, setSummary] = useState(defaultValues.summary || "");
  const [content, setContent] = useState(defaultValues.content || "");
  const [category, setCategory] = useState(defaultValues.category || "kultur_sanat");
  const [coverImage, setCoverImage] = useState(defaultValues.cover_image || "");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");
  const [sourceName, setSourceName] = useState(defaultValues.source_name || "");
  const [sourceUrl, setSourceUrl] = useState(defaultValues.source_url || initialSourceUrl || "");
  const [isPublished, setIsPublished] = useState(defaultValues.is_published ?? true);
  const [isFeatured, setIsFeatured] = useState(defaultValues.is_featured ?? false);

  const [preview, setPreview] = useState(false);
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [formattingPending, startFormattingTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [aiSourceUrl, setAiSourceUrl] = useState(initialSourceUrl || defaultValues.source_url || "");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDepth, setAiDepth] = useState<"standard" | "deep" | "comprehensive">("standard");

  function handleFormatHeadings() {
    if (!content.trim()) {
      toast.error("Önce haber metnini girin veya üretin");
      return;
    }

    startFormattingTransition(async () => {
      try {
        const res = await fetch("/api/admin/format-news-headings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Başlıklandırma işlemi başarısız oldu");

        if (data.content) {
          setContent(data.content);
          toast.success("Metin bağlamına göre Markdown alt başlıklarıyla düzenlendi! ✨");
        }
      } catch (err: any) {
        toast.error(err.message || "Başlıklandırılamadı");
      }
    });
  }

  function insertMarkdown(prefix: string, suffix = "", defaultPlaceholder = "Başlık") {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement | null;
    if (!textarea) {
      setContent((prev) => `${prev.trimEnd()}\n\n${prefix}${defaultPlaceholder}${suffix}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const textToWrap = selected || defaultPlaceholder;
    const replacement = `${prefix}${textToWrap}${suffix}`;
    const nextContent = content.slice(0, start) + replacement + content.slice(end);

    setContent(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + textToWrap.length
      );
    }, 50);
  }

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!defaultValues.slug) {
      setSlug(slugify(value));
    }
  }

  function generateWithAi(overrideUrl?: string) {
    const targetUrl = (overrideUrl || aiSourceUrl || "").trim();
    if (!aiTopic.trim() && !targetUrl) {
      toast.error("Haber konusu veya kaynak bağlantı girin");
      return;
    }

    startAiTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-news-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: aiTopic.trim(),
            sourceUrl: targetUrl,
            cityName: cities.find((c) => c.slug === citySlug)?.name,
            depth: aiDepth,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yapay zeka haber üretimi başarısız");

        if (data.title) {
          setTitle(data.title);
          if (!defaultValues.slug) {
            setSlug(data.slug || slugify(data.title));
          }
        }
        if (data.summary) setSummary(data.summary);
        if (data.content) setContent(data.content);
        if (data.category) setCategory(data.category);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (data.city_slug && citySlug === "none") setCitySlug(data.city_slug);
        if (data.source_name) setSourceName(data.source_name);
        if (targetUrl) {
          setSourceUrl(targetUrl);
          setAiSourceUrl(targetUrl);
        }

        const countMsg = data.word_count ? ` (${data.word_count} kelime)` : "";
        toast.success(`Haber taslağı ve kapak görseli hazırlandı! ✨${countMsg}`);
      } catch (err: any) {
        toast.error(err.message || "Taslak üretilemedi");
      }
    });
  }

  useEffect(() => {
    if (initialSourceUrl && !title && !content && !defaultValues.title) {
      generateWithAi(initialSourceUrl);
    }
  }, [initialSourceUrl]);

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInlineImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "news");
      formData.append(
        "slugHint",
        `${slug || slugify(title) || "haber"}-detay-${Date.now().toString(36).slice(-4)}`
      );

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel yüklenemedi");

      const altText = title.trim() || file.name.replace(/\.[^/.]+$/, "");
      const markdownImg = `\n\n![${altText}](${data.url})\n\n`;
      setContent((prev) => prev.trimEnd() + markdownImg);
      toast.success("Görsel WebP formatında yüklendi ve haber metnine eklendi!");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      toast.error("Eksik Alan", "Lütfen haber başlığını girin.");
      return;
    }
    if (!cleanContent) {
      toast.error("Eksik Alan", "Lütfen haber metnini girin.");
      return;
    }

    const finalSlug = slugify(slug.trim() || cleanTitle) || "kultur-haberi";
    const formData = new FormData();
    formData.set("title", cleanTitle);
    formData.set("slug", finalSlug);
    formData.set("summary", summary.trim() || cleanTitle);
    formData.set("content", cleanContent);
    formData.set("category", category || "kultur_sanat");
    formData.set("city_slug", citySlug || "none");
    formData.set("cover_image", coverImage.trim());
    formData.set("source_name", sourceName.trim());
    formData.set("source_url", sourceUrl.trim());
    formData.set("is_published", isPublished ? "true" : "false");
    formData.set("is_featured", isFeatured ? "true" : "false");

    startSaveTransition(async () => {
      try {
        const result = await action(formData);
        if (!result.success) {
          toast.error("Kaydedilemedi", result.error);
          return;
        }

        toast.success(currentSlug ? "Haber güncellendi! ✅" : "Haber yayınlandı! ✅");
        router.push("/yonetim/haberler");
        router.refresh();
      } catch (err: any) {
        toast.error("Kaydetme Hatası", err.message);
      }
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Bu haberi kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteAction();
        toast.success("Haber silindi");
        router.push("/yonetim/haberler");
        router.refresh();
      } catch (err: any) {
        toast.error("Silinemedi", err.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Üst Eylem Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
          <Link href="/yonetim/haberler">
            <ArrowLeft className="h-4 w-4" />
            Haberlere Dön
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {currentSlug && (
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <Link href={`/haber/${currentSlug}`} target="_blank">
                <Eye className="h-3.5 w-3.5" /> Haberi Sitede Gör
              </Link>
            </Button>
          )}

          {deleteAction && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deletePending || savePending}
              onClick={handleDelete}
              className="gap-1.5 text-xs"
            >
              {deletePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Sil
            </Button>
          )}

          <Button type="submit" size="sm" disabled={savePending} className="text-xs font-semibold gap-1.5 px-4">
            {savePending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> {currentSlug ? "Değişiklikleri Kaydet" : "Haberi Kaydet"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Yapay Zeka ile Haber Üretim Kutusu */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Kaynak Bağlantıdan veya Konudan Haber Üret
            </h2>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Haber sitesi, Kültür Bakanlığı, müze veya ajans bağlantısını yapıştırın. Yapay zeka sayfadaki içeriği okuyup bağlamına uygun haber metnini, 5N1K özetini ve WebP kapak görselini otomatik hazırlar.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ai-source-url" className="text-xs font-medium">
              Kaynak Haber Bağlantısı (URL)
            </Label>
            <Input
              id="ai-source-url"
              type="url"
              value={aiSourceUrl}
              onChange={(e) => setAiSourceUrl(e.target.value)}
              placeholder="https://www.cumhuriyet.com.tr/... veya resmi bülten bağlantısı"
              className="h-9 text-xs bg-background"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-topic" className="text-xs font-medium">
                Haber Konusu (İsteğe Bağlı)
              </Label>
              <Input
                id="ai-topic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Örn: Troya kazılarında yeni keşif"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-depth" className="text-xs font-medium">
                Haber Uzunluğu
              </Label>
              <Select
                value={aiDepth}
                onValueChange={(val) => {
                  if (val === "standard" || val === "deep" || val === "comprehensive") {
                    setAiDepth(val);
                  }
                }}
              >
                <SelectTrigger id="ai-depth" className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-xs">
                    ⚡ Odaklı Haber (~400 Kelime)
                  </SelectItem>
                  <SelectItem value="deep" className="text-xs">
                    📰 Geniş Haber (~650 Kelime)
                  </SelectItem>
                  <SelectItem value="comprehensive" className="text-xs">
                    📚 Kapsamlı Dosya (~1000 Kelime)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => generateWithAi()}
                disabled={aiPending || (!aiSourceUrl.trim() && !aiTopic.trim())}
                className="w-full h-9 text-xs font-semibold gap-1.5"
              >
                {aiPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Haber Yazılıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Haberi Otomatik Yaz
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Temel Haber Bilgileri */}
      <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Haber Başlığı */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title" className="text-xs font-semibold">
              Haber Başlığı *
            </Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Haber başlığını girin..."
              className="h-10 text-sm font-semibold"
              required
            />
          </div>

          {/* Kısa Adres (Slug) */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-xs font-semibold">
              Kalıcı Bağlantı (Kısa Adres) *
            </Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="haber-basligi"
              className="h-10 text-xs font-mono"
              required
            />
          </div>
        </div>

        {/* Haber Özeti (Spot) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="summary" className="text-xs font-semibold">
              Haber Özeti (5N1K Spot Cümlesi)
            </Label>
            <span className="text-[11px] text-muted-foreground">
              {summary.length} / 200 karakter
            </span>
          </div>
          <Textarea
            id="summary"
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Haberin ana fikrini özetleyen 1-2 cümlelik spot metin..."
            rows={2}
            className="text-xs leading-relaxed"
          />
        </div>

        {/* Kategori, Şehir ve Kaynak Bilgileri */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-semibold">
              Kategori *
            </Label>
            <input type="hidden" name="category" value={category} />
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Kategori seçin">
                  {CATEGORY_OPTIONS.find((c) => c.value === category)?.label || "Kategori"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city_slug" className="text-xs font-semibold">
              İlgili Şehir
            </Label>
            <input type="hidden" name="city_slug" value={citySlug} />
            <Select value={citySlug} onValueChange={(v) => v && setCitySlug(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Şehir seçin">
                  {citySlug === "none"
                    ? "Türkiye Geneli"
                    : cities.find((c) => c.slug === citySlug)?.name || "Şehir seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">Türkiye Geneli</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_name" className="text-xs font-semibold">
              Kaynak Kurum / Yayın
            </Label>
            <Input
              id="source_name"
              name="source_name"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Örn: Cumhuriyet, AA, Kültür Bakanlığı"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url" className="text-xs font-semibold">
              Kaynak Bağlantısı
            </Label>
            <Input
              id="source_url"
              name="source_url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Kapak Görseli */}
        <div className="pt-1 border-t border-border/50">
          <CoverImageInput
            value={coverImage}
            onChange={setCoverImage}
            folder="news"
            slugHint={slug || title || "haber"}
            label="Kapak Görseli"
            name="cover_image"
            onOpenAiModal={() => setIsAiImageModalOpen(true)}
          />

          <AiImageModal
            isOpen={isAiImageModalOpen}
            onClose={() => setIsAiImageModalOpen(false)}
            onSelectImage={(url) => setCoverImage(url)}
            initialTitle={title}
            initialCity={cities.find((c) => c.slug === citySlug)?.name}
            initialCategory={category}
          />
        </div>

        {/* Haber Metni Düzenleyici */}
        <div className="space-y-2.5 pt-2 border-t border-border/50">
          <input type="hidden" name="content" value={content} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="content-editor" className="text-xs font-semibold">
                Haber Metni *
              </Label>
              <span className="text-[11px] text-muted-foreground">
                ({wordCount} kelime · ~{Math.max(1, Math.ceil(wordCount / 200))} dk okuma)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {!preview && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={formattingPending || !content.trim()}
                    onClick={handleFormatHeadings}
                    className="h-7 px-2.5 text-xs font-semibold gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                    title="Yapay zeka metni analiz edip bağlama uygun '## [Alt Başlık]' markdown başlıkları yerleştirir"
                  >
                    {formattingPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-amber-500" />
                    )}
                    <span>{formattingPending ? "Başlıklandırılıyor..." : "✨ Başlıklandır (AI)"}</span>
                  </Button>

                  <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertMarkdown("\n\n## ", "\n\n", "Alt Başlık")}
                    className="h-7 px-2 text-xs font-bold"
                    title="Seçili metni H2 Markdown başlığı yapar (## Başlık)"
                  >
                    H2
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertMarkdown("\n\n### ", "\n\n", "Ara Başlık")}
                    className="h-7 px-2 text-xs font-bold"
                    title="Seçili metni H3 Markdown alt başlığı yapar (### Başlık)"
                  >
                    H3
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertMarkdown("**", "**", "kalın metin")}
                    className="h-7 px-2 text-xs font-bold"
                    title="Metni kalın yapar (**metin**)"
                  >
                    B
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertMarkdown("\n\n> ", "\n\n", "Önemli açıklama veya sanatçı alıntısı...")}
                    className="h-7 px-2 text-xs"
                    title="Alıntı kutusu ekler (> alıntı)"
                  >
                    &ldquo; &rdquo;
                  </Button>

                  <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
                    {uploadingInlineImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Metne Görsel Ekle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingInlineImage}
                      onChange={handleInlineImageUpload}
                    />
                  </label>
                </>
              )}

              <Button
                type="button"
                variant={preview ? "default" : "outline"}
                size="sm"
                onClick={() => setPreview(!preview)}
                className="h-7 gap-1 text-xs"
              >
                {preview ? (
                  <>
                    <Pencil className="h-3 w-3" /> Düzenlemeye Dön
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Önizleme
                  </>
                )}
              </Button>
            </div>
          </div>

          {preview ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5 min-h-[340px]">
              <MarkdownContent html={renderMarkdown(content)} />
            </div>
          ) : (
            <Textarea
              id="content-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Haber metnini buraya yazın. Alt başlıklar için satır başında ## kullanabilirsiniz..."
              rows={16}
              className="text-sm leading-relaxed"
              required
            />
          )}
        </div>

        {/* Yayın Durumu ve Alt Kaydet Çubuğu */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <span>Haberi Yayına Al</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <span>🔥 Manşette Öne Çıkar</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs">
              <Link href="/yonetim/haberler">Vazgeç</Link>
            </Button>
            <Button type="submit" size="sm" disabled={savePending} className="text-xs font-semibold gap-1.5 px-5">
              {savePending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> {currentSlug ? "Değişiklikleri Kaydet" : "Haberi Kaydet"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
