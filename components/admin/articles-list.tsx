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
import { Check, EyeOff, Loader2, Pencil } from "lucide-react";
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Şehir</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const busy = isPending && pendingId === article.id;

            return (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.slug}</TableCell>
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/yonetim/yazilar/${article.slug}/duzenle`}>
                        <Pencil className="h-4 w-4" />
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
