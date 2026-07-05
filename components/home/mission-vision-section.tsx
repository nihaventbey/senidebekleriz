import Link from "next/link";
import { ArrowRight, MapPinned, Sparkles, Target } from "lucide-react";

const missionPoints = [
  "81 ilde müze, tarih ve sanat mekanlarını derliyoruz",
  "Editöryal açıklamalar ve pratik gezi bilgileri sunuyoruz",
  "Yeme-içme odaklı içerikleri öne çıkarmıyoruz",
];

const visionPoints = [
  "Her ilde kültürel durakların dijital haritasını oluşturmak",
  "Güvenilir, özgün ve güncel bir rehber sunmak",
  "Sanat ve tarihin günlük hayatta daha görünür olmasına katkı sağlamak",
];

export function MissionVisionSection() {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-6 text-center md:mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary md:text-xs">
          Seni de Bekleriz
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
          Kültüre <span className="text-gradient">Yön Veriyoruz</span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Yeme-içme rehberi değil; sanat, tarih ve mirası öne çıkaran bir keşif
          platformuyuz.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-xl md:rounded-3xl">
        <div className="grid md:grid-cols-2">
          {/* Misyon */}
          <div className="relative overflow-hidden bg-primary px-5 py-8 text-primary-foreground sm:px-8 sm:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-black/10 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-grid-pattern opacity-[0.07]"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Target className="h-5 w-5" />
                </span>
                <span className="text-5xl font-black leading-none text-white/10 sm:text-6xl">
                  01
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                Misyonumuz
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
                Türkiye&apos;deki sanat, tarih, kültür ve müze odaklı mekanları
                daha belirgin hale getirmek; insanları bu alanlara yönlendirmek.
              </p>

              <ul className="mt-5 space-y-2.5">
                {missionPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-primary-foreground/85"
                  >
                    <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/70" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sayfa/misyon"
                className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                Detaylı oku
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Vizyon */}
          <div className="relative overflow-hidden border-t border-border/40 bg-gradient-to-br from-card via-background to-amber-50/40 px-5 py-8 dark:to-amber-950/20 sm:px-8 sm:py-10 md:border-l md:border-t-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-amber-400/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-8 top-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="text-5xl font-black leading-none text-foreground/5 sm:text-6xl">
                  02
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                Vizyonumuz
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sanat ve tarihe yönelen, kültürel mekanları kolayca keşfeden bir
                topluluğa katkı sağlamak — Türkiye&apos;nin miras keşfi için
                güvenilir bir referans olmak.
              </p>

              <ul className="mt-5 space-y-2.5">
                {visionPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sayfa/vizyon"
                className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Detaylı oku
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background shadow-lg md:flex"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            &
          </span>
        </div>
      </div>
    </section>
  );
}
