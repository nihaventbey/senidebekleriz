"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
import { SwitchControl } from "@/components/ui/switch-control";
import { DisclosureSection } from "@/components/admin/editorial/disclosure-section";
import { EditorialShell } from "@/components/admin/editorial/editorial-shell";
import { Link2, Loader2, RotateCw, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { slugify } from "@/lib/slugify";
import { cleanPublisherText } from "@/lib/ai/clean-publisher";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { CoverImageInput } from "@/components/admin/cover-image-input";
import { EditorialActionBar } from "@/components/admin/editorial-action-bar";
import { EditorialMarkdownEditor } from "@/components/admin/editorial-markdown-editor";
import type { NewsActionResult } from "@/lib/actions/news";

type CityOption = { slug: string; name: string };

const CATEGORY_OPTIONS = [
  { value: "arkeoloji", label: "Arkeoloji & Kazı" },
  { value: "restorasyon", label: "Tarihi Miras & Restorasyon" },
  { value: "muze_sergi", label: "Müze & Sergi" },
  { value: "sinema", label: "Sinema & Görsel Sanatlar" },
  { value: "kultur_sanat", label: "Kültür & Sanat" },
  { value: "festival_haberleri", label: "Festival Gündemi" },
  { value: "genel", label: "Genel Kültür" },
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
  const formRef = useRef<HTMLFormElement>(null);

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

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [aiSourceUrl, setAiSourceUrl] = useState(initialSourceUrl || defaultValues.source_url || "");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDepth, setAiDepth] = useState<"standard" | "deep" | "comprehensive">("standard");

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
        setStatusMessage("Yapay zeka haber taslağı hazırlanıyor...");
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

        const charCount = data.content ? data.content.length : 0;
        const countMsg = data.word_count
          ? ` (${charCount.toLocaleString("tr-TR")} kr · ${data.word_count} kelime)`
          : "";
        setStatusMessage(`Haber taslağı hazırlandı.${countMsg}`);
        toast.success(`Haber taslağı ve kapak görseli hazırlandı!${countMsg}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Taslak üretilemedi";
        setStatusMessage(msg);
        toast.error(msg);
      }
    });
  }

  useEffect(() => {
    if (initialSourceUrl && !title && !content && !defaultValues.title) {
      generateWithAi(initialSourceUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceUrl]);

  async function saveWithStatus(publishState: boolean) {
    setAttemptedSubmit(true);
    const cleanTitle = cleanPublisherText(title.trim()) || title.trim();
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
      toast.error("Eksik Alan", "Lütfen haber başlığını girin.");
      document.getElementById("title")?.focus();
      return;
    }
    if (!cleanContent) {
      toast.error("Eksik Alan", "Lütfen haber metnini girin.");
      document.getElementById("content-editor")?.focus();
      return;
    }

    setIsPublished(publishState);
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
    formData.set("is_published", publishState ? "true" : "false");
    formData.set("is_featured", isFeatured ? "true" : "false");

    startSaveTransition(async () => {
      try {
        setStatusMessage("Haber kaydediliyor...");
        const result = await action(formData);
        if (!result.success) {
          setStatusMessage(result.error || "Kaydedilemedi");
          toast.error("Kaydedilemedi", result.error);
          return;
        }

        const msg = publishState
          ? "Haber yayına alındı"
          : "Haber taslak olarak kaydedildi";
        setStatusMessage(msg);
        toast.success(msg);
        router.push("/yonetim/haberler");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        setStatusMessage(msg);
        toast.error("Kaydetme Hatası", msg);
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const targetPublish =
      submitter?.value === "publish"
        ? true
        : submitter?.value === "draft"
        ? false
        : isPublished;
    await saveWithStatus(targetPublish);
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
      } catch (err) {
        toast.error("Silinemedi", err instanceof Error ? err.message : undefined);
      }
    });
  }

  const titleCharTone =
    title.trim().length >= 50 && title.trim().length <= 95
      ? "text-emerald-600 dark:text-emerald-400"
      : title.trim().length === 0
      ? "text-muted-foreground"
      : "text-amber-600 dark:text-amber-400";

  const summaryCharTone =
    summary.trim().length >= 200 && summary.trim().length <= 340
      ? "text-emerald-600 dark:text-emerald-400"
      : summary.trim().length === 0
      ? "text-muted-foreground"
      : "text-amber-600 dark:text-amber-400";

  const slugPreview = slug ? `/${slug.slice(0, 20)}${slug.length > 20 ? "…" : ""}` : "Otomatik";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <EditorialShell
        header={
          <EditorialActionBar
            heading={currentSlug ? "Haberi Düzenle" : "Yeni Kültür Haberi"}
            backHref="/yonetim/haberler"
            backLabel="Haberler"
            publicHref={currentSlug ? `/haber/${currentSlug}` : undefined}
            isPublished={isPublished}
            isEdit={Boolean(currentSlug)}
            isFeatured={isFeatured}
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
              title="AI ile Haber Üret"
              description="URL veya konu girerek metin, 5N1K özeti ve WebP kapak görseli oluşturun."
              icon={<Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
              badge={aiPending ? "Üretiliyor..." : "URL / Konu"}
              badgeTone={aiPending ? "primary" : "neutral"}
              tone="accent"
              defaultOpen={!currentSlug}
            >
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
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="h-9 bg-background text-xs"
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
                      className="h-9 bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ai-depth" className="text-xs font-medium">
                      Uzunluk Hedefi
                    </Label>
                    <Select
                      value={aiDepth}
                      onValueChange={(val) => {
                        if (val === "standard" || val === "deep" || val === "comprehensive") {
                          setAiDepth(val);
                        }
                      }}
                    >
                      <SelectTrigger id="ai-depth" className="h-9 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard" className="text-xs">
                          Odaklı Haber (2.600–4.200 kr)
                        </SelectItem>
                        <SelectItem value="deep" className="text-xs">
                          Geniş Haber (4.000–5.500 kr)
                        </SelectItem>
                        <SelectItem value="comprehensive" className="text-xs">
                          Kapsamlı Dosya (5.500–7.500 kr)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => generateWithAi()}
                      disabled={aiPending || (!aiSourceUrl.trim() && !aiTopic.trim())}
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
                          <span>Haberi Otomatik Yaz</span>
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
                    Haber Başlığı <span aria-hidden="true">*</span>
                  </Label>
                  <span className={`text-[11px] font-medium ${titleCharTone}`}>
                    {title.trim().length} / 55–90 kr
                  </span>
                </div>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Haber başlığını girin..."
                  className="h-10 text-sm font-semibold"
                  required
                  aria-invalid={attemptedSubmit && !title.trim() ? true : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="summary" className="text-xs font-semibold">
                    Haber Özeti (5N1K Spot Cümlesi)
                  </Label>
                  <span className={`text-[11px] font-medium ${summaryCharTone}`}>
                    {summary.trim().length} / 220–340 kr
                  </span>
                </div>
                <Textarea
                  id="summary"
                  name="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Haberin ana fikrini 5N1K çerçevesinde özetleyen 2-3 cümlelik spot metin..."
                  rows={2}
                  maxLength={400}
                  className="w-full min-h-[3.5lh] max-h-[8lh] text-xs leading-relaxed"
                />
              </div>

              <input type="hidden" name="content" value={content} />
              <div className="border-t border-border/60 pt-4">
                <EditorialMarkdownEditor
                  id="content-editor"
                  label="Haber Metni"
                  value={content}
                  onChange={setContent}
                  title={title}
                  sourceName={sourceName}
                  onCleanTitle={setTitle}
                  uploadFolder="news"
                  slugHint={slug || title || "haber"}
                  targetMinChars={2600}
                  targetMaxChars={4200}
                  required
                  invalid={attemptedSubmit && !content.trim()}
                  placeholder="Giriş paragrafı ile başlayın. Ardından 2-3 adet konuya özgü ## Alt Başlık ekleyin..."
                />
              </div>
            </section>
          </>
        }
        aside={
          <>
            <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Yayın &amp; Sınıflandırma
              </h2>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-semibold">
                  Kategori <span aria-hidden="true">*</span>
                </Label>
                <input type="hidden" name="category" value={category} />
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger id="category" className="h-9 text-xs">
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
                  <SelectTrigger id="city_slug" className="h-9 text-xs">
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

              <SwitchControl
                id="news-is-featured"
                label="Vitrin Slider'ında Göster"
                description="Kapalıysa küçük görselli manşet listesinde yer alır."
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
              <CoverImageInput
                compact
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
            </section>

            <DisclosureSection
              title="URL & Kaynak Bilgileri"
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
                    onClick={() => setSlug(slugify(cleanPublisherText(title) || title))}
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
                  placeholder="haber-basligi"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-9 font-mono text-xs"
                  aria-describedby={!currentSlug ? "news-slug-hint" : undefined}
                />
                {!currentSlug && (
                  <p id="news-slug-hint" className="text-[11px] text-muted-foreground">
                    Yeni haber kaydedilirken URL çakışmasını önlemek için sonuna otomatik 6 haneli benzersiz kod eklenir.
                  </p>
                )}
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
                  Kaynak Bağlantısı (URL)
                </Label>
                <Input
                  id="source_url"
                  name="source_url"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="h-9 text-xs"
                />
              </div>
            </DisclosureSection>
          </>
        }
      />
    </form>
  );
}
