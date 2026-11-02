import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ArrowRight,
  Compass,
  Calendar,
  Newspaper,
  Clock,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { getCityBySlug, getAllCities } from "@/lib/data/cities";
import { getCityCultureData } from "@/lib/data/city-culture";
import { AdBanner } from "@/components/ads/ad-banner";
import { getCityGuidePage } from "@/lib/data/pages";
import { getCityArticle } from "@/lib/data/articles";
import { getPublishedEvents } from "@/lib/data/events";
import { getPublishedNews } from "@/lib/data/news";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { CityQuickNav } from "@/components/cities/city-quick-nav";
import { CityCultureSection } from "@/components/cities/city-culture-section";
import { turkeyCities } from "@/data/turkey-cities";

// 24 hours ISR caching with on-demand revalidation on news/events import
export const revalidate = 86400;

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

  // Find regional cities for fallback if this city has no active events or news
  const regionalCitySlugs = turkeyCities
    .filter((c) => c.region === city.region && c.slug !== city.slug)
    .map((c) => c.slug);

  const [cityArticle, cityGuidePage, cityEvents, cityNews] = await Promise.all([
    getCityArticle(slug),
    getCityGuidePage(slug),
    getPublishedEvents({ citySlug: slug, limit: 12 }),
    getPublishedNews({ citySlug: slug, limit: 6 }),
  ]);

  // Regional fallback if city has 0 events or 0 news
  const [regionalEvents, regionalNews] = await Promise.all([
    cityEvents.length === 0 && regionalCitySlugs.length > 0
      ? getPublishedEvents({ citySlugs: regionalCitySlugs, limit: 6 })
      : Promise.resolve([]),
    cityNews.length === 0 && regionalCitySlugs.length > 0
      ? getPublishedNews({ citySlugs: regionalCitySlugs, limit: 6 })
      : Promise.resolve([]),
  ]);

  const hasGuide = Boolean(cityArticle || cityGuidePage);
  const cultureData = getCityCultureData(slug, city.name);

  const displayEvents = cityEvents.length > 0 ? cityEvents : regionalEvents;
  const isRegionalEvents = cityEvents.length === 0 && regionalEvents.length > 0;

  const displayNews = cityNews.length > 0 ? cityNews : regionalNews;
  const isRegionalNews = cityNews.length === 0 && regionalNews.length > 0;

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
              {cityEvents.length > 0 ? (
                <Badge className="bg-amber-500 text-slate-950 font-bold backdrop-blur-sm">
                  {cityEvents.length} Güncel Etkinlik
                </Badge>
              ) : isRegionalEvents ? (
                <Badge variant="outline" className="border-amber-400/60 text-amber-200 backdrop-blur-sm">
                  {regionalEvents.length} Bölgesel Etkinlik
                </Badge>
              ) : null}
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
              {cultureData?.tagline || city.description?.slice(0, 160)}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation Bar */}
      <CityQuickNav
        hasGuide={hasGuide}
        hasCulture={Boolean(cultureData)}
        hasEvents={displayEvents.length > 0}
        hasNews={displayNews.length > 0}
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

        {/* 1. ŞEHİR VEYA BÖLGESEL ETKİNLİK AJANDASI */}
        {displayEvents.length > 0 ? (
          <section id="etkinlikler" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{isRegionalEvents ? `${city.region} Bölge Ajandası` : "Şehir Ajandası"}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {isRegionalEvents
                    ? `${city.region} Bölgesi Yaklaşan Etkinlikler`
                    : `${city.name} Yaklaşan Etkinlikler`}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isRegionalEvents
                    ? `${city.name} için henüz ilan girilmedi. Yakın çevre ${city.region} illerindeki popüler kültür ve sanat takvimi:`
                    : "Konser, tiyatro, sergi ve festival takvimi."}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 text-xs font-semibold">
                <Link href={isRegionalEvents ? "/etkinlikler" : `/etkinlikler?sehir=${city.slug}`}>
                  <span>{isRegionalEvents ? "Tüm Türkiye Etkinlikleri" : `Tüm ${city.name} Etkinlikleri`}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/etkinlik/${event.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {event.eventType}
                        </Badge>
                        {event.cityName && event.citySlug !== city.slug && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            {event.cityName}
                          </Badge>
                        )}
                      </div>
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
        ) : (
          <section id="etkinlikler" className="scroll-mt-24 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-8 text-center space-y-3">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              {city.name} İçin Yaklaşan Etkinlik Bulunmuyor
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Şehirdeki kültür-sanat etkinliklerinden ilk haberdar olmak veya kendi etkinliğinizi paylaşmak için bizi takip edin.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/etkinlikler">
                  <span>Tüm Türkiye Etkinlik Takvimi</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* 2. ŞEHİR VEYA BÖLGESEL KÜLTÜR HABERLERİ */}
        {displayNews.length > 0 && (
          <section id="haberler" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <Newspaper className="h-3.5 w-3.5" />
                  <span>{isRegionalNews ? `${city.region} Bölgesi Gündemi` : "Kültür Gündemi"}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {isRegionalNews
                    ? `${city.region} Bölgesi Kültür & Sanat Haberleri`
                    : `${city.name} Kültür & Sanat Haberleri`}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Arkeolojik kazılar, tarihi restorasyonlar ve güncel kültür haberleri.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 text-xs font-semibold">
                <Link href={isRegionalNews ? "/haberler" : `/haberler?sehir=${city.slug}`}>
                  <span>{isRegionalNews ? "Tüm Haberler" : `Tüm ${city.name} Haberleri`}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayNews.map((item) => (
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {item.category}
                        </span>
                        {item.cityName && item.citySlug !== city.slug && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-muted-foreground/30">
                            {item.cityName}
                          </Badge>
                        )}
                      </div>
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

        {/* 3. KÜLTÜR BÖLÜMÜ (Edebiyat, Sinema, Müzik, Sanatçılar) */}
        {cultureData && (
          <CityCultureSection
            data={cultureData}
            cityName={city.name}
          />
        )}

        {/* 4. GEZİ REHBERİ MAKALESİ (Varsa 44 derinlemesine dosyadan biri) */}
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

        {/* Sayfa Sonu Yönlendirmeleri */}
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
