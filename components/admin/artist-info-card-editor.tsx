"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Globe2, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SwitchControl } from "@/components/ui/switch-control";
import { DisclosureSection } from "@/components/admin/editorial/disclosure-section";
import {
  normalizeArtistInfoCard,
  type ArtistInfoCard,
} from "@/lib/events/artist-info-card";
import { toast } from "@/lib/toast";

type ArtistInfoCardEditorProps = {
  value: ArtistInfoCard | null;
  onChange: (next: ArtistInfoCard | null) => void;
  eventTitle: string;
  eventSummary: string;
  eventDescription: string;
  eventType: string;
  globalShowArtistInfoCards: boolean;
};

function createEmptyCard(): ArtistInfoCard {
  return {
    enabled: true,
    entityName: "",
    entityType: "Sanatçı / Topluluk",
    origin: null,
    officialWebsite: null,
    summary: "",
    websiteNote: null,
    highlights: [],
    sourceLabel: "Editoryal bilgi notu",
    updatedAt: new Date().toISOString(),
  };
}

export function ArtistInfoCardEditor({
  value,
  onChange,
  eventTitle,
  eventSummary,
  eventDescription,
  eventType,
  globalShowArtistInfoCards,
}: ArtistInfoCardEditorProps) {
  const [searchHint, setSearchHint] = useState(value?.entityName || "");
  const [aiPending, startAiTransition] = useTransition();

  const card = value || createEmptyCard();
  const hasAnyData = Boolean(
    value &&
      (value.entityName ||
        value.summary ||
        value.websiteNote ||
        value.officialWebsite ||
        value.highlights.length > 0)
  );

  function updateField<K extends keyof ArtistInfoCard>(
    key: K,
    fieldVal: ArtistInfoCard[K]
  ) {
    const next: ArtistInfoCard = {
      ...card,
      [key]: fieldVal,
      updatedAt: new Date().toISOString(),
    };
    onChange(next);
  }

  function handleResearch() {
    if (!eventTitle.trim() && !searchHint.trim()) {
      toast.error("Araştırma için etkinlik başlığı veya sanatçı/topluluk adı girin.");
      return;
    }

    startAiTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-artist-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: eventTitle.trim() || searchHint.trim(),
            summary: eventSummary.trim() || null,
            description: eventDescription.trim().slice(0, 1200) || null,
            eventType,
            entityName: searchHint.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Bilgi kartı araştırılamadı.");
        }

        const normalized = normalizeArtistInfoCard(data.card);
        if (!normalized) {
          throw new Error("Geçerli bilgi kartı üretilemedi.");
        }

        onChange({
          ...normalized,
          enabled: normalized.enabled && (value ? value.enabled : true),
        });
        setSearchHint(normalized.entityName);
        toast.success("Sanatçı / topluluk bilgi kartı hazırlandı! ✨");
      } catch (err) {
        toast.error(
          "Bilgi kartı araştırılamadı",
          err instanceof Error ? err.message : undefined
        );
      }
    });
  }

  function handleClear() {
    onChange(null);
    setSearchHint("");
    toast.success("Etkinlik bilgi kartı temizlendi");
  }

  let badgeText = "Boş";
  let badgeTone: "neutral" | "success" | "warning" | "primary" = "neutral";
  if (hasAnyData) {
    const labelName = card.entityName.trim() || "Dolu";
    if (!globalShowArtistInfoCards) {
      badgeText = `Genel Ayar Kapalı · ${labelName}`;
      badgeTone = "warning";
    } else if (card.enabled) {
      badgeText = `Aktif · ${labelName}`;
      badgeTone = "success";
    } else {
      badgeText = `Gizli · ${labelName}`;
      badgeTone = "warning";
    }
  }

  return (
    <DisclosureSection
      title="Sanatçı, Orkestra veya Koreograf Bilgi Kartı"
      description="Resmi web sitesi ve sanatçı tanıtım kartını araştırın, düzenleyin veya gizleyin."
      icon={<Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />}
      badge={badgeText}
      badgeTone={badgeTone}
      defaultOpen={false}
    >
      <fieldset className="m-0 space-y-4 border-0 p-0">
        <legend className="sr-only">
          Sanatçı, Orkestra veya Koreograf Bilgi Kartı Alanları
        </legend>

      {!globalShowArtistInfoCards && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Bilgi kartları şu anda{" "}
            <Link
              href="/yonetim/gorunum#bilgi-kartlari"
              className="font-semibold underline underline-offset-2"
            >
              Site Görünümü ayarlarından
            </Link>{" "}
            site genelinde gizlenmiş durumda. Burada verileri düzenleyebilirsiniz, ancak ziyaretçilere görünmesi için genel ayarı açmanız gerekir.
          </p>
        </div>
      )}

      <SwitchControl
        id="artist-card-enabled"
        label="Bu etkinlik sayfasında bilgi kartını göster"
        description="Kapalıysa bu etkinliğin bilgi kartı ziyaretçilere gösterilmez."
        checked={card.enabled}
        onCheckedChange={(checked) => updateField("enabled", checked)}
      />

      {/* AI Research Bar */}
      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:grid-cols-12">
        <div className="space-y-1.5 sm:col-span-8">
          <Label htmlFor="artist-search-hint" className="text-xs font-semibold">
            Araştırılacak Sanatçı / Orkestra / Koreograf Adı (İsteğe Bağlı)
          </Label>
          <Input
            id="artist-search-hint"
            value={searchHint}
            onChange={(e) => setSearchHint(e.target.value)}
            placeholder="Örn: Viyana Senfoni Orkestrası, Evgeny Grinko, State Ballet of Georgia"
            className="h-9 bg-background text-xs"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <Button
            type="button"
            onClick={handleResearch}
            disabled={aiPending}
            className="h-9 flex-1 gap-1.5 text-xs font-semibold"
          >
            {aiPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Araştırılıyor...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                AI ile Resmi Siteyi Tara
              </>
            )}
          </Button>
          {hasAnyData && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClear}
              title="Bilgi kartını temizle"
              aria-label="Bilgi kartını temizle"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Editable Fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="artist-entity-name" className="text-xs font-semibold">
            Sanatçı / Topluluk Adı
          </Label>
          <Input
            id="artist-entity-name"
            value={card.entityName}
            onChange={(e) => updateField("entityName", e.target.value)}
            placeholder="Örn: Viyana Senfoni Orkestrası"
            className="h-9 bg-background text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="artist-entity-type" className="text-xs font-semibold">
            Tür / Rol
          </Label>
          <Input
            id="artist-entity-type"
            value={card.entityType}
            onChange={(e) => updateField("entityType", e.target.value)}
            placeholder="Örn: Senfoni Orkestrası, Bale Topluluğu"
            className="h-9 bg-background text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="artist-origin" className="text-xs font-semibold">
            Köken / Ülke
          </Label>
          <Input
            id="artist-origin"
            value={card.origin || ""}
            onChange={(e) => updateField("origin", e.target.value || null)}
            placeholder="Örn: Avusturya, Türkiye"
            className="h-9 bg-background text-xs"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="artist-official-website" className="text-xs font-semibold">
            Resmi İnternet Sitesi (URL)
          </Label>
          <Input
            id="artist-official-website"
            type="url"
            value={card.officialWebsite || ""}
            onChange={(e) =>
              updateField("officialWebsite", e.target.value || null)
            }
            placeholder="https://..."
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-9 bg-background text-xs"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="artist-source-label" className="text-xs font-semibold">
            Kaynak Notu Etiketi
          </Label>
          <Input
            id="artist-source-label"
            value={card.sourceLabel || ""}
            onChange={(e) => updateField("sourceLabel", e.target.value || null)}
            placeholder="Örn: Resmi web sitesi ve Wikidata"
            className="h-9 bg-background text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="artist-summary" className="text-xs font-semibold">
          Kısa Bilgi Notu (Özet)
        </Label>
        <Textarea
          id="artist-summary"
          rows={3}
          maxLength={600}
          value={card.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          placeholder="Sanatçı, topluluk veya koreograf hakkında 2-3 cümlelik tanıtıcı özet..."
          className="bg-background text-xs leading-relaxed"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="artist-website-note" className="text-xs font-semibold">
          Resmi Web Sitesinden Alınan Ufak Bilgi Notu
        </Label>
        <Textarea
          id="artist-website-note"
          rows={2}
          maxLength={600}
          value={card.websiteNote || ""}
          onChange={(e) => updateField("websiteNote", e.target.value || null)}
          placeholder="Resmi internet sitesinden derlenen özel proje, turne veya repertuvar notu..."
          className="bg-background text-xs leading-relaxed"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="artist-highlights" className="text-xs font-semibold">
          Öne Çıkanlar (Her satıra 1 madde)
        </Label>
        <Textarea
          id="artist-highlights"
          rows={3}
          value={card.highlights.join("\n")}
          onChange={(e) =>
            updateField(
              "highlights",
              e.target.value
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean)
            )
          }
          placeholder={"1900 yılında Viyana'da kuruldu\nUluslararası turne repertuvarı"}
          className="bg-background text-xs leading-relaxed"
        />
      </div>
      </fieldset>
    </DisclosureSection>
  );
}
