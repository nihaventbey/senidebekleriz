"use client";

import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "@/lib/toast";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manuel",
  valilik: "Valilik",
  wikimedia: "Wikimedia",
  ai: "AI",
  import: "İçe aktarım",
};

type CoverImageFieldProps = {
  name?: string;
  defaultValue?: string | null;
  source?: string | null;
  folder: string;
  slug: string;
  label?: string;
  /** Şehir kapakları için Wikimedia öneri API'sini etkinleştirir */
  wikimediaSuggest?: boolean;
};

export function CoverImageField({
  name = "cover_image",
  defaultValue = "",
  source,
  folder,
  slug,
  label = "Kapak Görseli",
  wikimediaSuggest = false,
}: CoverImageFieldProps) {
  const [value, setValue] = useState(defaultValue || "");
  const [sourceLabel, setSourceLabel] = useState(source || "");
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [suggesting, startSuggest] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const displaySource = sourceLabel || source;

  function handleFile(file: File) {
    startUpload(async () => {
      try {
        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);
        body.set("slug", slug);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yükleme başarısız");

        setValue(data.url);
        setSourceLabel("manual");
        setSuggestionNote(null);
        toast.success("Görsel yüklendi");
      } catch (error) {
        toast.error(
          "Yüklenemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function suggestWikimedia(apply: boolean) {
    if (!wikimediaSuggest || folder !== "cities") return;

    startSuggest(async () => {
      try {
        const res = await fetch("/api/admin/suggest-city-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, apply }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Öneri alınamadı");
        }

        if (apply && data.url) {
          setValue(data.url);
          setSourceLabel("wikimedia");
          setSuggestionNote(data.note || null);
          toast.success("Wikimedia kapak uygulandı");
          return;
        }

        if (data.url) {
          setValue(data.url);
          setSourceLabel("wikimedia");
          setSuggestionNote(
            data.note
              ? `${data.source}: ${data.note} (önizleme — kaydetmek için formu gönderin)`
              : `${data.source} (önizleme — kaydetmek için formu gönderin)`
          );
          toast.success("Wikimedia önerisi yüklendi");
        }
      } catch (error) {
        toast.error(
          "Öneri alınamadı",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={name}>{label}</Label>
        {displaySource && SOURCE_LABELS[displaySource] && (
          <Badge variant="secondary" className="text-[10px]">
            Kaynak: {SOURCE_LABELS[displaySource]}
          </Badge>
        )}
      </div>

      <input type="hidden" name={name} value={value} />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          id={name}
          type="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSuggestionNote(null);
          }}
          placeholder="https://... veya dosya yükleyin"
          className="min-w-0 flex-1"
        />
        {wikimediaSuggest && folder === "cities" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => suggestWikimedia(false)}
              disabled={suggesting || uploading}
              className="shrink-0"
            >
              {suggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Wikimedia öner
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => suggestWikimedia(true)}
              disabled={suggesting || uploading}
              className="shrink-0"
            >
              Uygula ve kaydet
            </Button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Yükle
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setValue("");
              setSuggestionNote(null);
            }}
            className="shrink-0"
          >
            <X className="mr-2 h-4 w-4" />
            Kaldır
          </Button>
        )}
      </div>

      {suggestionNote && (
        <p className="text-xs text-muted-foreground">{suggestionNote}</p>
      )}

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Kapak önizleme"
          className="mt-2 h-40 w-full max-w-md rounded-lg border object-cover"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
