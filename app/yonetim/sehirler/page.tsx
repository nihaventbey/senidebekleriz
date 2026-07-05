import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getAdminCities } from "@/lib/data/admin";
import { getContentGaps } from "@/lib/data/content-gaps";
import { AdminCitiesList } from "@/components/admin/cities-list";
import { CityCoverRefreshButton } from "@/components/admin/city-cover-refresh-button";
import { CityDescriptionRefreshButton } from "@/components/admin/city-description-refresh-button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const [cities, gaps] = await Promise.all([
    getAdminCities(),
    getContentGaps(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Şehirler</h1>
          <p className="text-muted-foreground">
            Şehirleri yönetin, kapak görsellerini Wikimedia ile düzeltin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CityDescriptionRefreshButton count={gaps.citiesValilikDescription} />
          <CityCoverRefreshButton count={gaps.citiesValilikCover} />
          <Button asChild>
            <Link href="/yonetim/sehirler/yeni">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Şehir
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Yükleniyor…</div>}>
        <AdminCitiesList cities={cities} />
      </Suspense>
    </div>
  );
}
