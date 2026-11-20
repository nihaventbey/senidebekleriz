"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, SearchCheck, Sparkles } from "lucide-react";
import { DisclosureSection } from "@/components/admin/editorial/disclosure-section";
import { toast } from "@/lib/toast";

type MetaFieldsProps = {
  type: "place" | "city" | "event";
  entityName: string;
  cityName?: string;
  description?: string;
  categoryLabel?: string;
  defaultMetaTitle?: string | null;
  defaultMetaDescription?: string | null;
};

export function MetaFields({
  type,
  entityName,
  cityName,
  description,
  categoryLabel,
  defaultMetaTitle,
  defaultMetaDescription,
}: MetaFieldsProps) {
  const [metaTitle, setMetaTitle] = useState(defaultMetaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    defaultMetaDescription || ""
  );
  const [pending, startTransition] = useTransition();

  function suggest() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/generate-meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            name: entityName,
            cityName,
            description,
            categoryLabel,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Meta üretilemedi");

        setMetaTitle(data.meta_title || "");
        setMetaDescription(data.meta_description || "");
        toast.success("Meta önerisi oluşturuldu");
      } catch (error) {
        toast.error(
          "Meta üretilemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  const hasCustomMeta = Boolean(metaTitle.trim() || metaDescription.trim());

  return (
    <DisclosureSection
      title="SEO Meta Ayarları"
      description="Arama motorları için özel başlık ve açıklama"
      icon={<SearchCheck className="h-4 w-4 text-primary" aria-hidden="true" />}
      badge={hasCustomMeta ? "Özel Meta" : "Otomatik"}
      badgeTone={hasCustomMeta ? "primary" : "neutral"}
      defaultOpen={false}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Boş bırakılırsa başlık ve özetten otomatik üretilir.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={suggest}
          disabled={pending}
          className="h-8 gap-1.5 text-xs font-semibold shrink-0"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          )}
          AI Öner
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="meta_title" className="text-xs font-semibold">
            Meta Başlık
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {metaTitle.length} / 60 kr
          </span>
        </div>
        <Input
          id="meta_title"
          name="meta_title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Boş bırakılırsa otomatik üretilir"
          className="h-9 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="meta_description" className="text-xs font-semibold">
            Meta Açıklama
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {metaDescription.length} / 160 kr
          </span>
        </div>
        <Textarea
          id="meta_description"
          name="meta_description"
          rows={3}
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="150-160 karakter önerilir"
          className="text-xs leading-relaxed"
        />
      </div>
    </DisclosureSection>
  );
}
