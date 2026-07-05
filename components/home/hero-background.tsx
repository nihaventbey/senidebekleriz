"use client";

import { useEffect, useRef } from "react";
import type { HeroSettings } from "@/lib/settings/hero";

function ParallaxLayer({
  imageUrl,
  blur,
}: {
  imageUrl: string;
  blur: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Görsel %130 yükseklikte; scroll'un ~%25'i kadar yukarı kayar,
        // böylece sayfa inerken görselin alt kısmı da görünür.
        el.style.transform = `translateY(${window.scrollY * -0.25}px)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-x-0 top-0 h-[130%] bg-cover bg-top will-change-transform"
      style={{
        backgroundImage: `url(${imageUrl})`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    />
  );
}

export function HeroBackground({ settings }: { settings: HeroSettings }) {
  if (!settings.enabled || !settings.imageUrl) return null;

  const { imageUrl, effect, overlayTone, overlayOpacity, blur } = settings;
  const blurStyle = blur > 0 ? { filter: `blur(${blur}px)` } : undefined;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {effect === "parallax" ? (
        <ParallaxLayer imageUrl={imageUrl} blur={blur} />
      ) : effect === "pan" ? (
        <div
          className="bg-pan-tour absolute inset-0"
          style={{ backgroundImage: `url(${imageUrl})`, ...blurStyle }}
        />
      ) : effect === "zoom" ? (
        <div
          className="bg-slow-zoom absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})`, ...blurStyle }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})`, ...blurStyle }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          backgroundColor:
            overlayTone === "dark"
              ? `rgba(0, 0, 0, ${overlayOpacity / 100})`
              : `rgba(255, 255, 255, ${overlayOpacity / 100})`,
        }}
      />
    </div>
  );
}
