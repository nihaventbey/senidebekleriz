import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getAdminCities } from "@/lib/data/admin";
import { AdminCitiesList } from "@/components/admin/cities-list";
import { Plus, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const cities = await getAdminCities();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">81 İl Yönetimi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Türkiye&apos;nin 81 iline ait kültür ve turizm bilgilerini, fotoğraflarını ve rehber durumlarını yönetin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-1.5 font-semibold text-xs">
            <Link href="/yonetim/sehirler/yeni">
              <Plus className="h-4 w-4" />
              Yeni Şehir Ekle
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground py-8 text-center">Şehir listesi yükleniyor…</div>}>
        <AdminCitiesList cities={cities} />
      </Suspense>
    </div>
  );
}
