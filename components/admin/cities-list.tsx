"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, MapPin, Pencil, Sparkles } from "lucide-react";
import type { AdminCityListItem } from "@/lib/data/admin";
import { toast } from "@/lib/toast";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manuel",
  valilik: "Valilik",
  wikimedia: "Wikimedia",
  ai: "AI",
  import: "İçe aktarım",
};

const COVER_FILTERS = [
  { value: "", label: "Tümü" },
  { value: "valilik", label: "Valilik" },
  { value: "missing", label: "Kapaksız" },
  { value: "wikimedia", label: "Wikimedia" },
  { value: "manual", label: "Manuel" },
] as const;

type Props = {
  cities: AdminCityListItem[];
};

export function AdminCitiesList({ cities }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coverFilter = searchParams.get("cover") || "";
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return cities.filter((city) => {
      switch (coverFilter) {
        case "valilik":
          return city.cover_image_source === "valilik";
        case "missing":
          return !city.cover_image;
        case "wikimedia":
          return city.cover_image_source === "wikimedia";
        case "manual":
          return city.cover_image_source === "manual";
        default:
          return true;
      }
    });
  }, [cities, coverFilter]);

  function suggestCover(slug: string) {
    setLoadingSlug(slug);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/suggest-city-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, apply: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Güncellenemedi");
        toast.success("Kapak güncellendi", data.note || slug);
        router.refresh();
      } catch (error) {
        toast.error(
          "Kapak güncellenemedi",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setLoadingSlug(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COVER_FILTERS.map((filter) => (
          <Button
            key={filter.value || "all"}
            type="button"
            size="sm"
            variant={coverFilter === filter.value ? "default" : "outline"}
            className="rounded-full"
            asChild
          >
            <Link
              href={
                filter.value
                  ? `/yonetim/sehirler?cover=${filter.value}`
                  : "/yonetim/sehirler"
              }
            >
              {filter.label}
            </Link>
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length.toLocaleString("tr-TR")} şehir listeleniyor
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Kapak</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Bölge</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((city) => (
              <TableRow key={city.slug}>
                <TableCell>
                  <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                    {city.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={city.cover_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.region}</TableCell>
                <TableCell>
                  {city.cover_image_source &&
                  SOURCE_LABELS[city.cover_image_source] ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {SOURCE_LABELS[city.cover_image_source]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {city.cover_image_locked && (
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      Kilitli
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!city.cover_image_locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={loadingSlug === city.slug}
                        onClick={() => suggestCover(city.slug)}
                      >
                        {loadingSlug === city.slug ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-4 w-4" />
                        )}
                        Öner
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/yonetim/sehirler/${city.slug}/duzenle`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Düzenle
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
