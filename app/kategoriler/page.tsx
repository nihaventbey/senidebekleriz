import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Camera, TreePine, Utensils } from "lucide-react";
import { getAllCategories } from "@/lib/data/categories";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Camera,
  TreePine,
  Utensils,
};

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Mekanları kategoriye göre keşfedin. Müzeler, tarihi yerler, parklar ve daha fazlası.",
};

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Kategoriler</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          İlgi alanınıza göre mekanları keşfedin.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Landmark;
          return (
            <Link key={category.slug} href={`/kategori/${category.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4 text-xl">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
