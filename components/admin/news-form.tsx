"use client";

import { useState, useTransition, useMemo } from "react";
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
  Link2,
  ExternalLink,
  Check,
  Eye,
  Newspaper,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "@/lib/toast";
import { slugify } from "@/lib/slugify";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import type { NewsActionResult } from "@/lib/actions/news";

type CityOption = { slug: string; name: string };

const CATEGORY_OPTIONS = [
  { value: "arkeoloji", label: "🏛️ Arkeoloji & Kazı" },
  { value: "restorasyon", label: "🏰 Restorasyon & Tarih" },
  { value: "muze_sergi", label: "🖼️ Müze & Sergi" },
  { value: "kultur_sanat", label: "🎨 Kültür & Sanat" },
  { value: "festival_haberleri", label: "🎪 Festival Gündemi" },
  { value: "genel", label: "📰 Genel Kültür" },
];

type NewsFormProps = {
  action: (formData: FormData) => Promise<NewsActionResult>;
  cities: CityOption[];
  currentSlug?: string;
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
  const [sourceUrl, setSourceUrl] = useState(defaultValues.source_url || "");
  const [isPublished, setIsPublished] = useState(defaultValues.is_published ?? true);
  const [isFeatured, setIsFeatured] = useState(defaultValues.is_featured ?? false);

  const [preview, setPreview] = useState(false);
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [aiSourceUrl, setAiSourceUrl] = useState("");
  const [aiTopic, setAiTopic] = useState("");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!defaultValues.slug && !slug) {
      setSlug(slugify(value));
    }
  }

  function generateWithAi() {
    if (!aiTopic.trim() && !aiSourceUrl.trim()) {
      toast.error("Haber konusu veya kaynak URL girin");
      return;
    }

    startAiTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-news-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: aiTopic.trim(),
            sourceUrl: aiSourceUrl.trim(),
            cityName: cities.find((c) => c.slug === citySlug)?.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI haber üretimi başarısız");

        if (data.title) {
          setTitle(data.title);
          if (!slug || !defaultValues.slug) setSlug(slugify(data.title));
        }
        if (data.summary) setSummary(data.summary);
        if (data.content) setContent(data.content);
        if (data.category) setCategory(data.category);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (aiSourceUrl.trim()) setSourceUrl(aiSourceUrl.trim());

        toast.success("AI haber taslağı başarıyla oluşturuldu! ✨");
      } catch (err: any) {
        toast.error(err.message || "Taslak üretilemedi");
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("is_published", isPublished ? "true" : "false");
    formData.set("is_featured", isFeatured ? "true" : "false");

    startSaveTransition(async () => {
      try {
        const result = await action(formData);
        if (!result.success) {
          toast.error("Kaydedilemedi", result.error);
          return;
        }

        toast.success(currentSlug ? "Haber güncellendi! ✅" : "Haber oluşturuldu! ✅");
        router.push("/yonetim/haberler");
        router.refresh();
      } catch (err: any) {
        toast.error("Hata", err.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
          <Link href="/yonetim/haberler">
            <ArrowLeft className="h-4 w-4" />
            Haberlere Dön
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {currentSlug && (
            <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
              <Link href={`/haber/${currentSlug}`} target="_blank">
                <Eye className="h-3.5 w-3.5" /> Canlıda Gör
              </Link>
            </Button>
          )}

          <Button type="submit" size="sm" disabled={savePending} className="text-xs font-semibold">
            {savePending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> {currentSlug ? "Güncelle" : "Yayınla"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI News Draft Generator Card */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            URL&apos;den veya Konudan AI ile Haber Üret
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Kültür Bakanlığı, valilik, müze veya haber sitesinden kopyaladığınız doğrudan linki yapıştırın. Yapay zeka haberi analiz edip 5N1K formatında özgün bir metne dönüştürür ve görselleri çeker.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ai-source-url" className="text-xs font-medium">
              Kaynak Haber URL&apos;si
            </Label>
            <Input
              id="ai-source-url"
              type="url"
              value={aiSourceUrl}
              onChange={(e) => setAiSourceUrl(e.target.value)}
              placeholder="https://www.kulturportali.gov.tr/... veya haber linki"
              className="h-9 text-xs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ai-topic" className="text-xs font-medium">
                Haber Konusu (Opsiyonel)
              </Label>
              <Input
                id="ai-topic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Örn: Göbeklitepe'de yeni keşif"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={generateWithAi}
                disabled={aiPending || (!aiSourceUrl.trim() && !aiTopic.trim())}
                className="w-full h-9 text-xs font-semibold gap-1.5"
              >
                {aiPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI Haberi Yazıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI ile Haberi Üret
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs font-semibold">
            Haber Başlığı *
          </Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Haber başlığı..."
            className="h-10 text-sm font-semibold"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-xs font-semibold">
            URL Slug *
          </Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-9 text-xs font-mono"
            required
          />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary" className="text-xs font-semibold">
            Haber Özeti (Spot Cümle / 5N1K)
          </Label>
          <Textarea
            id="summary"
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Haberin ana fikrini özetleyen 1-2 cümlelik spot metin..."
            rows={2}
            className="text-xs"
          />
        </div>

        {/* Category & City */}
        <div className="grid gap-4 sm:grid-cols-2">
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
              İlgili Şehir (Opsiyonel)
            </Label>
            <input type="hidden" name="city_slug" value={citySlug} />
            <Select value={citySlug} onValueChange={(v) => v && setCitySlug(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Şehir seçin">
                  {citySlug === "none"
                    ? "Genel / Şehir Yok"
                    : cities.find((c) => c.slug === citySlug)?.name || "Şehir seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">Genel / Şehir Yok</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cover_image" className="text-xs font-semibold">
              Kapak Görseli URL
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAiImageModalOpen(true)}
              className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              ✨ AI ile Görsel Üret
            </Button>
          </div>
          <Input
            id="cover_image"
            name="cover_image"
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="h-9 text-xs"
          />
          {coverImage && (
            <div className="relative aspect-video max-w-sm overflow-hidden rounded-xl border mt-2">
              <img src={coverImage} alt="Önizleme" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <AiImageModal
          isOpen={isAiImageModalOpen}
          onClose={() => setIsAiImageModalOpen(false)}
          onSelectImage={(url) => setCoverImage(url)}
          initialTitle={title}
          initialCity={cities.find((c) => c.slug === citySlug)?.name}
          initialCategory={category}
        />

        {/* Source info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source_name" className="text-xs font-semibold">
              Kaynak Kurum / Ajans
            </Label>
            <Input
              id="source_name"
              name="source_name"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Örn: AA, DHA, Kültür Bakanlığı, İBB Miras"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url" className="text-xs font-semibold">
              Kaynak Bağlantı URL
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

        {/* Markdown Content & Preview Toggle */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content" className="text-xs font-semibold">
              Haber Metni (Markdown) *
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreview(!preview)}
              className="h-7 text-xs"
            >
              {preview ? "Editöre Dön" : "Önizleme"}
            </Button>
          </div>

          {preview ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5 min-h-[300px]">
              <MarkdownContent html={renderMarkdown(content)} />
            </div>
          ) : (

            <Textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Haber metnini Markdown formatında yazın (## Başlıklar, paragraflar)..."
              rows={14}
              className="font-mono text-xs"
              required
            />
          )}
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 border-t border-border/60 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <span>Haberi Yayına Al (is_published)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <span>🔥 Manşete Çıkar (is_featured)</span>
          </label>
        </div>
      </div>
    </form>
  );
}
