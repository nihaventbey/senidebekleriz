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
import { publishPage, unpublishPage } from "@/lib/actions/admin";
import type { AdminPageListItem } from "@/lib/data/admin-pages";
import { toast } from "@/lib/toast";

type Props = {
  pages: AdminPageListItem[];
};

export function PagesList({ pages }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await publishPage(id);
        toast.success("Sayfa yayınlandı");
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
        await unpublishPage(id);
        toast.success("Sayfa taslağa alındı");
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

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        Henüz sayfa yok.
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
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const busy = isPending && pendingId === page.id;

            return (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>{page.slug}</TableCell>
                <TableCell>
                  <Badge variant={page.is_published ? "default" : "outline"}>
                    {page.is_published ? "Yayında" : "Taslak"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!page.is_published ? (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() => handlePublish(page.id)}
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
                        onClick={() => handleUnpublish(page.id)}
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
                      <Link href={`/yonetim/sayfalar/${page.slug}/duzenle`}>
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
