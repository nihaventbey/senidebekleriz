import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Compass } from "lucide-react";
import { getCityBySlug, getAllCities } from "@/lib/data/cities";
import { getCityCultureData } from "@/lib/data/city-culture";
import { AdBanner } from "@/components/ads/ad-banner";
import {
  countIndexablePlacesByCitySlug,
  getPlacesByCity,
} from "@/lib/data/places";
import { getCityGuidePage } from "@/lib/data/pages";
import { getCityArticle } from "@/lib/data/articles";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { CityMap } from "@/components/maps/city-map-wrapper";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { PlaceImageComponent } from "@/components/place/place-image";
import { PlacesLoadMore } from "@/components/place/places-load-more";
import { shouldIndexCityHub } from "@/lib/content/hub-quality";
import { getPlaceCardExcerpt } from "@/lib/content/place-quality";
import { CityQuickNav } from "@/components/cities/city-quick-nav";
import { CityCultureSection } from "@/components/cities/city-culture-section";

export const revalidate = 604800;

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

  const [cityArticle, cityGuidePage, indexablePlaceCount] = await Promise.all([
    getCityArticle(slug),
    getCityGuidePage(slug),
    countIndexablePlacesByCitySlug(slug),
  ]);
  const indexable = shouldIndexCityHub({
    hasGuide: Boolean(cityArticle || cityGuidePage),
    indexablePlaceCount,
  });

  const title = city.metaTitle || `${city.name} Gezilecek Yerler`;
  const description =
    city.metaDescription ||
    (city.description
      ? city.description.slice(0, 160)
      : `${city.name}'da gezilecek yerler, mekanlar ve şehir rehberi.`);

  return {
    title,
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: {
      canonical: `/sehir/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: city.coverImage ? [{ url: city.coverImage, width: 1200 }] : [],
    },
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

  const allPlaces = await getPlacesByCity(slug);
  const [cityArticle, cityGuidePage, indexablePlaceCount] = await Promise.all([
    getCityArticle(slug),
    getCityGuidePage(slug),
    countIndexablePlacesByCitySlug(slug),
  ]);
  const hasGuide = Boolean(cityArticle || cityGuidePage);
  const indexable = shouldIndexCityHub({
    hasGuide,
    indexablePlaceCount,
  });
  const firstPage = allPlaces.slice(0, 20);
  const hasMore = allPlaces.length > 20;
  const cultureData = getCityCultureData(slug, city.name);

  const cityJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "City",
      name: city.name,
      description: city.description,
      image: city.coverImage || undefined,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.lat,
        longitude: city.lng,
      },
      containedInPlace: {
        "@type": "Country",
        name: "Türkiye",
      },
    },
    buildBreadcrumbsJsonLd([
      { name: "Ana Sayfa", path: "/" },
      { name: "Şehirler", path: "/sehirler" },
      { name: city.name, path: `/sehir/${city.slug}` },
    ]),
  ];

  return (
    <div>
      <JsonLd data={cityJsonLd} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient py-12 sm:py-16 md:py-20">
        {city.coverImage ? (
          <>
            <img
              src={city.coverImage}
              alt={city.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
        )}
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                {city.region} Bölgesi
              </Badge>
              {allPlaces.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-white/30 bg-black/20 text-white/90 backdrop-blur-sm"
                >
                  {allPlaces.length} Kültürel Durak
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {city.name}
            </h1>
            <p className="mt-4 text-base font-normal leading-relaxed text-white/90 sm:text-lg md:text-xl">
              {cultureData.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation Bar */}
      <CityQuickNav
        hasPlaces={allPlaces.length > 0}
        hasGuide={hasGuide}
        hasCulture={Boolean(cultureData)}
      />

      <div className="container mx-auto px-4 pb-16 space-y-12">
        {/* Şehir Hakkında / Genel Bakış */}
        <section
          id="genel-bakis"
          className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm md:p-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                {city.name} Hakkında & Kültürel Miras
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Tarih, coğrafya ve kentin kültürel kimliğine genel bakış.
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line md:text-base">
            {city.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>
                Koordinatlar: {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>
                Bölge:{" "}
                <strong className="font-medium text-foreground">
                  {city.region}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>
                Kültürel Mekan:{" "}
                <strong className="font-medium text-foreground">
                  {allPlaces.length}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {indexable && (
          <div>
            <AdBanner
              slot="city-content-top"
              className="min-h-[90px] w-full"
              style={{ display: "block", minHeight: "90px", width: "100%" }}
            />
          </div>
        )}

        {/* Gezilecek Mekanlar */}
        <section id="mekanlar" className="scroll-mt-24">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                {city.name}&apos;da Gezilecek Yerler
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Müzeler, tarihi yapılar, anıtlar ve sanat durakları.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
              {allPlaces.length} mekan
            </span>
          </div>

          {allPlaces.length === 0 ? (
            <p className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
              Henüz bu şehir için mekan eklenmemiş.
            </p>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {firstPage.map((place) => (
                  <Link key={place.slug} href={`/mekan/${place.slug}`}>
                    <Card className="card-hover h-full border-border/60 overflow-hidden">
                      <div className="relative h-40 w-full bg-muted">
                        {place.is_featured && (
                          <Badge className="absolute left-3 top-3 z-10">
                            Öne Çıkan
                          </Badge>
                        )}
                        <PlaceImageComponent
                          wikidataId={place.wikidata_id}
                          placeName={place.name}
                          cityName={city.name}
                          coverImage={place.cover_image}
                          className="h-full w-full"
                        />
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{place.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {getPlaceCardExcerpt(place.name, place.description)}
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

              {hasMore && (
                <PlacesLoadMore
                  citySlug={slug}
                  cityName={city.name}
                  initialCount={20}
                  totalCount={allPlaces.length}
                />
              )}
            </>
          )}
        </section>

        {/* Harita */}
        {allPlaces.length > 0 && (
          <section id="harita" className="scroll-mt-24">
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Harita Üzerinde {city.name}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Tüm mekanların şehir genelindeki coğrafi konumları.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border">
              <CityMap
                places={allPlaces}
                center={[city.lat, city.lng]}
                zoom={11}
              />
            </div>
          </section>
        )}

        {/* Kültür, Sanat, Edebiyat, Sinema & Tarih Modülü */}
        <CityCultureSection data={cultureData} cityName={city.name} />

        {/* Gezi Rehberi / Blog */}
        {(cityArticle || cityGuidePage) && (
          <section
            id="rehber"
            className="scroll-mt-24 rounded-2xl border bg-card p-6 md:p-8"
          >
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              {cityArticle?.title || cityGuidePage?.title}
            </h2>
            {cityArticle ? (
              <>
                <p className="mt-3 text-muted-foreground">
                  {cityArticle.excerpt}
                </p>
                <MarkdownContent
                  className="markdown-compact mt-4 max-h-64 overflow-hidden text-sm text-muted-foreground [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
                  html={renderMarkdown(
                    cityArticle.content
                      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
                      .slice(0, 1200)
                  )}
                />
                <Link
                  href={`/blog/${cityArticle.slug}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Tam rehberi oku
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : cityGuidePage ? (
              <>
                <MarkdownContent
                  className="markdown-compact mt-4 text-sm text-muted-foreground"
                  html={cityGuidePage.content}
                />
                <Link
                  href={`/sayfa/${cityGuidePage.slug}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Tam rehberi oku
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : null}
          </section>
        )}

        <div className="mt-12 pt-6 border-t border-border/60 flex items-center justify-between">
          <Link
            href="/sehirler"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Tüm Şehirler
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Gezi Rehberi Yazıları
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

