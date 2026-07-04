import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createPage } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Yeni Sayfa",
};

export default function NewPagePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/sayfalar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Sayfa</h1>
      </div>

      <form action={createPage} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">İçerik (HTML destekler)</Label>
          <Textarea id="content" name="content" rows={10} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Başlık</Label>
          <Input id="meta_title" name="meta_title" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Açıklama</Label>
          <Textarea id="meta_description" name="meta_description" rows={3} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="is_published" name="is_published" defaultChecked />
          <Label htmlFor="is_published">Yayında</Label>
        </div>

        <SubmitButton>Kaydet</SubmitButton>
      </form>
    </div>
  );
}
