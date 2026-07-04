import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllCities } from "@/lib/data/cities";
import { getPlacesByCity } from "@/lib/data/places";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlacesPage() {
  const cities = await getAllCities();
  const placesByCity: Record<string, string> = {};
  const allPlaces = [];

  for (const city of cities) {
    placesByCity[city.slug] = city.name;
    const places = await getPlacesByCity(city.slug);
    for (const place of places) {
      allPlaces.push({ ...place, cityName: city.name });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mekanlar</h1>
          <p className="text-muted-foreground">
            Mekanları yönetin, düzenleyin ve yeni mekanlar ekleyin.
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Mekan
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mekan</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPlaces.slice(0, 50).map((place) => (
              <TableRow key={place.slug}>
                <TableCell className="font-medium">{place.name}</TableCell>
                <TableCell>{place.cityName}</TableCell>
                <TableCell>{place.category}</TableCell>
                <TableCell className="capitalize">{place.source}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled>
                    Düzenle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
