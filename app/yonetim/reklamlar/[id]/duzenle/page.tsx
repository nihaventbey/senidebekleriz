import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateAdPlacement, deleteAdPlacement } from "@/lib/actions/admin";
import { getAdminAdPlacementById } from "@/lib/data/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reklam Birimi Düzenle",
};

export default async function EditAdPlacementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const placement = await getAdminAdPlacementById(id);

  if (!placement) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/yonetim/reklamlar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Reklam Birimi Düzenle
          </h1>
        </div>
        <form action={deleteAdPlacement.bind(null, placement.id)}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <form
        action={updateAdPlacement.bind(null, placement.id)}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Birim Adı</Label>
          <Input id="name" name="name" defaultValue={placement.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Pozisyon</Label>
          <Input
            id="position"
            name="position"
            defaultValue={placement.position}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad_unit_id">Ad Unit ID (AdSense slot ID)</Label>
          <Input
            id="ad_unit_id"
            name="ad_unit_id"
            defaultValue={placement.ad_unit_id || ""}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            name="is_active"
            defaultChecked={placement.is_active}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>

        <SubmitButton>Güncelle</SubmitButton>
      </form>
    </div>
  );
}
