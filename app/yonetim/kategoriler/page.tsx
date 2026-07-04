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
import { getAllCategories } from "@/lib/data/categories";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">
            Kategorileri yönetin ve yeni kategoriler ekleyin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/kategoriler/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>İkon</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.slug}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.icon}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/yonetim/kategoriler/${category.slug}/duzenle`}>
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
