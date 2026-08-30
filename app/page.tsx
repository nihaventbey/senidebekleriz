import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Compass, ArrowRight } from "lucide-react";
import { AdBanner } from "@/components/ads/ad-banner";
import { getAllCities } from "@/lib/data/cities";
import { pickPopularCities } from "@/lib/cities/popular";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { TurkeyInteractiveMap } from "@/components/home/turkey-map";
import { PremiumHeroSection } from "@/components/home/hero-section";
import { DiscoverCategoriesSection } from "@/components/home/discover-categories-section";
import { MissionVisionSection } from "@/components/home/mission-vision-section";
import { getAllCategories } from "@/lib/data/categories";
import { getFeaturedPlaces } from "@/lib/data/places";
import { getPublishedArticles } from "@/lib/data/articles";
import { getFeaturedEvents } from "@/lib/data/events";
import { getHeroSettings } from "@/lib/data/site-settings";
import { HeroBackground } from "@/components/home/hero-background";
import { SearchBar } from "@/components/layout/search-bar";
import { PlaceImageComponent } from "@/components/place/place-image";
import { ArticleCard } from "@/components/blog/article-card";
import { CulturalEventsSlider } from "@/components/events/cultural-events-slider";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 86400;

export default async function HomePage() {
  const [
    cities,
    categoryList,
    featuredPlaces,
    latestArticles,
    featuredEvents,
    heroSettings,
  ] = await Promise.all([
    getAllCities(),
    getAllCategories(),
    getFeaturedPlaces(6),
    getPublishedArticles(3),
    getFeaturedEvents(8),
    getHeroSettings(),
  ]);

  const siteUrl = getSiteUrl();

  const websiteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Seni de Bekleriz",
      url: siteUrl,
      description:
        "Türkiye'nin müzeleri, tarihi yerleri, sanat mekanları ve kültürel durakları.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/sehirler?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Seni de Bekleriz",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
    },
  ];

  const popularCities = pickPopularCities(cities, 6);
  const heroActive = heroSettings.enabled && Boolean(heroSettings.imageUrl);
  const heroOnDark = heroActive && heroSettings.overlayTone === "dark";

  return (
    <div className="flex flex-col">
      <JsonLd data={websiteJsonLd} />
      <PremiumHeroSection heroSettings={heroSettings} />

      <CulturalEventsSlider events={featuredEvents} />

      {/* Ad - Hero altı */}
      <section className="container mx-auto px-4 py-8">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      <PopularCitiesSection cities={popularCities} />

      <TurkeyInteractiveMap />

      {featuredPlaces.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Öne Çıkan Mekanlar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Editör seçimi mekanları keşfet.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPlaces.map((place) => (
              <Link key={place.slug} href={`/mekan/${place.slug}`}>
                <Card className="card-hover h-full overflow-hidden border-border/60">
                  <div className="relative h-40 w-full bg-muted">
                    <PlaceImageComponent
                      wikidataId={place.wikidata_id}
                      placeName={place.name}
                      cityName={place.cityName}
                      coverImage={place.cover_image}
                      className="h-full w-full"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{place.name}</CardTitle>
                    <p className="text-xs font-medium text-primary/70">
                      {place.cityName}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {place.description?.trim() || place.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Gezi Rehberi
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Editör yazıları ve özgün rota önerileri.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/blog">Tüm Yazılar</Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/blog">Tüm Yazılar</Link>
            </Button>
          </div>
        </section>
      )}

      <DiscoverCategoriesSection categories={categoryList} />

      <MissionVisionSection />

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl px-4 py-10 text-center text-white sm:rounded-3xl sm:px-6 sm:py-14 md:py-20">
          <div
            aria-hidden
            className="bg-pan-tour absolute inset-0"
            style={{ backgroundImage: "url(/images/turkiye-kolaj.webp)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/40" />
          <div className="relative">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Türkiye'yi Keşfetmeye Başla
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              81 ilde müzeler, antik kentler, sanat mekanları ve tarihi
              duraklar sizi bekliyor.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 w-full group sm:mt-8 sm:w-auto"
              asChild
            >
              <Link href="/sehirler">
                Hemen Keşfet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Ad - Footer öncesi */}
      <section className="container mx-auto px-4 py-8 pb-16">
        <AdBanner
          slot="home-footer-top"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>
    </div>
  );
}
