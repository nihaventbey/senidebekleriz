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
import { getAllCities } from "@/lib/data/cities";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const cities = await getAllCities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Şehirler</h1>
          <p className="text-muted-foreground">
            Şehirleri yönetin, düzenleyin ve yeni şehirler ekleyin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/sehirler/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şehir
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Şehir</TableHead>
              <TableHead>Bölge</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.map((city) => (
              <TableRow key={city.slug}>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.region}</TableCell>
                <TableCell>{city.slug}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/yonetim/sehirler/${city.slug}/duzenle`}>
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
