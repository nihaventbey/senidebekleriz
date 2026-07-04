import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminArticles } from "@/lib/data/admin-articles";
import { Plus, Pencil } from "lucide-react";

export const metadata: Metadata = {
  title: "Yazılar",
};

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAdminArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Yazıları</h1>
          <p className="text-muted-foreground">
            Özgün Markdown içerikler — AdSense için editoryal yazılar.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/yazilar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Henüz yazı yok. AI taslak veya elle içerik ekleyin.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.slug}</TableCell>
                  <TableCell>{article.city_slug || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={article.is_published ? "default" : "outline"}>
                      {article.is_published ? "Yayında" : "Taslak"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/yonetim/yazilar/${article.slug}/duzenle`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
