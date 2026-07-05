import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminPlacesPaginated } from "@/lib/data/admin";
import { getAllCities } from "@/lib/data/cities";
import { AdminPlacesList } from "@/components/admin/places-list";
import { Plus } from "lucide-react";

import type { PlaceGapFilter } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const GAP_FILTERS: PlaceGapFilter[] = ["no-cover", "thin", "not-indexable"];

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ gap?: string }>;
}) {
  const { gap: gapParam } = await searchParams;
  const initialGap = GAP_FILTERS.includes(gapParam as PlaceGapFilter)
    ? (gapParam as PlaceGapFilter)
    : undefined;

  const [initial, cities] = await Promise.all([
    getAdminPlacesPaginated({ page: 1, limit: PAGE_SIZE, gap: initialGap }),
    getAllCities(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mekanlar</h1>
          <p className="text-muted-foreground">
            {initial.total.toLocaleString("tr-TR")} mekan · sayfa başına{" "}
            {PAGE_SIZE} kayıt
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/mekanlar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Mekan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Mekan Listesi</CardTitle>
          <CardDescription>
            Ara, filtrele ve daha fazla yükle butonuyla kayıtları getirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminPlacesList
            initialItems={initial.items}
            initialTotal={initial.total}
            initialHasMore={initial.hasMore}
            initialGap={initialGap ?? ""}
            cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  );
}
