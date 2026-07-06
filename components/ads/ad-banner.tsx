"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ADSENSE_CLIENT_ID,
  getAdSlotId,
  hasAdConfig,
} from "@/lib/ads/config";
import { useAdPlacement } from "@/components/ads/ad-placements-provider";

type AdBannerProps = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdBanner({ slot, className, style }: AdBannerProps) {
  const pathname = usePathname();
  const insRef = useRef<HTMLModElement>(null);
  const placement = useAdPlacement(slot);
  const envSlotId = getAdSlotId(slot);
  const adSlotId = placement?.adUnitId || envSlotId;
  const isConfigured = hasAdConfig() && Boolean(adSlotId);

  useEffect(() => {
    if (!isConfigured || !insRef.current) return;

    try {
      const win = window as typeof window & { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // Ad blocker veya AdSense henüz hazır değil
    }
  }, [isConfigured, adSlotId, pathname]);

  if (!isConfigured) {
    return null;
  }

  const adFormat = placement?.adFormat || "auto";
  const isFluid = adFormat === "fluid";

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className || ""}`}
      style={style || { display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adSlotId}
      data-ad-format={adFormat}
      {...(isFluid && placement?.adLayoutKey
        ? { "data-ad-layout-key": placement.adLayoutKey }
        : {})}
      {...(!isFluid ? { "data-full-width-responsive": "true" } : {})}
    />
  );
}
