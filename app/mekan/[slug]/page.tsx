import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  ArrowLeft,
  ExternalLink,
  Phone,
  Globe,
  Star,
  Clock,
  BookOpen,
  Camera,
} from "lucide-react";
import { getCityBySlug } from "@/lib/data/cities";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  getAllPlaceSlugs,
  getPlaceWithCityBySlug,
  getPlaceCategories,
} from "@/lib/data/places";
import { PlaceMap } from "@/components/maps/place-map-wrapper";
import { JsonLd } from "@/components/seo/json-ld";
import { getWikipediaSummary } from "@/lib/data/wikipedia";
import { getPlaceImageServerSide } from "@/lib/data/place-images";

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

  const wiki = place.wikidata_id
    ? await getWikipediaSummary(place.wikidata_id)
    : null;

  const description =
    wiki?.extract?.slice(0, 160) ||
    place.description ||
    `${place.name}, ${place.cityName}'da görülmeye değer bir mekan.`;

  return {
    title: `${place.name} - ${place.cityName}`,
    description,
    openGraph: {
      title: `${place.name} - ${place.cityName}`,
      description,
      type: "article",
    },
  };
}

function formatOpeningHours(hours: Record<string, unknown> | null): string[] {
  if (!hours || typeof hours !== "object") return [];
  const lines: string[] = [];
  for (const [day, time] of Object.entries(hours)) {
    if (typeof time === "string") {
      lines.push(`${day}: ${time}`);
    }
  }
  return lines;
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

  const [categories, wiki, image] = await Promise.all([
    getPlaceCategories(place.id),
    place.wikidata_id ? getWikipediaSummary(place.wikidata_id) : null,
    getPlaceImageServerSide(place.wikidata_id, place.name, cityData.name),
  ]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const wikiUrl = wiki?.pageUrl || (place.wikidata_id ? `https://www.wikidata.org/wiki/${place.wikidata_id}` : null);
  const openingHoursLines = formatOpeningHours(place.opening_hours);

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description:
      wiki?.extract ||
      place.description ||
      `${place.name}, ${cityData.name}'da görülmeye değer bir mekandır.`,
    image: image?.url || undefined,
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
    telephone: place.phone || undefined,
    url: place.website || undefined,
    aggregateRating: place.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: place.rating,
          bestRating: 5,
          reviewCount: 1,
        }
      : undefined,
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
          <AdBanner
            slot="place-top"
            className="mb-6 min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />

          <div className="mb-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat.slug} variant="secondary">
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </Badge>
            ))}
            {categories.length === 0 && (
              <Badge variant="secondary">{place.category}</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{place.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {cityData.name}
            </div>
            {place.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {place.address}
              </div>
            )}
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {place.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Görsel */}
          {image?.url ? (
            <div className="relative mt-8 overflow-hidden rounded-xl">
              <img
                src={image.url}
                alt={image.alt}
                className="h-64 w-full object-cover md:h-96"
                loading="eager"
              />
              {image.source === "wikimedia" && (
                <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                  Wikimedia Commons
                </div>
              )}
            </div>
          ) : (
            <div className="relative mt-8 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 md:h-96">
              <div className="text-center">
                <Camera className="mx-auto mb-3 h-12 w-12 text-primary/30" />
                <p className="text-lg font-semibold">{place.name}</p>
                <p className="text-sm text-muted-foreground">{cityData.name}</p>
              </div>
            </div>
          )}

          {/* Wikipedia İçeriği */}
          <div className="prose prose-stone mt-8 max-w-none dark:prose-invert">
            <h2 className="text-2xl font-semibold">Hakkında</h2>
            {wiki?.extract ? (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  {wiki.extract}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {wikiUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={wikiUrl} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Wikipedia&apos;da Oku
                      </a>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {place.description ||
                  `${place.name}, ${cityData.name}'da bulunan görülmeye değer bir mekandır. Daha detaylı bilgi yakında eklenecektir.`}
              </p>
            )}
          </div>

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
          {/* Bilgi Kartı */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Bilgiler</h3>
            <Separator className="my-3" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Şehir</dt>
                <dd className="font-medium">
                  <Link href={`/sehir/${cityData.slug}`} className="hover:underline">
                    {cityData.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Koordinatlar</dt>
                <dd className="font-medium tabular-nums">
                  {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kaynak</dt>
                <dd className="font-medium capitalize">{place.source}</dd>
              </div>
              {place.phone && (
                <div>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd>
                    <a
                      href={`tel:${place.phone}`}
                      className="flex items-center gap-1 font-medium hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {place.phone}
                    </a>
                  </dd>
                </div>
              )}
              {place.website && (
                <div>
                  <dt className="text-muted-foreground">Web Sitesi</dt>
                  <dd>
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Ziyaret Et
                    </a>
                  </dd>
                </div>
              )}
              {openingHoursLines.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Çalışma Saatleri</dt>
                  <dd className="space-y-1">
                    {openingHoursLines.map((line) => (
                      <div key={line} className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Harita */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
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

          {/* Wikimedia Bilgisi */}
          {image?.source === "wikimedia" && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Camera className="h-3 w-3" />
                <span>
                  Görsel:{" "}
                  <a
                    href="https://commons.wikimedia.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Wikimedia Commons
                  </a>
                </span>
              </div>
            </div>
          )}

          {/* Wikipedia Linki */}
          {wikiUrl && (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>
                  Detaylı bilgi:{" "}
                  <a
                    href={wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Wikipedia&apos;da görüntüle
                  </a>
                </span>
              </div>
            </div>
          )}

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
