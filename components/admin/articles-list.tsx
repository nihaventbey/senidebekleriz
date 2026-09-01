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
import { Check, ExternalLink, EyeOff, Loader2, Pencil, Search, MapPinned, BookOpen } from "lucide-react";
import { publishArticle, unpublishArticle } from "@/lib/actions/articles";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminArticleListItem } from "@/lib/data/admin-articles";
import { toast } from "@/lib/toast";

type Props = {
  articles: AdminArticleListItem[];
};

export function ArticlesList({ articles }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"all" | "guides" | "blog">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const cityGuides = useMemo(() => articles.filter((a) => Boolean(a.city_slug)), [articles]);
  const thematicBlogs = useMemo(() => articles.filter((a) => !a.city_slug), [articles]);

  const filteredArticles = useMemo(() => {
    let list = articles;
    if (activeTab === "guides") list = cityGuides;
    if (activeTab === "blog") list = thematicBlogs;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          (a.city_slug && a.city_slug.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, activeTab, cityGuides, thematicBlogs, searchQuery]);

  function handlePublish(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await publishArticle(id);
        toast.success("Yazı yayınlandı");
        router.refresh();
      } catch (error) {
        toast.error(
          "Yayınlanamadı",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleUnpublish(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await unpublishArticle(id);
        toast.success("Yazı taslağa alındı");
        router.refresh();
      } catch (error) {
        toast.error(
          "Taslağa alınamadı",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tümü ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "guides"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPinned className="h-3.5 w-3.5 text-primary" />
            <span>Şehir Gezi Rehberleri ({cityGuides.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "blog"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-500" />
            <span>Tematik Bloglar ({thematicBlogs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Başlık veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 pl-8 text-xs"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-muted-foreground text-sm">
          Arama kriterine uygun yazı bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="w-full min-w-[750px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Başlık</TableHead>
                <TableHead className="w-[20%]">Tür & Şehir</TableHead>
                <TableHead className="w-[22%]">Slug / Adres</TableHead>
                <TableHead className="w-[8%]">Durum</TableHead>
                <TableHead className="w-[12%] text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => {
                const busy = isPending && pendingId === article.id;
                const isGuide = Boolean(article.city_slug);
                const cityName = getCityName(article.city_slug);

                return (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[340px]" title={`${article.title} (Sitede Görüntüle)`}>
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary flex items-center gap-1.5"
                        >
                          <span className="truncate">{article.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isGuide ? (
                        <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[11px]">
                          <MapPinned className="h-2.5 w-2.5" />
                          <span>{cityName || article.city_slug} Rehberi</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[11px]">
                          <BookOpen className="h-2.5 w-2.5" />
                          <span>Tematik Blog</span>
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="truncate max-w-[220px] font-mono text-[11px] text-muted-foreground" title={article.slug}>
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {article.slug}
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={article.is_published ? "default" : "outline"} className="text-[10px]">
                        {article.is_published ? "Yayında" : "Taslak"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!article.is_published ? (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={busy}
                            onClick={() => handlePublish(article.id)}
                            title="Yayınla"
                            className="h-7 w-7 p-0"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleUnpublish(article.id)}
                            title="Taslağa al"
                            className="h-7 w-7 p-0"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild className="gap-1 h-7 px-2 text-xs">
                          <Link href={`/yonetim/yazilar/${article.slug}/duzenle`}>
                            <Pencil className="h-3 w-3 text-amber-600" />
                            <span>Düzenle</span>
                          </Link>
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
