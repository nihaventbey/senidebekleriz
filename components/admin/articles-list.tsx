"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Check, ExternalLink, EyeOff, Loader2, Pencil } from "lucide-react";
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

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        Henüz yazı yok. AI taslak veya elle içerik ekleyin.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="w-full min-w-[700px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Başlık</TableHead>
            <TableHead className="w-[30%]">Slug / Adres</TableHead>
            <TableHead className="w-[12%]">Şehir</TableHead>
            <TableHead className="w-[10%]">Durum</TableHead>
            <TableHead className="w-[13%] text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const busy = isPending && pendingId === article.id;

            return (
              <TableRow key={article.id}>
                <TableCell className="font-medium">
                  <div className="truncate max-w-[320px]" title={`${article.title} (Sitede Görüntüle)`}>
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
                  <div className="truncate max-w-[260px] font-mono text-xs text-muted-foreground" title={article.slug}>
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
                <TableCell>{getCityName(article.city_slug) || "—"}</TableCell>
                <TableCell>
                  <Badge variant={article.is_published ? "default" : "outline"}>
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
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => handleUnpublish(article.id)}
                        title="Taslağa al"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <Link href={`/yonetim/yazilar/${article.slug}/duzenle`}>
                        <Pencil className="h-3.5 w-3.5 text-amber-600" />
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
  );
}
