"use client";

import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X } from "lucide-react";
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
};

export function CoverImageField({
  name = "cover_image",
  defaultValue = "",
  source,
  folder,
  slug,
  label = "Kapak Görseli",
}: CoverImageFieldProps) {
  const [value, setValue] = useState(defaultValue || "");
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

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
        toast.success("Görsel yüklendi");
      } catch (error) {
        toast.error(
          "Yüklenemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={name}>{label}</Label>
        {source && SOURCE_LABELS[source] && (
          <Badge variant="secondary" className="text-[10px]">
            Kaynak: {SOURCE_LABELS[source]}
          </Badge>
        )}
      </div>

      <input type="hidden" name={name} value={value} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={name}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://... veya dosya yükleyin"
        />
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
            onClick={() => setValue("")}
            className="shrink-0"
          >
            <X className="mr-2 h-4 w-4" />
            Kaldır
          </Button>
        )}
      </div>

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
