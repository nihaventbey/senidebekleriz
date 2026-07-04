import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePage, deletePage } from "@/lib/actions/admin";
import { getAdminPageBySlug } from "@/lib/data/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sayfa Düzenle",
};

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getAdminPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/yonetim/sayfalar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Sayfa Düzenle</h1>
        </div>
        <form action={deletePage.bind(null, page.id)}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <form
        action={updatePage.bind(null, slug)}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input id="title" name="title" defaultValue={page.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={page.slug} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">İçerik (HTML destekler)</Label>
          <Textarea
            id="content"
            name="content"
            rows={10}
            defaultValue={page.content}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Başlık</Label>
          <Input
            id="meta_title"
            name="meta_title"
            defaultValue={page.meta_title || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Açıklama</Label>
          <Textarea
            id="meta_description"
            name="meta_description"
            rows={3}
            defaultValue={page.meta_description || ""}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="is_published"
            name="is_published"
            defaultChecked={page.is_published}
          />
          <Label htmlFor="is_published">Yayında</Label>
        </div>

        <SubmitButton>Güncelle</SubmitButton>
      </form>
    </div>
  );
}
