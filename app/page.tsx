import type { ComponentType } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Landmark,
  Camera,
  TreePine,
  Utensils,
};

export default async function HomePage() {
  const cities = await getAllCities();
  const categoryList = await getAllCategories();

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient py-24 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="container relative mx-auto px-4 text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Türkiye&apos;nin Şehir Rehberi
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Türkiye&apos;yi{" "}
            <span className="text-gradient">Şehir Şehir Keşfet</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Seni de Bekleriz ile Türkiye&apos;nin en güzel şehirlerini, tarihi
            mekanlarını, lezzet duraklarını ve gizli köşelerini keşfet.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

      {/* Ad Placeholder - Header Hero altı */}
      <section className="container mx-auto px-4">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      {/* Popüler Şehirler */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Popüler Şehirler</h2>
            <p className="mt-2 text-muted-foreground">
              Türkiye&apos;nin en çok ziyaret edilen şehirlerini keşfet.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/sehirler">Tüm Şehirler</Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link key={city.slug} href={`/sehir/${city.slug}`}>
              <Card className="card-hover h-full overflow-hidden border-0 bg-gradient-to-br from-card to-muted/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="mt-5 text-xl">{city.name}</CardTitle>
                  <CardDescription className="font-medium text-primary/70">
                    {city.region}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {city.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Kategoriler */}
      <section className="container mx-auto px-4">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">
          Neye Göre Keşfetmek İstersin?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryList.map((category) => {
            const Icon = iconMap[category.icon] || Landmark;
            return (
              <Link key={category.slug} href={`/kategori/${category.slug}`}>
                <Card className="card-hover flex flex-col items-center p-6 text-center border-0 bg-gradient-to-br from-card to-muted/50 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary shadow-sm">
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
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:py-20">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight">
              Türkiye&apos;yi Keşfetmeye Başla
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              Şehirleri, mekanları ve gezi rehberlerini keşfet.
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

      {/* Ad - Footer Öncesi */}
      <section className="container mx-auto px-4">
        <AdBanner
          slot="home-footer-top"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>
    </div>
  );
}
