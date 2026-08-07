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
  Navigation,
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
import { getPlaceWikipedia } from "@/lib/data/wikipedia";
import { getPlaceImageServerSide } from "@/lib/data/place-images";
import { PlacePhotosGallery } from "@/components/place/place-photos-gallery";
import {
  getPlaceDescriptionFallback,
  getPlaceThinContentFallback,
  hasEditorialContent,
  shouldIndexPlace,
} from "@/lib/content/place-quality";

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

  const isEditorial = hasEditorialContent(place);
  const wiki =
    isEditorial || place.cover_image
      ? null
      : await getPlaceWikipedia(place.wikidata_id, place.name, place.cityName);

  const description =
    place.meta_description ||
    (isEditorial
      ? place.description?.slice(0, 160) ||
        getPlaceDescriptionFallback(place.name, place.cityName)
      : wiki?.extract?.slice(0, 160) ||
        place.description?.slice(0, 160) ||
        getPlaceDescriptionFallback(place.name, place.cityName));

  const title = place.meta_title || `${place.name} - ${place.cityName}`;
  const indexable = shouldIndexPlace(place);
  const ogImage = place.cover_image || wiki?.thumbnail || null;

  return {
    title,
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImage ? [{ url: ogImage, width: 800 }] : [],
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

  const indexable = shouldIndexPlace(place);
  const [categories, wiki, image] = await Promise.all([
    getPlaceCategories(place.id),
    getPlaceWikipedia(place.wikidata_id, place.name, cityData.name),
    getPlaceImageServerSide(
      place.wikidata_id,
      place.name,
      cityData.name,
      place.cover_image,
      { allowUnsplashFallback: !indexable }
    ),
  ]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const wikiUrl =
    wiki?.pageUrl ||
    (place.wikidata_id
      ? `https://www.wikidata.org/wiki/${place.wikidata_id}`
      : null);
  const openingHoursLines = formatOpeningHours(place.opening_hours);
  const isEditorial = hasEditorialContent(place);
  const aboutText = isEditorial
    ? place.description ||
      getPlaceDescriptionFallback(place.name, cityData.name)
    : wiki?.extract ||
      place.description ||
      getPlaceThinContentFallback(place.name, cityData.name);

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: aboutText,
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
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={placeJsonLd} />

      {/* Hero Section - Full Width Image */}
      <section className="relative">
        {image?.url ? (
          <div className="relative h-[38vh] min-h-[240px] w-full overflow-hidden sm:h-[45vh] sm:min-h-[320px] md:min-h-[400px]">
            <img
              src={image.url}
              alt={image.alt}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            {image.source === "wikimedia" && (
              <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
                Wikimedia Commons
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-[38vh] min-h-[240px] w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background sm:h-[45vh] sm:min-h-[320px] md:min-h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <MapPin className="h-12 w-12 text-white/80" />
                </div>
                <p className="text-2xl font-bold text-white/90">{place.name}</p>
                <p className="mt-1 text-lg text-white/70">{cityData.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button - Overlay on Image */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="bg-white/90 text-foreground backdrop-blur-sm hover:bg-white"
          >
            <Link href={`/sehir/${cityData.slug}`} className="max-w-[calc(100vw-2rem)]">
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{cityData.name}&apos;a Dön</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4">
        <div className="-mt-10 relative z-10 sm:-mt-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title Card */}
              <div className="rounded-2xl border bg-card p-5 shadow-lg sm:p-6 md:p-8">
                <div className="mb-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.slug}
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {cat.icon && <span className="mr-1">{cat.icon}</span>}
                      {cat.name}
                    </Badge>
                  ))}
                  {categories.length === 0 && (
                    <Badge variant="secondary">{place.category}</Badge>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                  {place.name}
                </h1>
                {place.is_featured && (
                  <Badge className="mt-3">Öne Çıkan Mekan</Badge>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{cityData.name}</span>
                  </div>
                  {place.address && (
                    <div className="flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5" />
                      {place.address}
                    </div>
                  )}
                  {place.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                      {place.source}
                    </span>
                  </div>
                </div>
              </div>

              {indexable && (
              <AdBanner
                slot="place-top"
                className="min-h-[90px] w-full"
                style={{ display: "block", minHeight: "90px", width: "100%" }}
              />
              )}

              {/* About Section */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-xl font-bold">Hakkında</h2>
                {isEditorial ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {place.description}
                    </p>
                    {wikiUrl && (
                      <p className="text-xs text-muted-foreground">
                        Ek kaynak:{" "}
                        <a
                          href={wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Wikipedia
                        </a>
                      </p>
                    )}
                  </div>
                ) : wiki?.extract ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {wiki.extract}
                    </p>
                    {wikiUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Wikipedia&apos;da Oku
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    {place.description ||
                      getPlaceThinContentFallback(place.name, cityData.name)}
                  </p>
                )}
              </div>

              <PlacePhotosGallery photos={place.photos} placeName={place.name} />

              {/* Map */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-xl font-bold">Konum</h2>
                <div className="overflow-hidden rounded-xl">
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

              {indexable && (
              <AdBanner
                slot="place-content-inline"
                className="min-h-[250px] w-full"
                style={{
                  display: "block",
                  minHeight: "250px",
                  width: "100%",
                }}
              />
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Info Card */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">Bilgiler</h3>
                <Separator className="mb-4" />
                <dl className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Şehir</dt>
                      <dd>
                        <Link
                          href={`/sehir/${cityData.slug}`}
                          className="font-medium hover:underline"
                        >
                          {cityData.name}
                        </Link>
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Navigation className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Koordinatlar</dt>
                      <dd className="font-medium tabular-nums">
                        {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                      </dd>
                    </div>
                  </div>

                  {place.phone && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Telefon</dt>
                        <dd>
                          <a
                            href={`tel:${place.phone}`}
                            className="font-medium hover:underline"
                          >
                            {place.phone}
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}

                  {place.website && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Web Sitesi</dt>
                        <dd>
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            Ziyaret Et
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}

                  {openingHoursLines.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Çalışma Saatleri
                        </dt>
                        <dd className="space-y-1">
                          {openingHoursLines.map((line) => (
                            <div key={line} className="font-medium">
                              {line}
                            </div>
                          ))}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              {/* Source Info */}
              {(image?.source === "wikimedia" || wikiUrl) && (
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {image?.source === "wikimedia" && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Görsel:</span>
                        <a
                          href="https://commons.wikimedia.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Wikimedia Commons
                        </a>
                      </div>
                    )}
                    {wikiUrl && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Kaynak:</span>
                        <a
                          href={wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Wikipedia
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {indexable && (
              <AdBanner
                slot="place-sidebar"
                className="min-h-[250px] w-full"
                style={{
                  display: "block",
                  minHeight: "250px",
                  width: "100%",
                }}
              />
              )}
            </aside>
          </div>
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}
