"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { MapPin, Compass, ArrowRight, Sparkles, Landmark, Compass as CompassIcon, BookOpen } from "lucide-react";
import type { HeroSettings } from "@/lib/settings/hero";
import { HeroBackground } from "@/components/home/hero-background";

type Props = {
  heroSettings: HeroSettings;
};

export function PremiumHeroSection({ heroSettings }: Props) {
  const heroActive = heroSettings.enabled && Boolean(heroSettings.imageUrl);
  const heroOnDark = heroActive && heroSettings.overlayTone === "dark";

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 md:py-32 bg-background border-b border-border/40">
      {/* Background Layer */}
      {heroActive ? (
        <HeroBackground settings={heroSettings} />
      ) : (
        <>
          {/* Ambient Glowing Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-teal-500/15 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.07] pointer-events-none" />
        </>
      )}

      <div className="container relative mx-auto px-4 text-center">
        {/* Main Title Showcase */}
        <div className="max-w-5xl mx-auto space-y-6">
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] ${
              heroOnDark ? "text-white" : "text-foreground"
            }`}
          >
            Türkiye'nin{" "}
            <span className="relative inline-block px-3 py-1 my-1 rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-teal-500/20 backdrop-blur-sm">
              <span className="bg-gradient-to-r from-amber-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
                Kültürel Mirasını
              </span>
            </span>{" "}
            Keşfet
          </h1>

          {/* Subtitle */}
          <p
            className={`mx-auto max-w-3xl text-lg sm:text-xl md:text-2xl leading-relaxed font-normal tracking-wide ${
              heroOnDark ? "text-white/90" : "text-muted-foreground"
            }`}
          >
            81 ildeki bin yıllık antik kentleri, görkemli müzeleri, gizemli mabetleri
            ve editoryal kültür rotalarını büyüleyici bir deneyimle inceleyin.
          </p>
        </div>

        {/* Floating Search Bar Capsule */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="p-2 sm:p-2.5 rounded-3xl bg-background/90 border border-border/80 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 hover:border-teal-500/40 transition-all duration-300">
            <SearchBar variant="hero" className="h-14 w-full border-0 bg-transparent text-base sm:text-lg focus-visible:ring-0" />
          </div>

          {/* Popular Quick Search Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Popüler Rotalar:
            </span>
            {[
              { label: "Göbeklitepe", href: "/mekan/gobeklitepe-sanliurfa" },
              { label: "Efes Antik Kenti", href: "/sehir/izmir" },
              { label: "Sümela Manastırı", href: "/sehir/trabzon" },
              { label: "Kapadokya", href: "/sehir/nevsehir" },
            ].map((tag) => (
              <Link
                key={tag.label}
                href={tag.href}
                className="px-3 py-1 rounded-full bg-muted/60 hover:bg-teal-500/10 hover:text-teal-600 border border-border/60 transition-colors"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="w-full sm:w-auto text-base px-8 h-14 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/20 font-semibold group transition-all"
            asChild
          >
            <Link href="/sehirler">
              <MapPin className="mr-2.5 h-5 w-5" />
              Şehirleri Keşfet
              <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base px-8 h-14 rounded-2xl bg-background/80 hover:bg-muted border-border/80 font-medium"
            asChild
          >
            <Link href="/kategoriler">
              <Compass className="mr-2.5 h-5 w-5 text-amber-600" />
              Kategorilere Göz At
            </Link>
          </Button>
        </div>

        {/* Bottom Trust & Feature Badges */}
        <div className="mt-16 pt-8 border-t border-border/40 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">81 İl Rehberi</h4>
              <p className="text-xs text-muted-foreground">Tarih & Kültür Rotaları</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <CompassIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">500+ Antik Kent & Müze</h4>
              <p className="text-xs text-muted-foreground">Detaylı Konum Verisi</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Özgün İçerikler</h4>
              <p className="text-xs text-muted-foreground">2000+ Karakter Editoryal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
