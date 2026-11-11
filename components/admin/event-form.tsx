"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/admin/submit-button";
import { MetaFields } from "@/components/admin/meta-fields";
import { CoverImageInput } from "@/components/admin/cover-image-input";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";
import { ArrowLeft, Check, Eye, Loader2, Sparkles, Trash2 } from "lucide-react";
import type { CulturalEventRow } from "@/lib/events/types";

type CityOption = { slug: string; name: string };

type EventFormProps = {
  action: (formData: FormData) => Promise<void>;
  cities: CityOption[];
  deleteAction?: () => Promise<void>;
  defaultValues?: Partial<CulturalEventRow>;
};

const EVENT_TYPES = [
  { value: "tiyatro", label: "Tiyatro" },
  { value: "konser", label: "Konser" },
  { value: "sergi", label: "Sergi" },
  { value: "festival", label: "Festival" },
  { value: "duyuru", label: "Duyuru" },
  { value: "diger", label: "Diğer" },
];

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  action,
  cities,
  deleteAction,
  defaultValues = {},
}: EventFormProps) {
  const [title, setTitle] = useState(defaultValues.title || "");
  const [slug, setSlug] = useState(defaultValues.slug || "");
  const [summary, setSummary] = useState(defaultValues.summary || "");
  const [description, setDescription] = useState(defaultValues.description || "");
  const [eventType, setEventType] = useState(defaultValues.event_type || "duyuru");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");
  const [venueName, setVenueName] = useState(defaultValues.venue_name || "");
  const [sourceName, setSourceName] = useState(defaultValues.source_name || "");
  const [sourceUrl, setSourceUrl] = useState(defaultValues.source_url || "");
  const [ticketUrl, setTicketUrl] = useState(defaultValues.ticket_url || "");
  const [coverImage, setCoverImage] = useState(defaultValues.cover_image || "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(defaultValues.starts_at));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(defaultValues.ends_at));

  const [aiSourceUrl, setAiSourceUrl] = useState(defaultValues.source_url || "");
  const [aiTopic, setAiTopic] = useState("");
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [isPublishedState, setIsPublishedState] = useState<boolean>(
    defaultValues.status ? defaultValues.status === "published" : true
  );
  const [isFeaturedState, setIsFeaturedState] = useState<boolean>(
    defaultValues.is_featured ?? false
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
      toast.error("Etkinlik konusu veya kaynak URL girin");
      return;
    }

    startAiTransition(async () => {
      try {
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
        if (data.starts_at) setStartsAt(toDatetimeLocal(data.starts_at));
        if (data.ends_at) setEndsAt(toDatetimeLocal(data.ends_at));

        toast.success("AI etkinlik taslağı oluşturuldu! 🎭");
      } catch (err: any) {
        toast.error(err.message || "Taslak üretilemedi");
      }
    });
  }

  useEffect(() => {
    if (defaultValues.source_url && !defaultValues.title && !title) {
      generateWithAi(defaultValues.source_url);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
            <Link href="/yonetim/etkinlikler">
              <ArrowLeft className="h-4 w-4" />
              Etkinliklere Dön
            </Link>
          </Button>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isPublishedState
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isPublishedState ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isPublishedState
              ? "Durum: Yayında"
              : "Durum: Onay Bekliyor / Taslak (Sitede Görünmez)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {defaultValues.slug && isPublishedState && (
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
              <Link href={`/etkinlik/${defaultValues.slug}`} target="_blank">
                <Eye className="h-3.5 w-3.5" />
                Sitede Gör
              </Link>
            </Button>
          )}
          {deleteAction && (
            <form action={deleteAction}>
              <Button type="submit" variant="destructive" size="sm" className="text-xs gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* AI Event Draft Generator Card */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            URL&apos;den veya Konudan AI ile Etkinlik Üret
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Biletix, Biletinial, Kültür Portalı veya festival linki yapıştırın ya da etkinlik adını yazın. AI tarih, saat, mekan, şehir, açıklama ve kapak görselini otomatik doldurur.
        </p>

        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-1.5 sm:col-span-5">
            <Label htmlFor="ai-source-url" className="text-xs font-medium">
              Etkinlik URL&apos;si
            </Label>
            <Input
              id="ai-source-url"
              type="url"
              value={aiSourceUrl}
              onChange={(e) => setAiSourceUrl(e.target.value)}
              placeholder="https://biletinial.com/... veya etkinlik linki"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-4">
            <Label htmlFor="ai-topic" className="text-xs font-medium">
              Etkinlik Adı / Konu (Opsiyonel)
            </Label>
            <Input
              id="ai-topic"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Örn: Fazıl Say Konseri Ankara"
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-end sm:col-span-3">
            <Button
              type="button"
              onClick={() => generateWithAi()}
              disabled={aiPending || (!aiSourceUrl.trim() && !aiTopic.trim())}
              className="w-full h-9 text-xs font-semibold gap-1.5"
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
      </div>

      <form action={action} className="space-y-6 rounded-lg border p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
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
            <Label htmlFor="slug">Kalıcı Bağlantı (Kısa Adres)</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_type">Etkinlik Tipi</Label>
            <input type="hidden" name="event_type" value={eventType} />
            <Select
              value={eventType}
              onValueChange={(v) => setEventType(!v ? "duyuru" : (v as any))}
            >
              <SelectTrigger>
                <SelectValue />
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

        <div className="space-y-2">
          <Label htmlFor="summary">Kısa Özet (En fazla 160 karakter)</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={2}
            maxLength={160}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama (opsiyonel)</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source_name">Kaynak Adı</Label>
            <Input
              id="source_name"
              name="source_name"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_name">Mekan</Label>
            <Input
              id="venue_name"
              name="venue_name"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source_url">Kaynak URL</Label>
            <Input
              id="source_url"
              name="source_url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ticket_url">Bilet URL</Label>
            <Input
              id="ticket_url"
              name="ticket_url"
              type="url"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city_slug">Şehir</Label>
            <input type="hidden" name="city_slug" value={citySlug} />
            <Select
              value={citySlug}
              onValueChange={(v) => setCitySlug(!v || v === "none" ? "none" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Şehir seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seçilmedi</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <CoverImageInput
              value={coverImage}
              onChange={setCoverImage}
              folder="events"
              slugHint={slug || title || "etkinlik"}
              label="Kapak Görseli URL"
              name="cover_image"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts_at">Başlangıç</Label>
            <Input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends_at">Bitiş</Label>
            <Input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires_at">Yayından Kalkma (opsiyonel)</Label>
            <Input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaultValues.expires_at)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sıra</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={defaultValues.sort_order ?? 0}
            />
          </div>
        </div>

        <MetaFields
          type="event"
          entityName={title}
          cityName={
            cities.find((c) => c.slug === citySlug)?.name || undefined
          }
          description={summary || undefined}
          defaultMetaTitle={defaultValues.meta_title}
          defaultMetaDescription={defaultValues.meta_description}
        />

        <input
          type="hidden"
          name="publish_now"
          value={isPublishedState ? "true" : "false"}
        />
        <input
          type="hidden"
          name="is_published"
          value={isPublishedState ? "true" : "false"}
        />
        <input
          type="hidden"
          name="is_featured"
          value={isFeaturedState ? "true" : "false"}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/60 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={isFeaturedState}
              onChange={(e) => setIsFeaturedState(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <span>🔥 Vitrin Slider&apos;ında Göster (Anasayfa büyük slider alanında yer alır)</span>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs">
              <Link href="/yonetim/etkinlikler">Vazgeç</Link>
            </Button>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={savePending}
              onClick={() => setIsPublishedState(false)}
              className="text-xs font-semibold gap-1.5"
            >
              📝 Taslak Olarak Kaydet
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={savePending}
              onClick={() => setIsPublishedState(true)}
              className="text-xs font-bold gap-1.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {defaultValues.status === "published"
                ? "Güncelle (Yayında)"
                : "🚀 Kaydet ve Yayına Al"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
