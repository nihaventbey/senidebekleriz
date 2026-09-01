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
import { Loader2, Sparkles, ArrowLeft, Trash2, Link2, ExternalLink } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "@/lib/toast";
import { slugify } from "@/lib/slugify";
import { EditorialChecklist } from "@/components/admin/editorial-checklist";
import { ArticleImageGallery } from "@/components/admin/article-image-gallery";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { evaluateArticleContent } from "@/lib/content/editorial-checklist";
import { collectArticleImageUrls } from "@/lib/markdown/extract-images";
import type { ArticleActionResult } from "@/lib/actions/articles";

type CityOption = { slug: string; name: string };

type ArticleFormProps = {
  action: (formData: FormData) => Promise<ArticleActionResult>;
  cities: CityOption[];
  currentSlug?: string;
  deleteAction?: () => Promise<void>;
  defaultValues?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    cover_image?: string | null;
    city_slug?: string | null;
    meta_title?: string;
    meta_description?: string;
    is_published?: boolean;
  };
};

export function ArticleForm({
  action,
  cities,
  currentSlug,
  deleteAction,
  defaultValues = {},
}: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultValues.title || "");
  const [slug, setSlug] = useState(defaultValues.slug || "");
  const [excerpt, setExcerpt] = useState(defaultValues.excerpt || "");
  const [content, setContent] = useState(defaultValues.content || "");
  const [metaTitle, setMetaTitle] = useState(defaultValues.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    defaultValues.meta_description || ""
  );
  const [coverImage, setCoverImage] = useState(defaultValues.cover_image || "");
  const [preview, setPreview] = useState(false);
  const articleEvaluation = useMemo(
    () => evaluateArticleContent(content),
    [content]
  );
  const articleImages = useMemo(
    () => collectArticleImageUrls(content, coverImage),
    [content, coverImage]
  );
  const contentPreviewHtml = useMemo(() => renderMarkdown(content), [content]);
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [aiTopic, setAiTopic] = useState(defaultValues.title || "");
  const [aiSourceUrl, setAiSourceUrl] = useState("");
  const [aiCity, setAiCity] = useState(defaultValues.city_slug || "");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!defaultValues.slug && !slug) {
      setSlug(slugify(value));
    }
  }

  function generateWithAi() {
    if (!aiTopic.trim() && !aiSourceUrl.trim()) {
      toast.error("Konu veya kaynak URL girin");
      return;
    }

    startAiTransition(async () => {
      const cityName = cities.find((c) => c.slug === aiCity)?.name;
      try {
        const res = await fetch("/api/admin/ai-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: aiTopic.trim(),
            cityName,
            type: "guide",
            sourceUrl: aiSourceUrl.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI hatası");

        setTitle(data.title);
        setSlug(slugify(data.title));
        setExcerpt(data.excerpt);
        setContent(data.content);
        setMetaDescription(data.meta_description);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (aiCity) setCitySlug(aiCity);
        if (!metaTitle) setMetaTitle(data.title);
        toast.success(
          aiSourceUrl.trim()
            ? data.cover_image
              ? "URL'den taslak ve kapak görseli oluşturuldu"
              : "URL'den AI taslak oluşturuldu"
            : "AI taslak oluşturuldu",
          "Metni düzenleyip yayınlayın."
        );
      } catch (error) {
        toast.error(
          "Taslak oluşturulamadı",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startSaveTransition(async () => {
      try {
        const result = await action(formData);
        toast.success(
          result.isPublished ? "Yazı yayınlandı" : "Taslak kaydedildi"
        );
        if (currentSlug && result.slug !== currentSlug) {
          router.replace(`/yonetim/yazilar/${result.slug}/duzenle`);
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error(
          "Kaydedilemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/yazilar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        {deleteAction && (
          <form action={deleteAction}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="font-semibold">AI Taslak Oluştur</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Google Gemini ile özgün Markdown taslak üretir. İsteğe bağlı kaynak
          URL verirseniz sayfa içeriği çekilir ve buna göre zengin metin
          oluşturulur. Yayınlamadan önce mutlaka düzenleyin.
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ai-source-url">Kaynak URL (opsiyonel)</Label>
            <Input
              id="ai-source-url"
              type="url"
              value={aiSourceUrl}
              onChange={(e) => setAiSourceUrl(e.target.value)}
              placeholder="https://www.kulturportali.gov.tr/... veya resmi müze/gezi sayfası"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <span>Hızlı Kaynaklar:</span>
              <a
                href="https://www.kulturportali.gov.tr/turkiye/genel/gezilecekyer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 rounded-md bg-muted px-2 py-0.5 text-primary hover:underline font-medium"
              >
                🏛️ Kültür Portalı Gezilecek Yerler
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </a>
              <a
                href="https://www.kulturportali.gov.tr/turkiye/genel/kulturatlasi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 rounded-md bg-muted px-2 py-0.5 text-primary hover:underline font-medium"
              >
                📜 Kültür Atlası
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={
                aiSourceUrl.trim()
                  ? "Konu (boş bırakılırsa sayfa başlığı kullanılır)"
                  : "Örn: Kapadokya'da 2 günlük rota"
              }
            />
            <Select
              value={aiCity || "none"}
              onValueChange={(v) => {
                const next = !v || v === "none" ? "" : v;
                setAiCity(next);
                if (next) setCitySlug(next);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Şehir (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Şehir seçilmedi</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={generateWithAi}
          disabled={aiPending}
        >
          {aiPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : aiSourceUrl.trim() ? (
            <Link2 className="mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {aiSourceUrl.trim() ? "URL'den AI Taslak Oluştur" : "AI Taslak Oluştur"}
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-lg border p-6"
      >
        <input type="hidden" name="content" value={content} />
        <ArticleImageGallery
          images={articleImages}
          coverImage={coverImage}
          onSetCover={setCoverImage}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Özet</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Liste ve SEO için kısa özet"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">İçerik (Markdown)</Label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                📷 İçeriğe Görsel Yükle
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Yükleme hatası");
                      const markdownImg = `\n\n![${file.name.replace(/\.[^/.]+$/, "")}](${data.url})\n\n`;
                      setContent((prev) => prev + markdownImg);
                      toast.success("Görsel yüklendi ve içeriğe eklendi!");
                    } catch (err) {
                      toast.error("Yükleme hatası", err instanceof Error ? err.message : undefined);
                    }
                  }}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? "Düzenle" : "Önizleme"}
              </Button>
            </div>
          </div>
          {preview ? (
            <MarkdownContent
              html={contentPreviewHtml}
              className="min-h-[320px] rounded-lg border bg-muted/20 p-4"
            />
          ) : (
            <Textarea
              id="content"
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="font-mono text-sm"
              placeholder="## Başlık&#10;&#10;Markdown ile yazın..."
            />
          )}
        </div>

        {!preview && (
          <EditorialChecklist
            evaluation={articleEvaluation}
            title="Blog yazısı kalite kontrolü"
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cover_image">Kapak Görseli</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="cover_image"
                name="cover_image"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Görsel URL veya bilgisayardan seçin..."
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Yükleme hatası");
                      setCoverImage(data.url);
                      toast.success("Görsel başarıyla yüklendi!");
                    } catch (err) {
                      toast.error("Görsel yüklenemedi", err instanceof Error ? err.message : undefined);
                    }
                  }}
                  className="cursor-pointer text-xs"
                />
              </div>
            </div>
            {coverImage && (
              <img
                src={coverImage}
                alt="Kapak önizleme"
                className="mt-2 h-40 w-full max-w-md rounded-lg border object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city_slug">İlişkili Şehir</Label>
            <input type="hidden" name="city_slug" value={citySlug} />
            <Select
              value={citySlug}
              onValueChange={(v) => setCitySlug(!v || v === "none" ? "none" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Şehir rehberi olarak bağla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bağlı değil</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta Başlık</Label>
            <Input
              id="meta_title"
              name="meta_title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Açıklama</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={defaultValues.is_published ?? false}
            className="size-4 rounded border border-input"
          />
          <span className="text-sm font-medium">
            Yayında (blog ve şehir rehberi)
          </span>
        </label>

        <Button type="submit" disabled={savePending}>
          {savePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </form>
    </div>
  );
}
