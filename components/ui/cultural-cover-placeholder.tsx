"use client";

import { Sparkles, Landmark, Palette, Compass, Theater } from "lucide-react";

type CulturalCoverPlaceholderProps = {
  title?: string;
  category?: string;
  cityName?: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
};

export function CulturalCoverPlaceholder({
  title,
  category = "Kültür & Sanat",
  cityName,
  className = "w-full h-full min-h-[160px]",
  iconSize = "md",
}: CulturalCoverPlaceholderProps) {
  const iconClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  }[iconSize];

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950/80 via-slate-900 to-indigo-950 p-4 text-center select-none ${className}`}
    >
      {/* Decorative Cultural Patterns & Rings */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />

      {/* Center Cultural Seal Badge */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md backdrop-blur-xs">
          <Landmark className={iconClasses} />
        </div>

        {/* Brand Name */}
        <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
          SENİ DE BEKLERİZ
        </span>

        {/* Title or Category */}
        {title ? (
          <p className="max-w-[85%] text-xs font-bold text-white/90 line-clamp-2 leading-tight">
            {title}
          </p>
        ) : (
          <p className="text-[11px] font-semibold text-white/75">
            {cityName ? `${cityName} • ${category}` : category}
          </p>
        )}
      </div>

      {/* Bottom Subtitle */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[9px] text-white/50 tracking-wider">
          Kültür, Sanat ve Tarih Rehberi
        </span>
      </div>
    </div>
  );
}
