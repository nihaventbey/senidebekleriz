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
  Utensils,
  TreePine,
  Camera,
  ArrowRight,
} from "lucide-react";
import { AdBanner } from "@/components/ads/ad-banner";
import { getAllCities } from "@/lib/data/cities";
import { getAllCategories } from "@/lib/data/categories";
import { SearchBar } from "@/components/layout/search-bar";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Landmark,
  Camera,
  TreePine,
  Utensils,
};

export default async function HomePage() {
  const [cities, categoryList] = await Promise.all([
    getAllCities(),
    getAllCategories(),
  ]);

  const featuredCities = cities.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient py-20 md:py-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="container relative mx-auto px-4 text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            81 İl · Binlerce Mekan
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Türkiye'yi{" "}
            <span className="text-gradient">Şehir Şehir</span> Keşfet
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Seni de Bekleriz ile Türkiye'nin en güzel şehirlerini, tarihi
            mekanlarını, lezzet duraklarını ve gizli köşelerini keşfet.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <SearchBar className="h-12 w-full text-base" />
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

      {/* Ad - Hero altı */}
      <section className="container mx-auto px-4 py-8">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      {/* Popüler Şehirler */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Popüler Şehirler
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Türkiye'nin en çok ziyaret edilen şehirlerini keşfet.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/sehirler">Tüm Şehirler</Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCities.map((city) => (
            <Link key={city.slug} href={`/sehir/${city.slug}`}>
              <Card className="card-hover h-full overflow-hidden border-border/60 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4 text-lg">{city.name}</CardTitle>
                  <p className="text-xs font-medium text-primary/70">
                    {city.region}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {city.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

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

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:py-20">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Türkiye'yi Keşfetmeye Başla
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              81 il, binlerce mekan, sınırsız keşif fırsatı.
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
