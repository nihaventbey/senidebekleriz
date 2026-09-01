"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Star,
  Newspaper,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  deleteNews,
  togglePublishNews,
  toggleFeaturedNews,
} from "@/lib/actions/news";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminNewsListItem } from "@/lib/data/admin-news";
import { toast } from "@/lib/toast";
import { NEWS_CATEGORY_LABELS, NEWS_CATEGORY_COLORS } from "@/components/news/news-card";

type Props = {
  newsList: AdminNewsListItem[];
};

export function AdminNewsList({ newsList }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = newsList;

    if (statusFilter === "published") {
      list = list.filter((n) => n.is_published);
    } else if (statusFilter === "draft") {
      list = list.filter((n) => !n.is_published);
    } else if (statusFilter === "featured") {
      list = list.filter((n) => n.is_featured);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.summary && n.summary.toLowerCase().includes(q)) ||
          (n.city_slug && n.city_slug.toLowerCase().includes(q))
      );
    }

    return list;
  }, [newsList, statusFilter, searchQuery]);

  function handleTogglePublish(id: string, current: boolean) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await togglePublishNews(id, !current);
        toast.success(!current ? "Haber yayına alındı ✅" : "Haber taslağa alındı ⏸️");
        router.refresh();
      } catch (err: any) {
        toast.error("İşlem başarısız", err.message);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleToggleFeatured(id: string, current: boolean) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await toggleFeaturedNews(id, !current);
        toast.success(!current ? "Haber manşete taşındı 🔥" : "Manşetten çıkarıldı");
        router.refresh();
      } catch (err: any) {
        toast.error("İşlem başarısız", err.message);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" haberini silmek istediğinize emin misiniz?`)) return;

    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteNews(id);
        toast.success("Haber silindi 🗑️");
        router.refresh();
      } catch (err: any) {
        toast.error("Silinemedi", err.message);
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kültür & Sanat Haberleri</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Arkeoloji, restorasyon, müze ve festival haberlerinin yönetimi ve yayını.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link href="/yonetim/haberler/yeni">
              <Plus className="h-4 w-4" /> Yeni Haber Ekle
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { key: "all", label: `Tümü (${newsList.length})` },
            { key: "published", label: "Yayındakiler" },
            { key: "draft", label: "Taslaklar" },
            { key: "featured", label: "🔥 Manşetler" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Haber başlığı veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <Newspaper className="h-10 w-10 mx-auto opacity-40 mb-2" />
          <p className="text-sm font-medium">Haber bulunamadı.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[8%]">Görsel</TableHead>
                <TableHead className="w-[35%]">Başlık & Kaynak</TableHead>
                <TableHead className="w-[15%]">Kategori</TableHead>
                <TableHead className="w-[12%]">Şehir</TableHead>
                <TableHead className="w-[10%]">Durum</TableHead>
                <TableHead className="w-[20%] text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const busy = isPending && pendingId === item.id;
                const categoryLabel = NEWS_CATEGORY_LABELS[item.category as keyof typeof NEWS_CATEGORY_LABELS] || item.category;
                const categoryColor = NEWS_CATEGORY_COLORS[item.category as keyof typeof NEWS_CATEGORY_COLORS] || "bg-primary text-white";
                const cityName = getCityName(item.city_slug) || item.city_slug;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/40">
                    {/* Cover */}
                    <TableCell>
                      {item.cover_image ? (
                        <div className="relative h-12 w-16 overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={item.cover_image}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground">
                          <Newspaper className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </TableCell>

                    {/* Title */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/haber/${item.slug}`}
                          target="_blank"
                          className="hover:underline hover:text-primary font-bold line-clamp-1 max-w-[320px]"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </div>
                      {item.source_name && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[280px]">
                          Kaynak: {item.source_name}
                        </p>
                      )}
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge className={`text-[10px] font-semibold px-2 py-0.5 shadow-xs border-0 ${categoryColor}`}>
                        {categoryLabel}
                      </Badge>
                    </TableCell>

                    {/* City */}
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">
                        {cityName || "Genel"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={item.is_published ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {item.is_published ? "Yayında" : "Taslak"}
                        </Badge>
                        {item.is_featured && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300">
                            🔥 Manşet
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {/* Toggle Featured */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleToggleFeatured(item.id, item.is_featured)}
                          className={`h-7 w-7 p-0 ${item.is_featured ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                          title={item.is_featured ? "Manşetten çıkar" : "Manşete taşı"}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </Button>

                        {/* Toggle Publish */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleTogglePublish(item.id, item.is_published)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={item.is_published ? "Taslağa al" : "Yayına al"}
                        >
                          {item.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>

                        {/* Edit */}
                        <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                          <Link href={`/yonetim/haberler/${item.slug}/duzenle`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(item.id, item.title)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
