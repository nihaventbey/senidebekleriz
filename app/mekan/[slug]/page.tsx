import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { getCityBySlug } from "@/lib/data/cities";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  getAllPlaceSlugs,
  getPlaceWithCityBySlug,
} from "@/lib/data/places";
import { PlaceMap } from "@/components/maps/place-map-wrapper";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const slugs = await getAllPlaceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceWithCityBySlug(slug);

  if (!place) return {};

  return {
    title: `${place.name} - ${place.cityName}`,
    description:
      place.description ||
      `${place.name}, ${place.cityName}'da görülmeye değer bir mekan.`,
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceWithCityBySlug(slug);

  if (!place) {
    notFound();
  }

  const cityData = await getCityBySlug(place.citySlug);
  if (!cityData) {
    notFound();
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place.name,
    description:
      place.description ||
      `${place.name}, ${cityData.name}'da görülmeye değer bir mekandır.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: cityData.name,
      addressCountry: "TR",
      streetAddress: place.address || undefined,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <JsonLd data={placeJsonLd} />
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={`/sehir/${cityData.slug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {cityData.name}&apos;a Dön
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Sol İçerik */}
        <div className="lg:col-span-2">
          {/* Üst reklam */}
          <AdBanner
            slot="place-top"
            className="mb-6 min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />

          <Badge variant="secondary" className="mb-3">
            {place.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">{place.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {cityData.name}
            </div>
            <div>
              {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            </div>
          </div>

          <div className="mt-8 flex h-64 items-center justify-center rounded-lg bg-muted/50 md:h-96">
            <span className="text-sm text-muted-foreground">
              Görsel alanı (Supabase Storage / Unsplash)
            </span>
          </div>

          <div className="prose prose-stone mt-8 max-w-none dark:prose-invert">
            <h2 className="text-2xl font-semibold">Hakkında</h2>
            <p className="text-muted-foreground">
              {place.description ||
                `${place.name}, ${cityData.name}'da bulunan görülmeye değer bir mekandır. Daha detaylı bilgi yakında eklenecektir.`}
            </p>
          </div>

          {/* İçerik içi reklam */}
          <div className="mt-10">
            <AdBanner
              slot="place-content-inline"
              className="min-h-[250px] w-full"
              style={{
                display: "block",
                minHeight: "250px",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Sağ Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Harita</h3>
            <div className="mt-4 overflow-hidden rounded-lg">
              <PlaceMap lat={place.lat} lng={place.lng} name={place.name} />
            </div>
            <Button className="mt-4 w-full" variant="outline" asChild>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Google Haritalar&apos;da Aç
              </a>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Bilgiler</h3>
            <Separator className="my-3" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Şehir</dt>
                <dd className="font-medium">{cityData.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kategori</dt>
                <dd className="font-medium">{place.category}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kaynak</dt>
                <dd className="font-medium capitalize">{place.source}</dd>
              </div>
            </dl>
          </div>

          {/* Sidebar reklam */}
          <AdBanner
            slot="place-sidebar"
            className="min-h-[250px] w-full"
            style={{
              display: "block",
              minHeight: "250px",
              width: "100%",
            }}
          />
        </aside>
      </div>
    </div>
  );
}
