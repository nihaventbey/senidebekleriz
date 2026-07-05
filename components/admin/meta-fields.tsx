"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
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

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">SEO Meta</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={suggest}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI öner
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_title">Meta Başlık</Label>
        <Input
          id="meta_title"
          name="meta_title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Boş bırakılırsa otomatik üretilir"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description">Meta Açıklama</Label>
        <Textarea
          id="meta_description"
          name="meta_description"
          rows={3}
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="150-160 karakter önerilir"
        />
        <p className="text-xs text-muted-foreground">
          {metaDescription.length} karakter
        </p>
      </div>
    </div>
  );
}
