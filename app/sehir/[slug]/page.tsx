import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ArrowRight,
  Compass,
  Calendar,
  Newspaper,
  Ticket,
  Sparkles,
  Clock,
  BookOpen,
} from "lucide-react";
import { getCityBySlug, getAllCities } from "@/lib/data/cities";
import { getCityCultureData } from "@/lib/data/city-culture";
import { AdBanner } from "@/components/ads/ad-banner";
import { getPlacesByCity } from "@/lib/data/places";
import { getCityGuidePage } from "@/lib/data/pages";
import { getCityArticle } from "@/lib/data/articles";
import { getPublishedEvents } from "@/lib/data/events";
import { getPublishedNews } from "@/lib/data/news";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { CityMap } from "@/components/maps/city-map-wrapper";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { PlaceImageComponent } from "@/components/place/place-image";
import { getPlaceCardExcerpt } from "@/lib/content/place-quality";
import { CityQuickNav } from "@/components/cities/city-quick-nav";
import { CityCultureSection } from "@/components/cities/city-culture-section";
import { checkMuzekartStatus } from "@/lib/places/muzekart";

export const revalidate = 3600;

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

  const title = city.metaTitle || `${city.name} Kültür, Sanat ve Etkinlik Ajandası`;
  const description =
    city.metaDescription ||
    (city.description
      ? city.description.slice(0, 160)
      : `${city.name} güncel konser, tiyatro, sergi etkinlikleri, kültür haberleri ve şehir gezi rehberi.`);

  return {
    title,
    description,
    robots: { index: true, follow: true },
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

  const [allPlaces, cityArticle, cityGuidePage, cityEvents, cityNews] = await Promise.all([
    getPlacesByCity(slug),
    getCityArticle(slug),
    getCityGuidePage(slug),
    getPublishedEvents({ citySlug: slug, limit: 12 }),
    getPublishedNews({ citySlug: slug, limit: 6 }),
  ]);
  const hasGuide = Boolean(cityArticle || cityGuidePage);

  // Filter top quality places (with cover image or featured or description)
  const topPlaces = allPlaces
    .filter((p) => p.cover_image || p.is_featured || p.description)
    .slice(0, 9);

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
              {cityEvents.length > 0 && (
                <Badge className="bg-amber-500 text-slate-950 font-bold backdrop-blur-sm">
                  {cityEvents.length} Güncel Etkinlik
                </Badge>
              )}
              {cityNews.length > 0 && (
                <Badge variant="outline" className="border-white/30 text-white backdrop-blur-sm">
                  {cityNews.length} Kültür Haberi
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
        hasPlaces={topPlaces.length > 0}
        hasGuide={hasGuide}
        hasCulture={Boolean(cultureData)}
        hasEvents={cityEvents.length > 0}
        hasNews={cityNews.length > 0}
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
                {city.name} Hakkında &amp; Kültürel Miras
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
          </div>
        </section>

        {/* 1. ŞEHİR ETKİNLİK AJANDASI */}
        {cityEvents.length > 0 && (
          <section id="etkinlikler" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Şehir Ajandası</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {city.name} Yaklaşan Etkinlikler
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Tiyatro, konser, sergi ve festival takvimi.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 text-xs font-semibold">
                <Link href={`/etkinlikler?sehir=${city.slug}`}>
                  <span>Tüm {city.name} Etkinlikleri</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cityEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/etkinlik/${event.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {event.eventType}
                      </Badge>
                      {event.isFree && (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-0">
                          Ücretsiz
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    {event.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.summary}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="h-3 w-3 text-primary" />
                      {event.startsAt
                        ? new Date(event.startsAt).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                          })
                        : "Güncel"}
                    </span>
                    {event.venueName && (
                      <span className="truncate max-w-[130px]">{event.venueName}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 2. ŞEHİR KÜLTÜR HABERLERİ */}
        {cityNews.length > 0 && (
          <section id="haberler" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <Newspaper className="h-3.5 w-3.5" />
                  <span>Kültür Gündemi</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {city.name} Kültür &amp; Sanat Haberleri
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Arkeolojik kazılar, tarihi restorasyonlar ve yerel sanat haberleri.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 text-xs font-semibold">
                <Link href={`/haberler?sehir=${city.slug}`}>
                  <span>Tüm {city.name} Haberleri</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cityNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/haber/${item.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                >
                  {item.coverImage && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-muted-foreground pt-2">
                      {new Date(item.publishedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div>
          <AdBanner
            slot="city-content-top"
            className="min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />
        </div>

        {/* 3. ÖNE ÇIKAN TARİHİ VE KÜLTÜREL DURAKLAR */}
        {topPlaces.length > 0 && (
          <section id="mekanlar" className="scroll-mt-24 space-y-6">
            <div className="flex items-end justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  {city.name}&apos;da Öne Çıkan Kültürel Duraklar
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Müzeler, saraylar, ören yerleri ve tarihi anıtlar.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
                {topPlaces.length} Seçkin Durak
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topPlaces.map((place) => {
                const muzekart = checkMuzekartStatus({
                  name: place.name,
                  description: place.description,
                  wikidata_id: place.wikidata_id,
                  is_featured: place.is_featured,
                });

                return (
                  <div key={place.slug}>
                    <Card className="h-full border-border/60 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                      <div className="relative h-44 w-full bg-muted">
                        {place.is_featured && (
                          <Badge className="absolute left-3 top-3 z-10">
                            Öne Çıkan
                          </Badge>
                        )}
                        {muzekart.isValid && (
                          <Badge className="absolute right-3 top-3 z-10 bg-emerald-600/90 text-white backdrop-blur-xs text-[10px] px-1.5 py-0.5 font-medium shadow-xs">
                            🎫 MüzeKart
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
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">{place.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {getPlaceCardExcerpt(place.name, place.description)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>{city.name}</span>
                          </div>
                          {muzekart.isValid && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              MüzeKart ile Ücretsiz
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. HARİTA */}
        {topPlaces.length > 0 && (
          <section id="harita" className="scroll-mt-24">
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Harita Üzerinde {city.name}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Kültürel durakların şehir genelindeki coğrafi konumları.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border">
              <CityMap
                center={[city.lat, city.lng]}
                places={topPlaces}
              />
            </div>
          </section>
        )}

        {/* 5. KÜLTÜR BÖLÜMÜ */}
        {cultureData && (
          <CityCultureSection
            data={cultureData}
            cityName={city.name}
          />
        )}

        {/* 6. GEZİ REHBERİ MAKALESİ */}
        {cityArticle && (
          <section
            id="rehber"
            className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm md:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  {city.name} Gezi Rehberi &amp; Kültür Dosyası
                </h2>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold shrink-0">
                <Link href={`/blog/${cityArticle.slug}`}>
                  <span>Rehberi Tam Ekran Oku</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
            <MarkdownContent html={renderMarkdown(cityArticle.content)} />
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
            Gezi &amp; Kültür Rehberi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

