import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCities } from "@/lib/data/cities";
import { getPlacesByCity } from "@/lib/data/places";
import { getAllPages } from "@/lib/data/pages";
import { Building2, MapPinned, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cities = await getAllCities();
  let placeCount = 0;
  for (const city of cities) {
    const places = await getPlacesByCity(city.slug);
    placeCount += places.length;
  }
  const pages = await getAllPages();

  const stats = [
    { label: "Şehir", value: cities.length, icon: Building2 },
    { label: "Mekan", value: placeCount, icon: MapPinned },
    { label: "Sayfa", value: pages.length, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platformunuzun genel durumunu buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label} Sayısı
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Hoş Geldiniz</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sol menüden şehir, mekan, kategori, sayfa ve reklam yönetimine
          ulaşabilirsiniz. Bu panel şu an için iskelet modundadır; veritabanı
          bağlantısı tamamlandıktan sonra CRUD işlemleri aktif hale gelecektir.
        </p>
      </div>
    </div>
  );
}
