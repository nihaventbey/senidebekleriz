"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { PlaceImageComponent } from "@/components/place/place-image";

type Place = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  lat: number;
  lng: number;
  wikidata_id: string | null;
  cover_image: string | null;
  is_featured: boolean;
};

type Props = {
  citySlug: string;
  cityName: string;
  initialCount: number;
  totalCount: number;
};

export function PlacesLoadMore({ citySlug, cityName, initialCount, totalCount }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places?city=${citySlug}&page=${page + 1}&limit=20`
      );
      const data = await res.json();
      const newItems: Place[] = data.items || [];
      if (newItems.length < 20) setDone(true);
      setPlaces((prev) => [...prev, ...newItems]);
      setPage((p) => p + 1);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {places.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link key={place.slug} href={`/mekan/${place.slug}`}>
              <Card className="card-hover h-full border-border/60 overflow-hidden">
                <div className="relative h-40 w-full bg-muted">
                  {place.is_featured && (
                    <Badge className="absolute left-3 top-3 z-10">Öne Çıkan</Badge>
                  )}
                  <PlaceImageComponent
                    wikidataId={place.wikidata_id}
                    placeName={place.name}
                    cityName={cityName}
                    coverImage={place.cover_image}
                    className="h-full w-full"
                  />
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{place.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {place.description ||
                      `${place.name}, ${cityName}'da görülmeye değer bir mekandır.`}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!done && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
            className="min-w-[220px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                Daha Fazla Mekan
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {done && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Toplam {totalCount} mekanın tamamı gösterildi.
        </p>
      )}
    </>
  );
}
