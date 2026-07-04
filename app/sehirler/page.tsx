import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { getAllCities } from "@/lib/data/cities";

export const metadata: Metadata = {
  title: "Şehirler",
  description:
    "Türkiye'nin şehirlerini keşfedin. İstanbul, İzmir, Ankara ve daha fazlası.",
};

export default async function CitiesPage() {
  const cities = await getAllCities();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Şehirler</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Keşfetmek istediğin şehri seç ve mekanları gör.
        </p>
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
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {city.description}
                </p>
                <div className="mt-4 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {city.region}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
