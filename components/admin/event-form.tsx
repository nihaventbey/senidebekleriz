"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
import { MetaFields } from "@/components/admin/meta-fields";
import { CoverImageInput } from "@/components/admin/cover-image-input";
import { AiImageModal } from "@/components/admin/ai-image-modal";
import { EditorialActionBar } from "@/components/admin/editorial-action-bar";
import { EditorialMarkdownEditor } from "@/components/admin/editorial-markdown-editor";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";
import { cleanPublisherText } from "@/lib/ai/clean-publisher";
import { Calendar, Check, Loader2, RotateCw, Sparkles } from "lucide-react";
import type { CulturalEventRow, EventType } from "@/lib/events/types";
import type { EventActionResult } from "@/lib/actions/events";

type CityOption = { slug: string; name: string };

type EventFormProps = {
  action: (formData: FormData) => Promise<EventActionResult>;
  cities: CityOption[];
  currentSlug?: string;
  initialSourceUrl?: string;
  deleteAction?: () => Promise<void>;
  defaultValues?: Partial<CulturalEventRow>;
};

const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "tiyatro", label: "🎭 Tiyatro" },
  { value: "konser", label: "🎵 Konser" },
  { value: "sergi", label: "🖼️ Sergi" },
  { value: "festival", label: "🎪 Festival" },
  { value: "duyuru", label: "📢 Duyuru" },
  { value: "diger", label: "🎨 Diğer Kültür" },
];

function toIstanbulDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

function formatLocalDateOffset(daysOffset: number, hour: string, minute = "00"): string {
  const target = new Date(Date.now() + daysOffset * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "01";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${minute}`;
}

function getNextSaturdayDate(hour: string): string {
  const now = new Date();
  const trDayFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
  }).format(now);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const currentDay = dayMap[trDayFmt] ?? now.getDay();
  const daysUntilSat = (6 - currentDay + 7) % 7;
  return formatLocalDateOffset(daysUntilSat, hour);
}

function toIstanbulIsoPayload(localVal: string): string {
  const trimmed = localVal.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00+03:00`;
  }
  return trimmed;
}

