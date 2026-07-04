import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createAdPlacement } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/admin/submit-button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Yeni Reklam Birimi",
};

export default function NewAdPlacementPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/reklamlar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Reklam Birimi</h1>
      </div>

      <form
        action={createAdPlacement}
        className="space-y-6 rounded-lg border p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Birim Adı</Label>
          <Input id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Pozisyon</Label>
          <Input id="position" name="position" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad_unit_id">Ad Unit ID (AdSense slot ID)</Label>
          <Input id="ad_unit_id" name="ad_unit_id" />
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
