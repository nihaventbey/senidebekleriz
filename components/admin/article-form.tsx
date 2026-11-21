"use client";

import { useState, useTransition, useMemo, useRef } from "react";
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
import { DisclosureSection } from "@/components/admin/editorial/disclosure-section";
import { EditorialShell } from "@/components/admin/editorial/editorial-shell";
import { EditorialActionBar } from "@/components/admin/editorial-action-bar";
import { EditorialMarkdownEditor } from "@/components/admin/editorial-markdown-editor";
import { EditorialChecklist } from "@/components/admin/editorial-checklist";
import { ArticleImageGallery } from "@/components/admin/article-image-gallery";
import { CoverImageInput } from "@/components/admin/cover-image-input";
import { evaluateArticleContent } from "@/lib/content/editorial-checklist";
import { collectArticleImageUrls } from "@/lib/markdown/extract-images";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";
import {
  CheckSquare,
  ExternalLink,
  Images,
  Link2,
  Loader2,
  RotateCw,
  Sparkles,
} from "lucide-react";
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
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState(defaultValues.title || "");
  const [slug, setSlug] = useState(defaultValues.slug || "");
  const [excerpt, setExcerpt] = useState(defaultValues.excerpt || "");
  const [content, setContent] = useState(defaultValues.content || "");
  const [metaTitle, setMetaTitle] = useState(defaultValues.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    defaultValues.meta_description || ""
  );
  const [coverImage, setCoverImage] = useState(defaultValues.cover_image || "");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");
  const [isPublished, setIsPublished] = useState<boolean>(
    defaultValues.is_published ?? false
  );

  const [aiTopic, setAiTopic] = useState(defaultValues.title || "");
  const [aiSourceUrl, setAiSourceUrl] = useState("");
  const [aiCity, setAiCity] = useState(defaultValues.city_slug || "");

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const articleEvaluation = useMemo(
    () => evaluateArticleContent(content),
    [content]
  );
  const articleImages = useMemo(
    () => collectArticleImageUrls(content, coverImage),
    [content, coverImage]
  );

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
        setStatusMessage("AI rehber taslağı hazırlanıyor...");
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

        if (data.title) {
          setTitle(data.title);
          if (!defaultValues.slug) {
            setSlug(slugify(data.title));
          }
          if (!metaTitle) setMetaTitle(data.meta_title || data.title);
        } else if (data.meta_title && !metaTitle) {
          setMetaTitle(data.meta_title);
        }
        if (data.excerpt) setExcerpt(data.excerpt);
        if (data.content) setContent(data.content);
        if (data.meta_description) setMetaDescription(data.meta_description);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (aiCity) setCitySlug(aiCity);

        setStatusMessage("Rehber taslağı hazırlandı.");
        toast.success(
          aiSourceUrl.trim()
            ? data.cover_image
              ? "URL'den taslak ve kapak görseli oluşturuldu"
              : "URL'den AI taslak oluşturuldu"
            : "AI taslak oluşturuldu",
          "Metni düzenleyip yayınlayın."
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Taslak üretilemedi";
        setStatusMessage(msg);
        toast.error("Taslak oluşturulamadı", msg);
      }
    });
  }

  function saveWithStatus(publishState: boolean) {
    setAttemptedSubmit(true);
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (formRef.current && !formRef.current.checkValidity()) {
      const firstInvalid = formRef.current.querySelector<HTMLElement>(":invalid");
      const enclosingDetails = firstInvalid?.closest("details");
      if (enclosingDetails && !enclosingDetails.open) {
        enclosingDetails.open = true;
      }
      formRef.current.reportValidity();
      firstInvalid?.focus();
      return;
    }

    if (!cleanTitle) {
      toast.error("Eksik Alan", "Lütfen yazı başlığını girin.");
      document.getElementById("title")?.focus();
      return;
    }
    if (!cleanContent) {
      toast.error("Eksik Alan", "Lütfen rehber metnini girin.");
      document.getElementById("content-editor")?.focus();
      return;
    }

    setIsPublished(publishState);
    const finalSlug = slugify(slug.trim() || cleanTitle) || "gezi-rehberi";
    const formData = new FormData();
    formData.set("title", cleanTitle);
    formData.set("slug", finalSlug);
    formData.set("excerpt", excerpt.trim());
    formData.set("content", cleanContent);
    formData.set("cover_image", coverImage.trim());
    formData.set("city_slug", citySlug || "none");
    formData.set("meta_title", metaTitle.trim());
    formData.set("meta_description", metaDescription.trim());
    if (publishState) {
      formData.set("is_published", "on");
    }

    startSaveTransition(async () => {
      try {
        setStatusMessage("Rehber kaydediliyor...");
        const result = await action(formData);
        const msg = result.isPublished
          ? "Gezi rehberi yayına alındı"
          : "Taslak olarak kaydedildi";
        setStatusMessage(msg);
        toast.success(msg);

        if (!currentSlug) {
          router.push(`/yonetim/yazilar/${result.slug}/duzenle`);
        } else if (result.slug !== currentSlug) {
          router.replace(`/yonetim/yazilar/${result.slug}/duzenle`);
        } else {
          router.refresh();
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
        setStatusMessage(msg);
        toast.error("Kaydedilemedi", msg);
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    saveWithStatus(isPublished);
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Bu rehber yazısını kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteAction();
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        toast.error("Silinemedi", err instanceof Error ? err.message : undefined);
      }
    });
  }

  const titleCharTone =
    title.trim().length >= 35 && title.trim().length <= 68
      ? "text-emerald-600 dark:text-emerald-400"
      : title.trim().length === 0
      ? "text-muted-foreground"
      : "text-amber-600 dark:text-amber-400";

  const slugPreview = slug ? `/${slug.slice(0, 18)}${slug.length > 18 ? "…" : ""}` : "Otomatik";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <EditorialShell
        header={
          <EditorialActionBar
            heading={currentSlug ? "Rehberi Düzenle" : "Yeni Gezi Rehberi"}
            backHref="/yonetim/yazilar"
            backLabel="Rehberler"
            publicHref={currentSlug ? `/blog/${currentSlug}` : undefined}
            isPublished={isPublished}
            isEdit={Boolean(currentSlug)}
            savePending={savePending}
            deletePending={deletePending}
            hasDelete={Boolean(deleteAction)}
            statusAnnouncement={statusMessage}
            onSaveDraft={() => saveWithStatus(false)}
            onSavePublish={() => saveWithStatus(true)}
            onDelete={handleDelete}
          />
        }
        main={
          <>
            <DisclosureSection
              title="AI ile Rehber Taslağı Üret"
              description="Konu veya kaynak URL verin; Gemini özgün gezi rehberi ve SEO özeti hazırlasın."
              icon={<Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
              badge={aiPending ? "Üretiliyor..." : "URL / Konu"}
              badgeTone={aiPending ? "primary" : "neutral"}
              tone="accent"
              defaultOpen={!currentSlug}
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-source-url" className="text-xs font-medium">
                    Kaynak URL (Opsiyonel)
                  </Label>
                  <Input
                    id="ai-source-url"
                    type="url"
                    value={aiSourceUrl}
                    onChange={(e) => setAiSourceUrl(e.target.value)}
                    placeholder="https://www.kulturportali.gov.tr/... veya resmi müze/gezi sayfası"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-9 bg-background text-xs"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
                    <span>Hızlı Kaynaklar:</span>
                    <a
                      href="https://www.kulturportali.gov.tr/turkiye/genel/gezilecekyer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 font-medium text-primary hover:underline"
                    >
                      <span>Kültür Portalı Gezilecek Yerler</span>
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                    <a
                      href="https://www.kulturportali.gov.tr/turkiye/genel/kulturatlasi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 font-medium text-primary hover:underline"
                    >
                      <span>Kültür Atlası</span>
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="space-y-1.5 sm:col-span-5">
                    <Label htmlFor="ai-topic" className="text-xs font-medium">
                      Konu / Başlık Fikri
                    </Label>
                    <Input
                      id="ai-topic"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder={
                        aiSourceUrl.trim()
                          ? "Boş bırakılırsa sayfa başlığı kullanılır"
                          : "Örn: Kapadokya'da 2 günlük rota"
                      }
                      className="h-9 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-4">
                    <Label htmlFor="ai-city" className="text-xs font-medium">
                      Hedef Şehir (Opsiyonel)
                    </Label>
                    <Select
                      value={aiCity || "none"}
                      onValueChange={(v) => {
                        const next = !v || v === "none" ? "" : v;
                        setAiCity(next);
                        if (next) setCitySlug(next);
                      }}
                    >
                      <SelectTrigger id="ai-city" className="h-9 bg-background text-xs">
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="none">Şehir seçilmedi</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city.slug} value={city.slug}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end sm:col-span-3">
                    <Button
                      type="button"
                      onClick={generateWithAi}
                      disabled={aiPending || (!aiTopic.trim() && !aiSourceUrl.trim())}
                      className="h-9 w-full gap-1.5 text-xs font-semibold"
                    >
                      {aiPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>Üretiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Taslak Oluştur</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DisclosureSection>

            <section className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Rehber Başlığı <span aria-hidden="true">*</span>
                  </Label>
                  <span className={`text-[11px] font-medium ${titleCharTone}`}>
                    {title.trim().length} / 35–65 kr
                  </span>
                </div>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Gezi rehberi başlığını girin..."
                  className="h-10 text-sm font-semibold"
                  required
                  aria-invalid={attemptedSubmit && !title.trim() ? true : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-xs font-semibold">
                  Kısa Özet (Liste &amp; Arama Motorları İçin)
                </Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Liste ve arama motorları için kısa özet"
                  className="w-full min-h-[3.5lh] max-h-[8lh] text-xs leading-relaxed"
                />
              </div>

              <input type="hidden" name="content" value={content} />
              <div className="border-t border-border/60 pt-4">
                <EditorialMarkdownEditor
                  id="content-editor"
                  label="Rehber Metni"
                  value={content}
                  onChange={setContent}
                  title={title}
                  onCleanTitle={setTitle}
                  uploadFolder="articles"
                  slugHint={slug || title || "yazi"}
                  targetMinChars={3500}
                  targetMaxChars={8000}
                  required
                  invalid={attemptedSubmit && !content.trim()}
                  placeholder="Giriş paragrafı ile başlayın. Ardından şehrin tarihi, gezilecek yerleri ve pratik ipuçları için ## Alt Başlıklar ekleyin..."
                />
              </div>
            </section>
          </>
        }
        aside={
          <>
            <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sınıflandırma
              </h2>

              <div className="space-y-2">
                <Label htmlFor="city_slug" className="text-xs font-semibold">
                  İlişkili Şehir
                </Label>
                <input type="hidden" name="city_slug" value={citySlug} />
                <Select
                  value={citySlug}
                  onValueChange={(v) => setCitySlug(!v || v === "none" ? "none" : v)}
                >
                  <SelectTrigger id="city_slug" className="h-9 text-xs">
                    <SelectValue placeholder="Şehir rehberi olarak bağla">
                      {citySlug === "none"
                        ? "Bağlı değil"
                        : cities.find((c) => c.slug === citySlug)?.name || "Şehir seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">Bağlı değil</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.slug} value={city.slug}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
              <CoverImageInput
                compact
                value={coverImage}
                onChange={setCoverImage}
                folder="articles"
                slugHint={slug || title || "yazi"}
                label="Kapak Görseli"
                name="cover_image"
              />
            </section>

            {articleImages.length > 0 && (
              <DisclosureSection
                title="Yazı Görselleri"
                icon={<Images className="h-4 w-4 text-primary" aria-hidden="true" />}
                badge={`${articleImages.length} görsel`}
                defaultOpen={false}
              >
                <ArticleImageGallery
                  images={articleImages}
                  coverImage={coverImage}
                  onSetCover={setCoverImage}
                  className="border-0 bg-transparent p-0"
                />
              </DisclosureSection>
            )}

            <DisclosureSection
              title="Kalite Kontrolü"
              icon={<CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />}
              badge={
                articleEvaluation.isReady
                  ? "Yayına Hazır"
                  : `${articleEvaluation.wordCount} kelime`
              }
              badgeTone={articleEvaluation.isReady ? "success" : "warning"}
              defaultOpen={!articleEvaluation.isReady}
            >
              <EditorialChecklist
                evaluation={articleEvaluation}
                title="Blog yazısı kalite kontrolü"
              />
            </DisclosureSection>

            <DisclosureSection
              title="URL (Slug) & SEO Meta"
              icon={<Link2 className="h-4 w-4 text-primary" aria-hidden="true" />}
              badge={slugPreview}
              defaultOpen={false}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="slug" className="text-xs font-semibold">
                    Kalıcı Bağlantı (Slug)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setSlug(slugify(title))}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    title="Başlıktan temiz URL kısa adı üret"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" />
                    Yenile
                  </button>
                </div>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="yazi-basligi"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="meta_title" className="text-xs font-semibold">
                    Meta Başlık
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {metaTitle.length} / 55 kr
                  </span>
                </div>
                <Input
                  id="meta_title"
                  name="meta_title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Boş bırakılırsa yazı başlığı kullanılır (marka adı hariç)"
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Site adı (&ldquo;| Seni de Bekleriz&rdquo;) otomatik eklenir.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="meta_description" className="text-xs font-semibold">
                    Meta Açıklama
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {metaDescription.length} / 155 kr
                  </span>
                </div>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="125-155 karakter arası tam cümle önerilir"
                  className="text-xs leading-relaxed"
                />
              </div>
            </DisclosureSection>
          </>
        }
      />
    </form>
  );
}
