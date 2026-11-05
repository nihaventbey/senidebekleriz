import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getAdminAdPlacements } from "@/lib/data/admin";
import { Plus } from "lucide-react";
import { AdsList } from "@/components/admin/ads-list";

export const metadata: Metadata = {
  title: "Reklam Alanları",
};

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const placements = await getAdminAdPlacements();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reklam Alanları</h1>
          <p className="text-muted-foreground text-sm">
            AdSense reklam yerleşimlerini tek tıkla veya toplu olarak aktif/pasif yapın ve yönetin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/reklamlar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Reklam Alanı
          </Link>
        </Button>
      </div>

      <AdsList placements={placements} />
    </div>
  );
}
