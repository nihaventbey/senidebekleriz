import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createCity } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Yeni Şehir",
};

export default function NewCityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/sehirler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Şehir</h1>
      </div>

      <form action={createCity} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Şehir Adı</Label>
          <Input id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Bölge</Label>
          <Input id="region" name="region" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="lat">Enlem</Label>
            <Input id="lat" name="lat" type="number" step="any" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Boylam</Label>
            <Input id="lng" name="lng" type="number" step="any" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="population">Nüfus</Label>
            <Input id="population" name="population" type="number" />
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
