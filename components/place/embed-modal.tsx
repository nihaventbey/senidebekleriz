"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Check, Copy } from "lucide-react";
import { toast } from "@/lib/toast";

type EmbedModalProps = {
  placeName: string;
  slug: string;
};

export function EmbedPlaceButton({ placeName, slug }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const embedCode = `<iframe src="https://senidebekleriz.com/embed/mekan/${slug}" width="100%" height="320" style="border:none;border-radius:16px;max-width:440px;" title="${placeName} — Seni de Bekleriz"></iframe>`;

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Gömme Kodu Kopyalandı! 📋", "Kodu sitenize veya blog yazınıza yapıştırabilirsiniz.");
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-border/80 hover:bg-muted text-xs font-medium"
        title="Bu mekanı blogunuza veya sitenize gömün"
      >
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Sitene Göm</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base">Sitene / Bloguna Göm</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>{placeName}</strong> için hazırlanan etkileşimli kültür kartını seyahat blogunuza veya haber sitenize eklemek için aşağıdaki iframe kodunu kullanın:
            </p>

            <div className="relative rounded-xl border bg-muted/60 p-3 font-mono text-xs break-all select-all">
              {embedCode}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
