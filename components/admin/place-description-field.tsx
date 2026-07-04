"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditorialChecklist } from "@/components/admin/editorial-checklist";
import { evaluatePlaceDescription } from "@/lib/content/editorial-checklist";

type Props = {
  defaultValue?: string;
};

export function PlaceDescriptionField({ defaultValue = "" }: Props) {
  const [description, setDescription] = useState(defaultValue);
  const evaluation = useMemo(
    () => evaluatePlaceDescription(description),
    [description]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama (editoryal metin)</Label>
        <Textarea
          id="description"
          name="description"
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="En az 200 kelime özgün metin. Kaynak: Manuel seçin ve gerekirse Öne çıkan işaretleyin."
        />
        <p className="text-xs text-muted-foreground">
          SEO indeks için: kaynak Manuel + 150+ karakter veya Öne çıkan işareti.
        </p>
      </div>
      <EditorialChecklist evaluation={evaluation} />
    </div>
  );
}
