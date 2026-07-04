import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminPlaces } from "@/lib/data/admin";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlacesPage() {
  const places = await getAdminPlaces();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mekanlar</h1>
          <p className="text-muted-foreground">
            Mekanları yönetin, düzenleyin ve yeni mekanlar ekleyin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/mekanlar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Mekan
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mekan</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.map((place) => (
              <TableRow key={place.slug}>
                <TableCell className="font-medium">{place.name}</TableCell>
                <TableCell>{place.cityName}</TableCell>
                <TableCell className="capitalize">{place.source}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/yonetim/mekanlar/${place.slug}/duzenle`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </Link>
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
