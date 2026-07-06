import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateAdPlacement, deleteAdPlacement } from "@/lib/actions/admin";
import { getAdminAdPlacementById } from "@/lib/data/admin";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
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

      <AdPlacementForm
        action={updateAdPlacement.bind(null, placement.id)}
        positionReadOnly
        defaultValues={{
          name: placement.name,
          position: placement.position,
          ad_unit_id: placement.ad_unit_id,
          ad_format: placement.ad_format,
          ad_layout_key: placement.ad_layout_key,
          is_active: placement.is_active,
        }}
      />
    </div>
  );
}
