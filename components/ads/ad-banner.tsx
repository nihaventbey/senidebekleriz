"use client";

import { useEffect, useRef } from "react";
import { hasAdConfig, getAdSlotId, ADSENSE_CLIENT_ID } from "@/lib/ads/config";

type AdBannerProps = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdBanner({ slot, className, style }: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);
  const adSlotId = getAdSlotId(slot);
  const isConfigured = hasAdConfig() && Boolean(adSlotId);

  useEffect(() => {
    if (!isConfigured || !insRef.current) return;

    try {
      const win = window as typeof window & { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // Ignore AdSense errors in development
    }
  }, [isConfigured]);

  if (!isConfigured) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground ${className || ""}`}
        style={style}
      >
        Reklam Alanı ({slot})
      </div>
    );
  }

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className || ""}`}
      style={style || { display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adSlotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
