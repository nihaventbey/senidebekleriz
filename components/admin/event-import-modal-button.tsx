"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalUrlImportModal } from "@/components/admin/universal-url-import-modal";

/**
 * Compact modal trigger for importing an event from a URL, matching News list controls.
 */
export function EventImportModalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 shadow-xs"
      >
        <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        <span>URL&apos;den Etkinlik Çek</span>
      </Button>

      <UniversalUrlImportModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultTarget="event"
        title="URL'den Kültür Etkinliği Çek"
      />
    </>
  );
}
