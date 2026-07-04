"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "sdb-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez bildirimi"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Deneyiminizi iyileştirmek ve reklam performansını ölçmek için
          çerezler kullanıyoruz. Google AdSense ve analiz araçları bu site
          üzerinde etkin olabilir. Detaylar için{" "}
          <Link
            href="/sayfa/gizlilik-politikasi"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Gizlilik Politikamızı
          </Link>{" "}
          inceleyebilirsiniz.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={accept}>
            Kabul Et
          </Button>
        </div>
      </div>
    </div>
  );
}
