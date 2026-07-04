"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

type AdBannerProps = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdBanner({ slot, className, style }: AdBannerProps) {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {}
      );
    } catch {
      // Ignore AdSense errors in development
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-sm text-muted-foreground ${className || ""}`}
        style={style}
      >
        Reklam Alanı (AdSense)
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className || ""}`}
      style={style || { display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