export function EventForm({
  action,
  cities,
  currentSlug,
  initialSourceUrl,
  deleteAction,
  defaultValues = {},
}: EventFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState(defaultValues.title || "");
  const [slug, setSlug] = useState(defaultValues.slug || "");
  const [summary, setSummary] = useState(defaultValues.summary || "");
  const [description, setDescription] = useState(defaultValues.description || "");
  const [eventType, setEventType] = useState<EventType>(defaultValues.event_type || "duyuru");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");
  const [venueName, setVenueName] = useState(defaultValues.venue_name || "");
  const [sourceName, setSourceName] = useState(defaultValues.source_name || "");
  const [sourceUrl, setSourceUrl] = useState(
    defaultValues.source_url || initialSourceUrl || ""
  );
  const [ticketUrl, setTicketUrl] = useState(defaultValues.ticket_url || "");
  const [coverImage, setCoverImage] = useState(defaultValues.cover_image || "");
  const [startsAt, setStartsAt] = useState(toIstanbulDatetimeLocal(defaultValues.starts_at));
  const [endsAt, setEndsAt] = useState(toIstanbulDatetimeLocal(defaultValues.ends_at));
  const [expiresAt, setExpiresAt] = useState(toIstanbulDatetimeLocal(defaultValues.expires_at));
  const [sortOrder, setSortOrder] = useState(String(defaultValues.sort_order ?? 0));

  const [isPublishedState, setIsPublishedState] = useState<boolean>(
    defaultValues.status ? defaultValues.status === "published" : true
  );
  const [isFeaturedState, setIsFeaturedState] = useState<boolean>(
    defaultValues.is_featured ?? false
  );
  const [isFreeState, setIsFreeState] = useState<boolean>(
    Boolean(defaultValues.is_free || defaultValues.raw_payload?.is_free)
  );

  const [aiSourceUrl, setAiSourceUrl] = useState(
    initialSourceUrl || defaultValues.source_url || ""
  );
  const [aiTopic, setAiTopic] = useState("");
  const [aiMetaSeed, setAiMetaSeed] = useState({
    title: defaultValues.meta_title || "",
    description: defaultValues.meta_description || "",
    version: 0,
  });

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!defaultValues.slug) {
      setSlug(slugify(value));
    }
  }

  function generateWithAi(overrideUrl?: string) {
    const targetUrl = (overrideUrl || aiSourceUrl || "").trim();
    if (!aiTopic.trim() && !targetUrl) {
      toast.error("Etkinlik konusu veya kaynak URL girin");
      return;
    }

    startAiTransition(async () => {
      try {
        setStatusMessage("Yapay zeka etkinlik taslağı hazırlanıyor...");
        const res = await fetch("/api/admin/ai-event-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: aiTopic.trim(),
            sourceUrl: targetUrl,
            cityName: cities.find((c) => c.slug === citySlug)?.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI etkinlik üretimi başarısız");

        if (data.title) {
          setTitle(data.title);
          if (!defaultValues.slug) setSlug(slugify(data.title));
        }
        if (data.summary) setSummary(data.summary);
        if (data.description) setDescription(data.description);
        if (data.event_type) setEventType(data.event_type);
        if (data.city_slug) setCitySlug(data.city_slug);
        if (data.venue_name) setVenueName(data.venue_name);
        if (data.source_name) setSourceName(data.source_name);
        if (data.source_url) {
          setSourceUrl(data.source_url);
          setAiSourceUrl(data.source_url);
        }
        if (data.ticket_url) setTicketUrl(data.ticket_url);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (data.starts_at) setStartsAt(toIstanbulDatetimeLocal(data.starts_at));
        if (data.ends_at) setEndsAt(toIstanbulDatetimeLocal(data.ends_at));
        if (typeof data.is_free === "boolean") setIsFreeState(data.is_free);
        if (data.meta_title || data.meta_description) {
          setAiMetaSeed((prev) => ({
            title: data.meta_title || prev.title,
            description: data.meta_description || prev.description,
            version: prev.version + 1,
          }));
        }

        setStatusMessage("Etkinlik taslağı oluşturuldu.");
        toast.success("AI etkinlik taslağı oluşturuldu! 🎭");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Taslak üretilemedi";
        setStatusMessage(msg);
        toast.error(msg);
      }
    });
  }

  useEffect(() => {
    if (initialSourceUrl && !defaultValues.title && !title) {
      generateWithAi(initialSourceUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceUrl]);

  async function saveWithStatus(publishState: boolean) {
    setAttemptedSubmit(true);
    const cleanTitle = cleanPublisherText(title.trim()) || title.trim();

    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      const firstInvalid = formRef.current.querySelector<HTMLElement>(":invalid");
      firstInvalid?.focus();
      return;
    }

    if (!cleanTitle) {
      toast.error("Eksik Alan", "Lütfen etkinlik başlığını girin.");
      document.getElementById("title")?.focus();
      return;
    }
    if (!summary.trim()) {
      toast.error("Eksik Alan", "Lütfen kısa özet girin.");
      document.getElementById("summary")?.focus();
      return;
    }

    setIsPublishedState(publishState);

    const formData = new FormData(formRef.current || undefined);
    const finalSlug = slugify(slug.trim() || cleanTitle) || "etkinlik";

    formData.set("title", cleanTitle);
    formData.set("slug", finalSlug);
    formData.set("summary", summary.trim());
    formData.set("description", description.trim());
    formData.set("event_type", eventType);
    formData.set("city_slug", citySlug || "none");
    formData.set("venue_name", venueName.trim());
    formData.set("source_name", sourceName.trim());
    formData.set("source_url", sourceUrl.trim());
    formData.set("ticket_url", ticketUrl.trim());
    formData.set("cover_image", coverImage.trim());
    formData.set("starts_at", toIstanbulIsoPayload(startsAt));
    formData.set("ends_at", toIstanbulIsoPayload(endsAt));
    formData.set("expires_at", toIstanbulIsoPayload(expiresAt));
    formData.set("sort_order", sortOrder || "0");
    formData.set("publish_now", publishState ? "true" : "false");
    formData.set("is_published", publishState ? "true" : "false");
    formData.set("is_featured", isFeaturedState ? "true" : "false");
    formData.set("is_free", isFreeState ? "true" : "false");

    startSaveTransition(async () => {
      try {
        setStatusMessage("Etkinlik kaydediliyor...");
        const result = await action(formData);
        if (!result.success) {
          setStatusMessage(result.error || "Kaydedilemedi");
          toast.error("Kaydedilemedi", result.error);
          return;
        }

        const msg = publishState
          ? "Etkinlik yayına alındı! 🚀"
          : "Etkinlik taslak olarak kaydedildi! 📝";
        setStatusMessage(msg);
        toast.success(msg);
        router.push("/yonetim/etkinlikler");
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
        : isPublishedState;
    await saveWithStatus(targetPublish);
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("Bu etkinliği kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteAction();
        toast.success("Etkinlik silindi");
        router.push("/yonetim/etkinlikler");
        router.refresh();
      } catch (err) {
        toast.error("Silinemedi", err instanceof Error ? err.message : undefined);
      }
    });
  }

  function applyExhibitionEndPreset() {
    const base = startsAt ? new Date(toIstanbulIsoPayload(startsAt)) : new Date();
    const validBase = Number.isNaN(base.getTime()) ? new Date() : base;
    const endIso = new Date(validBase.getTime() + 45 * 86_400_000).toISOString();
    const localEnd = toIstanbulDatetimeLocal(endIso);
    setEndsAt(localEnd ? `${localEnd.slice(0, 10)}T19:00` : "");
  }

  const summaryCharTone =
    summary.trim().length >= 90 && summary.trim().length <= 160
      ? "text-emerald-600 dark:text-emerald-400"
      : summary.trim().length === 0
      ? "text-muted-foreground"
      : "text-amber-600 dark:text-amber-400";

  const activeSlug = currentSlug || defaultValues.slug;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="max-w-5xl space-y-6"
    >
      <EditorialActionBar
        backHref="/yonetim/etkinlikler"
        backLabel="Etkinliklere Dön"
        publicHref={activeSlug ? `/etkinlik/${activeSlug}` : undefined}
        isPublished={isPublishedState}
        isEdit={Boolean(activeSlug)}
        isFeatured={isFeaturedState}
        savePending={savePending}
        deletePending={deletePending}
        hasDelete={Boolean(deleteAction)}
        statusAnnouncement={statusMessage}
        draftLabel="Onay Bekliyor / Taslak"
        onSaveDraft={() => saveWithStatus(false)}
        onSavePublish={() => saveWithStatus(true)}
        onDelete={handleDelete}
      />

      {/* AI Event Draft Generator Card */}
      <section
        aria-label="Yapay zeka etkinlik üretim aracı"
        className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            URL&apos;den veya Konudan AI ile Etkinlik Üret
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Biletix, Biletinial, Kültür Portalı veya festival linki yapıştırın ya da etkinlik adını yazın. AI tarih, saat, mekân, şehir, açıklama (1.400–2.400 kr) ve kapak görselini otomatik doldurur.
        </p>

        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-1.5 sm:col-span-5">
            <Label htmlFor="ai-source-url" className="text-xs font-medium">
              Etkinlik Bağlantısı (URL)
            </Label>
            <Input
              id="ai-source-url"
              type="url"
              value={aiSourceUrl}
              onChange={(e) => setAiSourceUrl(e.target.value)}
              placeholder="https://biletinial.com/... veya etkinlik linki"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-9 bg-background text-xs"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-4">
            <Label htmlFor="ai-topic" className="text-xs font-medium">
              Etkinlik Adı / Konu (İsteğe Bağlı)
            </Label>
            <Input
              id="ai-topic"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Örn: Fazıl Say Konseri Ankara"
              className="h-9 bg-background text-xs"
            />
          </div>

          <div className="flex items-end sm:col-span-3">
            <Button
              type="button"
              onClick={() => generateWithAi()}
              disabled={aiPending || (!aiSourceUrl.trim() && !aiTopic.trim())}
              className="h-9 w-full gap-1.5 text-xs font-semibold"
            >
              {aiPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Üretiliyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI ile Doldur
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Temel Etkinlik Bilgileri */}
      <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-12">
          <div className="space-y-2 sm:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="title" className="text-xs font-semibold">
                Etkinlik Başlığı <span aria-hidden="true">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {title.trim().length} kr
              </span>
            </div>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Etkinlik adını girin..."
              className="h-10 text-sm font-semibold"
              required
              aria-invalid={attemptedSubmit && !title.trim() ? true : undefined}
            />
          </div>

          <div className="space-y-2 sm:col-span-4">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="slug" className="text-xs font-semibold">
                Kalıcı Bağlantı (Slug) <span aria-hidden="true">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setSlug(slugify(cleanPublisherText(title) || title))}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                title="Başlıktan temiz URL kısa adı üret"
              >
                <RotateCw className="h-3 w-3" /> Yenile
              </button>
            </div>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="etkinlik-basligi"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-10 font-mono text-xs"
              required
              aria-invalid={attemptedSubmit && !slug.trim() ? true : undefined}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="event_type" className="text-xs font-semibold">
              Etkinlik Tipi <span aria-hidden="true">*</span>
            </Label>
            <input type="hidden" name="event_type" value={eventType} />
            <Select
              value={eventType}
              onValueChange={(v) => setEventType((!v ? "duyuru" : v) as EventType)}
            >
              <SelectTrigger id="event_type" className="h-10 text-xs">
                <SelectValue>
                  {EVENT_TYPES.find((t) => t.value === eventType)?.label || "Tür"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kısa Özet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="summary" className="text-xs font-semibold">
              Kısa Özet (Kart &amp; SEO Spotu) <span aria-hidden="true">*</span>
            </Label>
            <span className={`text-[11px] font-medium ${summaryCharTone}`}>
              {summary.trim().length} / 160 karakter
            </span>
          </div>
          <Textarea
            id="summary"
            name="summary"
            rows={2}
            maxLength={180}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Etkinliğin tarihini, yerini ve içeriğini özetleyen 1-2 tam cümle..."
            className="w-full min-h-[3lh] max-h-[6lh] text-xs leading-relaxed"
            required
            aria-invalid={attemptedSubmit && !summary.trim() ? true : undefined}
          />
        </div>

        {/* Şehir, Mekân, Kaynak & Bilet Bilgileri */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="city_slug" className="text-xs font-semibold">
              Şehir
            </Label>
            <input type="hidden" name="city_slug" value={citySlug} />
            <Select
              value={citySlug}
              onValueChange={(v) => setCitySlug(!v || v === "none" ? "none" : v)}
            >
              <SelectTrigger id="city_slug" className="h-9 text-xs">
                <SelectValue placeholder="Şehir seçin">
                  {citySlug === "none"
                    ? "Türkiye Geneli / Belirsiz"
                    : cities.find((c) => c.slug === citySlug)?.name || "Şehir seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">Türkiye Geneli / Belirsiz</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_name" className="text-xs font-semibold">
              Mekân / Sahne
            </Label>
            <Input
              id="venue_name"
              name="venue_name"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Örn: AKM, CSO Ada Ankara"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_name" className="text-xs font-semibold">
              Kaynak Adı
            </Label>
            <Input
              id="source_name"
              name="source_name"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Örn: Biletinial, İKSV, Kültür Bakanlığı"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order" className="text-xs font-semibold">
              Vitrin Sırası
            </Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source_url" className="text-xs font-semibold">
              Kaynak URL
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

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ticket_url" className="text-xs font-semibold">
              Bilet / Başvuru URL
            </Label>
            <Input
              id="ticket_url"
              name="ticket_url"
              type="url"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder="https://biletinial.com/..."
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Tarih & Saat Alanı + Hızlı Kısayollar */}
        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Tarih ve Saat Takvimi (Türkiye Saati)</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStartsAt(formatLocalDateOffset(0, "20"))}
                className="rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
              >
                Bu Akşam 20:00
              </button>
              <button
                type="button"
                onClick={() => setStartsAt(getNextSaturdayDate("20"))}
                className="rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
              >
                Bu Cumartesi 20:00
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartsAt(formatLocalDateOffset(1, "10"));
                  setEndsAt(formatLocalDateOffset(46, "19"));
                }}
                className="rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
              >
                Yarın 10:00 (Sergi)
              </button>
              <button
                type="button"
                onClick={applyExhibitionEndPreset}
                className="rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
              >
                +45 Gün Bitiş
              </button>
              {(startsAt || endsAt) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartsAt("");
                    setEndsAt("");
                  }}
                  className="rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="starts_at" className="text-xs font-semibold">
                Başlangıç
              </Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ends_at" className="text-xs font-semibold">
                Bitiş
              </Label>
              <Input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expires_at" className="text-xs font-semibold">
                Yayından Kalkma (İsteğe Bağlı)
              </Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Kapak Görseli */}
        <div className="border-t border-border/50 pt-4">
          <CoverImageInput
            value={coverImage}
            onChange={setCoverImage}
            folder="events"
            slugHint={slug || title || "etkinlik"}
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
            initialCategory={eventType}
          />
        </div>

        {/* Etkinlik Açıklaması (Markdown Editör + Canlı Önizleme + SEO Ölçer) */}
        <input type="hidden" name="description" value={description} />
        <EditorialMarkdownEditor
          id="description-editor"
          label="Etkinlik Rehberi ve Açıklaması"
          value={description}
          onChange={setDescription}
          title={title}
          sourceName={sourceName}
          onCleanTitle={setTitle}
          uploadFolder="events"
          slugHint={slug || title || "etkinlik"}
          targetMinChars={1400}
          targetMaxChars={2400}
          placeholder="Giriş paragrafı ile başlayın. Ardından etkinliğe özgü 2 adet ## Alt Başlık altında sanatçı, program ve katılım bilgilerini aktarın..."
        />

        {/* SEO Meta */}
        <MetaFields
          key={`${defaultValues.meta_title || ""}-${aiMetaSeed.version}`}
          type="event"
          entityName={title}
          cityName={cities.find((c) => c.slug === citySlug)?.name || undefined}
          description={summary || undefined}
          defaultMetaTitle={aiMetaSeed.title || defaultValues.meta_title}
          defaultMetaDescription={
            aiMetaSeed.description || defaultValues.meta_description
          }
        />

        {/* Katılım, Vitrin ve Kaydet Çubuğu */}
        <div className="flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <input
                id="event-is-free"
                type="checkbox"
                checked={isFreeState}
                onChange={(e) => setIsFreeState(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label
                htmlFor="event-is-free"
                className="cursor-pointer text-xs font-semibold text-foreground"
              >
                🎟️ Ücretsiz / Halka Açık Etkinlik
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="event-is-featured"
                type="checkbox"
                checked={isFeaturedState}
                onChange={(e) => setIsFeaturedState(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label
                htmlFor="event-is-featured"
                className="cursor-pointer text-xs font-semibold text-foreground"
              >
                🔥 Vitrin Slider&apos;ında Göster
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" asChild className="text-xs">
              <Link href="/yonetim/etkinlikler">Vazgeç</Link>
            </Button>

            <Button
              type="submit"
              name="saveIntent"
              value="draft"
              variant="secondary"
              size="sm"
              disabled={savePending}
              className="gap-1.5 text-xs font-semibold"
            >
              📝 Taslak Olarak Kaydet
            </Button>

            <Button
              type="submit"
              name="saveIntent"
              value="publish"
              size="sm"
              disabled={savePending}
              className="gap-1.5 bg-emerald-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              {savePending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {defaultValues.status === "published"
                    ? "Güncelle (Yayında)"
                    : "🚀 Kaydet ve Yayına Al"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
