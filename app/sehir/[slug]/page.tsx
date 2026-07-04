import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getCityBySlug, getAllCities } from "@/lib/data/cities";
import { AdBanner } from "@/components/ads/ad-banner";
import { getPlacesByCity, getAllPlaceSlugs } from "@/lib/data/places";
import { CityMap } from "@/components/maps/city-map-wrapper";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};

  return {
    title: `${city.name} Gezilecek Yerler`,
    description: `${city.name}'da gezilecek yerler, mekanlar ve şehir rehberi.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);

  if (!city) {
    notFound();
  }

  const places = await getPlacesByCity(slug);

  const cityJsonLd = {
    "@context": "https://schema.org",
    "@type": "City",
    name: city.name,
    description: city.description,
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.lat,
      longitude: city.lng,
    },
    containedInPlace: {
      "@type": "Country",
      name: "Türkiye",
    },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <JsonLd data={cityJsonLd} />
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{city.name}</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          {city.description}
        </p>
      </div>

      {/* Harita */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Harita Üzerinde</h2>
        <CityMap places={places} center={[city.lat, city.lng]} zoom={11} />
      </section>

      {/* Reklam Alanı */}
      <div className="mb-12">
        <AdBanner
          slot="city-content-top"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>

      {/* Mekan Listesi */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold">
          {city.name}&apos;da Gezilecek Yerler
        </h2>

        {places.length === 0 ? (
          <p className="text-muted-foreground">
            Henüz bu şehir için mekan eklenmemiş.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place, index) => (
              <div key={place.slug}>
                <Link href={`/mekan/${place.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <Badge variant="secondary">{place.category}</Badge>
                      <CardTitle className="mt-2 text-lg">{place.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {place.description ||
                          `${place.name}, ${city.name}'da görülmeye değer bir mekandır.`}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Liste arası reklam */}
                {(index + 1) % 6 === 0 && (
                  <div className="mt-6">
                    <AdBanner
                      slot="city-list-inline"
                      className="min-h-[250px] w-full"
                      style={{
                        display: "block",
                        minHeight: "250px",
                        width: "100%",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
