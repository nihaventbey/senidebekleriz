import Link from "next/link";
import { getPlacesByCity } from "@/lib/data/places";
import { PlaceImageComponent } from "@/components/place/place-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin } from "lucide-react";
import { getPlaceCardExcerpt } from "@/lib/content/place-quality";

type NearbyPlacesProps = {
  currentPlaceSlug: string;
  citySlug: string;
  cityName: string;
};

export async function NearbyPlaces({
  currentPlaceSlug,
  citySlug,
  cityName,
}: NearbyPlacesProps) {
  const allCityPlaces = await getPlacesByCity(citySlug);
  const nearby = allCityPlaces
    .filter((p) => p.slug !== currentPlaceSlug)
    .slice(0, 3);

  if (nearby.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {cityName}&apos;daki Diğer Kültürel Duraklar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu bölgeyi keşfederken uğrayabileceğiniz yakındaki mekanlar.
          </p>
        </div>
        <Link
          href={`/sehir/${citySlug}`}
          className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          Tümünü Gör
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nearby.map((place) => (
          <Link key={place.slug} href={`/mekan/${place.slug}`}>
            <Card className="card-hover h-full overflow-hidden border-border/60">
              <div className="relative h-36 w-full bg-muted">
                {place.is_featured && (
                  <Badge className="absolute left-2.5 top-2.5 z-10 text-xs">
                    Öne Çıkan
                  </Badge>
                )}
                <PlaceImageComponent
                  wikidataId={place.wikidata_id}
                  placeName={place.name}
                  cityName={cityName}
                  coverImage={place.cover_image}
                  className="h-full w-full"
                />
              </div>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="line-clamp-1 text-sm font-semibold">
                  {place.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {getPlaceCardExcerpt(place.name, place.description)}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary/70" />
                  <span>{cityName}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Link
          href={`/sehir/${citySlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {cityName} Tüm Mekanları Gör
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
