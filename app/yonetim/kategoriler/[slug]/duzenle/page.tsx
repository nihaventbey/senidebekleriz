import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateCategory, deleteCategory } from "@/lib/actions/admin";
import { getAdminCategoryBySlug } from "@/lib/data/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Kategori Düzenle",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getAdminCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/yonetim/kategoriler">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Kategori Düzenle</h1>
        </div>
        <form action={deleteCategory.bind(null, category.id)}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <form
        action={updateCategory.bind(null, slug)}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Kategori Adı</Label>
          <Input id="name" name="name" defaultValue={category.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={category.slug} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="icon">İkon (Lucide ismi)</Label>
            <Input id="icon" name="icon" defaultValue={category.icon} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Renk</Label>
            <Input
              id="color"
              name="color"
              type="color"
              defaultValue={category.color || "#8B5CF6"}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            name="is_active"
            defaultChecked={category.is_active}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>

        <SubmitButton>Güncelle</SubmitButton>
      </form>
    </div>
  );
}
