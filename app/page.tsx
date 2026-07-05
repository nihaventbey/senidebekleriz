import type { ComponentType } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Compass,
  Landmark,
  Palette,
  TreePine,
  Camera,
  ArrowRight,
} from "lucide-react";
import { AdBanner } from "@/components/ads/ad-banner";
import { getAllCities } from "@/lib/data/cities";
import { pickPopularCities } from "@/lib/cities/popular";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { getAllCategories } from "@/lib/data/categories";
import { getFeaturedPlaces } from "@/lib/data/places";
import { getPublishedArticles } from "@/lib/data/articles";
import { getFeaturedEvents } from "@/lib/data/events";
import { SearchBar } from "@/components/layout/search-bar";
import { PlaceImageComponent } from "@/components/place/place-image";
import { ArticleCard } from "@/components/blog/article-card";
import { CulturalEventsSlider } from "@/components/events/cultural-events-slider";

export const dynamic = "force-dynamic";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Landmark,
  Camera,
  TreePine,
  Palette,
};

export default async function HomePage() {
  const [cities, categoryList, featuredPlaces, latestArticles, featuredEvents] =
    await Promise.all([
      getAllCities(),
      getAllCategories(),
      getFeaturedPlaces(6),
      getPublishedArticles(3),
      getFeaturedEvents(8),
    ]);

  const popularCities = pickPopularCities(cities, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient py-20 md:py-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="container relative mx-auto px-4 text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            Sanat · Tarih · Kültür · Müzeler
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Türkiye'nin{" "}
            <span className="text-gradient">Kültürel Mirasını</span> Keşfet
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Seni de Bekleriz, yeme-içme rehberi değil; müzeleri, tarihi
            yerleri, sanat mekanlarını ve kültürel durakları öne çıkaran bir
            keşif platformudur.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <SearchBar variant="hero" className="h-12 w-full text-base" />
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="group" asChild>
              <Link href="/sehirler">
                <MapPin className="mr-2 h-4 w-4" />
                Şehirleri Keşfet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/50 backdrop-blur" asChild>
              <Link href="/kategoriler">
                <Compass className="mr-2 h-4 w-4" />
                Kategorilere Göz At
              </Link>
            </Button>
          </div>
        </div>
      </section>

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
                      {place.description ||
                        `${place.name}, ${place.cityName}'da görülmeye değer bir mekandır.`}
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
        </section>
      )}

      {/* Kategoriler */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold tracking-tight md:text-3xl">
          Neye Göre Keşfetmek İstersin?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryList.map((category) => {
            const Icon = iconMap[category.icon] || Landmark;
            return (
              <Link key={category.slug} href={`/kategori/${category.slug}`}>
                <Card className="card-hover flex flex-col items-center p-6 text-center border-border/60 bg-gradient-to-br from-card to-muted/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <Icon className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <h3 className="mt-5 font-semibold">{category.name}</h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform */}
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Sanat ve Tarihe Yönelen Bir Platform
            </h2>
            <p className="mt-4 text-muted-foreground">
              Yeme-içme rehberi değiliz. Müzeleri, antik kentleri, sanat
              mekanlarını ve tarihi durakları öne çıkararak insanların kültüre
              yönelmesini hedefliyoruz.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            <Link
              href="/sayfa/hakkimizda"
              className="rounded-2xl border bg-background p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <h3 className="font-semibold">Hakkımızda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Platformumuzun amacı ve odağı
              </p>
            </Link>
            <Link
              href="/sayfa/misyon"
              className="rounded-2xl border bg-background p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <h3 className="font-semibold">Misyonumuz</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Kültürel mekanları görünür kılmak
              </p>
            </Link>
            <Link
              href="/sayfa/vizyon"
              className="rounded-2xl border bg-background p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <h3 className="font-semibold">Vizyonumuz</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sanat ve tarihe ilgiyi artırmak
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:py-20">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Türkiye'yi Keşfetmeye Başla
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              81 ilde müzeler, antik kentler, sanat mekanları ve tarihi
              duraklar sizi bekliyor.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 group"
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
