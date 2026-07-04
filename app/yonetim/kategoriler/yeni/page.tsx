import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/admin";
import { getAdminCategoryBySlug } from "@/lib/data/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Yeni Kategori",
};

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/kategoriler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Kategori</h1>
      </div>

      <form action={createCategory} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Kategori Adı</Label>
          <Input id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="icon">İkon (Lucide ismi)</Label>
            <Input id="icon" name="icon" defaultValue="Landmark" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Renk</Label>
            <Input id="color" name="color" type="color" defaultValue="#8B5CF6" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="is_active" name="is_active" defaultChecked />
          <Label htmlFor="is_active">Aktif</Label>
        </div>

        <SubmitButton>Kaydet</SubmitButton>
      </form>
    </div>
  );
}
