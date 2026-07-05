import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { resolveCategoryCoverImage } from "@/lib/data/category-images";
import { AdBanner } from "@/components/ads/ad-banner";
import { getPlacesByCategory } from "@/lib/data/places";
import { PlaceImageComponent } from "@/components/place/place-image";
import { CategoryHero } from "@/components/categories/category-hero";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} Mekanları`,
    description: `Türkiye'deki ${category.name.toLowerCase()} mekanlarını keşfedin.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const places = await getPlacesByCategory(slug);
  const cover = await resolveCategoryCoverImage(slug);

  return (
    <div>
      <CategoryHero
        slug={slug}
        name={category.name}
        description={category.description}
        coverUrl={cover?.url ?? null}
      />

      <div className="container mx-auto px-4 pb-12">
        <div className="mb-8">
          <AdBanner
            slot="category-content-top"
            className="min-h-[90px] w-full"
            style={{ display: "block", minHeight: "90px", width: "100%" }}
          />
        </div>

        {places.length === 0 ? (
          <p className="text-muted-foreground">
            Bu kategoride henüz mekan bulunmuyor.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, index) => (
            <div key={place.slug}>
              <Link href={`/mekan/${place.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative h-40 w-full bg-muted">
                    {place.is_featured && (
                      <Badge className="absolute left-3 top-3 z-10">Öne Çıkan</Badge>
                    )}
                    <PlaceImageComponent
                      wikidataId={place.wikidata_id}
                      placeName={place.name}
                      cityName={place.cityName}
                      coverImage={place.cover_image}
                      className="h-full w-full"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{place.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {place.description ||
                        `${place.name}, ${place.cityName}'da görülmeye değer bir mekandır.`}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {place.cityName}
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {(index + 1) % 6 === 0 && (
                <div className="mt-6">
                  <AdBanner
                    slot="category-list-inline"
                    className="min-h-[250px] w-full"
                    style={{
                      display: "block",
                      minHeight: "250px",
                      width: "100%",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
