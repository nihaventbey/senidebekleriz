import Link from "next/link";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import type { CityData } from "@/lib/data/cities";

type Props = {
  cities: CityData[];
};

export function PopularCitiesSection({ cities }: Props) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Building2 className="h-3.5 w-3.5" />
            <span>81 İl Kültür Rotası</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Şehirlerin Kültür &amp; Sanat Ajandası
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Türkiye&apos;nin önde gelen kültür şehirlerini, antik kentlerini ve yerel etkinliklerini keşfedin.
          </p>
        </div>
        <Link
          href="/sehirler"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline shrink-0"
        >
          <span>Tüm 81 İli Görüntüle</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/sehir/${city.slug}`}
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/50 aspect-[4/5]"
          >
            {/* Background image & gradient */}
            <div className="absolute inset-0 bg-muted">
              {city.coverImage ? (
                <img
                  src={city.coverImage}
                  alt={city.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            </div>

            {/* City Info on bottom */}
            <div className="relative z-10 space-y-0.5">
              <span className="text-[10px] font-semibold text-primary/90 uppercase tracking-wider block">
                {city.region || "Türkiye"}
              </span>
              <p className="text-base font-bold text-white leading-tight group-hover:text-primary transition-colors">
                {city.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
