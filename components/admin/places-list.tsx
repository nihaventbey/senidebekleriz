"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2, Pencil, Search } from "lucide-react";
import type { AdminPlaceListItem } from "@/lib/data/admin";
import { toast } from "@/lib/toast";

type CityOption = { slug: string; name: string };

type Props = {
  initialItems: AdminPlaceListItem[];
  initialTotal: number;
  initialHasMore: boolean;
  initialGap?: string;
  cities: CityOption[];
  pageSize?: number;
};

type PlacesResponse = {
  items: AdminPlaceListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export function AdminPlacesList({
  initialItems,
  initialTotal,
  initialHasMore,
  initialGap = "",
  cities,
  pageSize = 30,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [source, setSource] = useState("");
  const [gap, setGap] = useState(initialGap);
  const skipInitialFetch = useRef(true);

  const fetchPlaces = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
        });
        if (query.trim()) params.set("q", query.trim());
        if (citySlug) params.set("city", citySlug);
        if (source) params.set("source", source);
        if (gap) params.set("gap", gap);

        const res = await fetch(`/api/admin/places?${params.toString()}`);
        if (!res.ok) throw new Error("Yüklenemedi");

        const data: PlacesResponse = await res.json();
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch {
        toast.error("Mekanlar yüklenemedi", "Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    },
    [query, citySlug, source, gap, pageSize]
  );

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      fetchPlaces(1, false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, citySlug, source, gap, fetchPlaces]);

  async function loadMore() {
    if (loading || !hasMore) return;
    await fetchPlaces(page + 1, true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mekan adı ara..."
            className="pl-9"
          />
        </div>
        <Select
          value={citySlug || "all"}
          onValueChange={(value) =>
            setCitySlug(!value || value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Şehir seçin">
              {!citySlug || citySlug === "all"
                ? "Tüm Şehirler"
                : cities.find((c) => c.slug === citySlug)?.name || "Tüm Şehirler"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Şehirler</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.slug} value={city.slug}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={source || "all"}
          onValueChange={(value) =>
            setSource(!value || value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Kaynak">
              {!source || source === "all"
                ? "Tüm kaynaklar"
                : source === "manual"
                ? "Manuel"
                : source === "osm"
                ? "OSM"
                : source === "wikidata"
                ? "Wikidata"
                : "Google"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kaynaklar</SelectItem>
            <SelectItem value="manual">Manuel</SelectItem>
            <SelectItem value="osm">OSM</SelectItem>
            <SelectItem value="wikidata">Wikidata</SelectItem>
            <SelectItem value="google">Google</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={gap || "all"}
          onValueChange={(value) =>
            setGap(!value || value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full lg:w-[190px]">
            <SelectValue placeholder="İçerik boşluğu">
              {!gap || gap === "all"
                ? "Tüm mekanlar"
                : gap === "no-cover"
                ? "Görsel yok"
                : gap === "thin"
                ? "İnce içerik"
                : "İndekslenebilir değil"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm mekanlar</SelectItem>
            <SelectItem value="no-cover">Görsel yok</SelectItem>
            <SelectItem value="thin">İnce içerik</SelectItem>
            <SelectItem value="not-indexable">İndekslenebilir değil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading && items.length === 0
          ? "Yükleniyor..."
          : `${items.length.toLocaleString("tr-TR")} / ${total.toLocaleString("tr-TR")} mekan gösteriliyor`}
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mekan</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>Görsel</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {loading ? "Yükleniyor..." : "Mekan bulunamadı."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((place) => (
                <TableRow key={place.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {place.name}
                      {place.is_featured && (
                        <Badge variant="secondary" className="text-[10px]">
                          Öne çıkan
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{place.cityName}</TableCell>
                  <TableCell className="capitalize">{place.source}</TableCell>
                  <TableCell>
                    {place.hasCover ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Var
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Yok
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={place.is_active ? "default" : "outline"}>
                      {place.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/yonetim/mekanlar/${place.slug}/duzenle`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
            className="min-w-[220px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                Daha Fazla Yükle
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Tüm sonuçlar gösterildi.
        </p>
      )}
    </div>
  );
}
