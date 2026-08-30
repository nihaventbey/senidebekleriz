import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import { getCityBySlug, getAllCities } from "@/lib/data/cities";
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

      <section className="relative overflow-hidden bg-hero-gradient py-10 sm:py-12 md:py-16">
        {city.coverImage && (
          <>
            <img
              src={city.coverImage}
              alt={city.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              {city.region}
            </Badge>
            <h1
              className={`text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl ${city.coverImage ? "text-white" : ""}`}
            >
              {city.name}
            </h1>
            <p
              className={`mt-4 text-base md:text-lg ${city.coverImage ? "text-white/90" : "text-muted-foreground"}`}
            >
              {city.description}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {allPlaces.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight">
              Harita Üzerinde
            </h2>
            <CityMap places={allPlaces} center={[city.lat, city.lng]} zoom={11} />
          </section>
        )}

        {indexable && (
          <div className="mb-10">
            <AdBanner
              slot="city-content-top"
              className="min-h-[90px] w-full"
              style={{ display: "block", minHeight: "90px", width: "100%" }}
            />
          </div>
        )}

        {(cityArticle || cityGuidePage) && (
          <section className="mb-10 rounded-2xl border bg-card p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              {cityArticle?.title || cityGuidePage?.title}
            </h2>
            {cityArticle ? (
              <>
                <p className="mt-3 text-muted-foreground">{cityArticle.excerpt}</p>
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

        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight">
              {city.name}&apos;da Gezilecek Yerler
            </h2>
            <span className="text-sm text-muted-foreground">
              {allPlaces.length} mekan
            </span>
          </div>

          {allPlaces.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
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

        <div className="mt-12">
          <Link
            href="/sehirler"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tüm şehirler
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
