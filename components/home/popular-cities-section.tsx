import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CityData } from "@/lib/data/cities";

function CityThumbnail({ city }: { city: CityData }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted sm:h-11 sm:w-11 md:h-14 md:w-14 md:rounded-lg">
      {city.coverImage ? (
        <img
          src={city.coverImage}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10">
          <MapPin className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
        </div>
      )}
    </div>
  );
}

type Props = {
  cities: CityData[];
};

export function PopularCitiesSection({ cities }: Props) {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-4 flex items-end justify-between gap-3 md:mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-3xl">
            Popüler Şehirler
          </h2>
          <p className="mt-1 text-xs text-muted-foreground md:mt-2 md:text-base">
            Türkiye&apos;nin en çok ziyaret edilen şehirlerini keşfet.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/sehirler">Tümü</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/sehir/${city.slug}`}
            className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 p-2 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:gap-2.5 sm:p-2.5 md:flex-col md:items-center md:p-3 md:text-center"
          >
            <CityThumbnail city={city} />
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary">
                {city.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                {city.region}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
