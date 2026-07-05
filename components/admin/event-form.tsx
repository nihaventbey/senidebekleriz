"use client";

import { useState } from "react";
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
import { slugify } from "@/lib/slugify";
import { ArrowLeft, Trash2 } from "lucide-react";
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
  const [eventType, setEventType] = useState(defaultValues.event_type || "duyuru");
  const [citySlug, setCitySlug] = useState(defaultValues.city_slug || "none");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!defaultValues.slug && !slug) {
      setSlug(slugify(value));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/etkinlikler">
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
            <Label htmlFor="slug">Slug</Label>
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
              onValueChange={(v) => setEventType(!v ? "duyuru" : v)}
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
          <Label htmlFor="summary">Özet (slider, max 160)</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={2}
            maxLength={160}
            defaultValue={defaultValues.summary || ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama (opsiyonel)</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={defaultValues.description || ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="source_name">Kaynak Adı</Label>
            <Input
              id="source_name"
              name="source_name"
              defaultValue={defaultValues.source_name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_name">Mekan</Label>
            <Input
              id="venue_name"
              name="venue_name"
              defaultValue={defaultValues.venue_name || ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source_url">Kaynak URL</Label>
            <Input
              id="source_url"
              name="source_url"
              type="url"
              defaultValue={defaultValues.source_url || ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ticket_url">Bilet URL</Label>
            <Input
              id="ticket_url"
              name="ticket_url"
              type="url"
              defaultValue={defaultValues.ticket_url || ""}
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
          <div className="space-y-2">
            <Label htmlFor="cover_image">Kapak Görseli URL</Label>
            <Input
              id="cover_image"
              name="cover_image"
              defaultValue={defaultValues.cover_image || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts_at">Başlangıç</Label>
            <Input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaultValues.starts_at)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends_at">Bitiş</Label>
            <Input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(defaultValues.ends_at)}
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

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              name="is_featured"
              defaultChecked={defaultValues.is_featured ?? false}
            />
            <Label htmlFor="is_featured">Slider&apos;da öne çıkar</Label>
          </div>
          {!defaultValues.status || defaultValues.status === "pending_review" ? (
            <div className="flex items-center gap-2">
              <Checkbox id="publish_now" name="publish_now" />
              <Label htmlFor="publish_now">Hemen yayınla</Label>
            </div>
          ) : null}
        </div>

        <SubmitButton>Kaydet</SubmitButton>
      </form>
    </div>
  );
}
