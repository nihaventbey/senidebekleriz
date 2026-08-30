import { getAllCities } from "@/lib/data/cities";
import { MediaCurator } from "@/components/admin/media-curator";
import { ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMediaCuratorPage() {
  const cities = await getAllCities();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Görsel Kürasyon Stüdyosu
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Mekan ve şehir görsellerini hızlıca inceleyin, Google üzerinden kaliteli fotoğraflar bulun, tek tıkla yapıştırın ve kilitleyin.
          </p>
        </div>
      </div>

      <MediaCurator initialCities={cities} />
    </div>
  );
}
