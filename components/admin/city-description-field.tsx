"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";

type Props = {
  slug: string;
  defaultValue?: string;
  descriptionSource?: string | null;
};

export function CityDescriptionField({
  slug,
  defaultValue = "",
  descriptionSource,
}: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(defaultValue);
  const [pending, startTransition] = useTransition();

  function generate(apply: boolean) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/generate-city-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, apply }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Tanıtım metni üretilemedi");
        }

        if (data.description) {
          setDescription(data.description);
        }

        toast.success(
          apply ? "Açıklama kaydedildi" : "AI tanıtım önerisi oluşturuldu"
        );
        if (apply) router.refresh();
      } catch (error) {
        toast.error(
          "Tanıtım metni üretilemedi",
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="description">Açıklama</Label>
        <div className="flex gap-2">
          {descriptionSource && (
            <span className="text-xs text-muted-foreground">
              Kaynak: {descriptionSource}
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => generate(false)}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            AI öner
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => generate(true)}
            disabled={pending}
          >
            Uygula ve kaydet
          </Button>
        </div>
      </div>
      <Textarea
        id="description"
        name="description"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </div>
  );
}
