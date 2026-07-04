import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { getAllCities } from "@/lib/data/cities";
import { AdBanner } from "@/components/ads/ad-banner";

export const metadata: Metadata = {
  title: "Şehirler",
  description:
    "Türkiye'nin 81 ilini keşfedin. İstanbul, İzmir, Ankara ve daha fazlası.",
};

const regions = [
  "Marmara",
  "Ege",
  "İç Anadolu",
  "Karadeniz",
  "Akdeniz",
  "Güneydoğu Anadolu",
  "Doğu Anadolu",
];

export default async function CitiesPage() {
  const cities = await getAllCities();

  const citiesByRegion = regions
    .map((region) => ({
      region,
      cities: cities.filter((c) => c.region === region),
    }))
    .filter((g) => g.cities.length > 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Şehirler</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Türkiye'nin {cities.length} ilini keşfetmeye başla.
        </p>
      </div>

      <div className="mb-10">
        <AdBanner
          slot="cities-top"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>

      {citiesByRegion.map(({ region, cities: regionCities }) => (
        <section key={region} className="mb-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{region}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regionCities.map((city) => (
              <Link key={city.slug} href={`/sehir/${city.slug}`}>
                <Card className="card-hover h-full border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{city.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {city.region}
                        </p>
                      </div>
                    </div>
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
      ))}

      <div className="mt-10">
        <AdBanner
          slot="cities-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>
    </div>
  );
}
