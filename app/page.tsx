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
import { MapPin, Compass, Landmark, Utensils, TreePine, Camera } from "lucide-react";
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
      <section className="relative overflow-hidden bg-muted/40 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Türkiye&apos;yi Şehir Şehir Keşfet
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Seni de Bekleriz ile Türkiye&apos;nin en güzel şehirlerini, tarihi
            mekanlarını, lezzet duraklarını ve gizli köşelerini keşfet.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sehirler">
                <MapPin className="mr-2 h-4 w-4" />
                Şehirleri Keşfet
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
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
              Şu an için İstanbul, İzmir ve Ankara&apos;yı keşfetmeye hazırız.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/sehirler">Tüm Şehirler</Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link key={city.slug} href={`/sehir/${city.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4 text-xl">{city.name}</CardTitle>
                  <CardDescription>{city.region}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
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
                <Card className="flex flex-col items-center p-6 text-center transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Icon className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="mt-4 font-semibold">{category.name}</h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Gezilecek Yerleri Sen de Kaydet
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
            Üye ol, favori mekanlarını kaydet ve kendi gezi listelerini oluştur.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            asChild
          >
            <Link href="/kayit">Hemen Başla</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
