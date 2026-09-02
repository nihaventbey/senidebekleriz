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
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Loader2,
  X,
  Newspaper,
  Sparkles,
} from "lucide-react";
import {
  importDiscoveryAsArticle,
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
  rejectDiscovery,
} from "@/lib/actions/discovery";
import { getCityName } from "@/lib/cities/lookup";
import type { AdminDiscoveryListItem } from "@/lib/data/admin-discovery";
import { toast } from "@/lib/toast";

const TYPE_LABELS: Record<string, string> = {
  news: "📰 Haber",
  event: "🎭 Etkinlik",
  article: "🗺️ Gezi / Rehber",
  unknown: "Belirsiz",
};

type Props = {
  items: AdminDiscoveryListItem[];
  filter?: string;
};

export function DiscoveryList({ items, filter }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    id: string,
    action: "news" | "event" | "article" | "reject",
    fn: () => Promise<{ slug: string } | void>
  ) {
    setPendingId(id);
    setPendingAction(action);
    startTransition(async () => {
      try {
        const result = await fn();
        if (action === "reject") {
          toast.success("Keşif kaydı reddedildi");
          router.refresh();
          return;
        }
        if (result && typeof result === "object" && "slug" in result) {
          const slug = (result as { slug: string }).slug;
          if (action === "news") {
            toast.success("Kültür haberi taslağı oluşturuldu! 📰");
            router.push(`/yonetim/haberler/${slug}/duzenle`);
          } else if (action === "article") {
            toast.success("Gezi rehberi taslağı oluşturuldu! 🗺️");
            router.push(`/yonetim/yazilar/${slug}/duzenle`);
          } else {
            toast.success("Etkinlik taslağı oluşturuldu! 🎭");
            router.push(`/yonetim/etkinlikler/${slug}/duzenle`);
          }
        }
      } catch (error) {
        toast.error(
          "İşlem başarısız",
          error instanceof Error ? error.message : undefined
        );
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
        <Sparkles className="h-10 w-10 mx-auto opacity-40 mb-2 text-primary" />
        <p className="text-sm font-medium">
          {filter === "pending_review"
            ? "Onay bekleyen keşif bulunmuyor. 'Şimdi Tara & Keşfet' butonunu kullanarak yeni içerik çekebilirsiniz."
            : "Henüz keşfedilen içerik yok."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
      <Table className="w-full min-w-[850px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[42%]">Başlık & Özet</TableHead>
            <TableHead className="w-[11%]">Önerilen Tür</TableHead>
            <TableHead className="w-[11%]">Şehir</TableHead>
            <TableHead className="w-[13%]">Kaynak</TableHead>
            <TableHead className="w-[23%] text-right">AI İle İçe Aktar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const busy = isPending && pendingId === item.id;
            const formattedTitle =
              item.title.length > 85
                ? `${item.title.slice(0, 85).trim()}...`
                : item.title;
            const formattedSnippet =
              item.snippet && item.snippet.length > 120
                ? `${item.snippet.slice(0, 120).trim()}...`
                : item.snippet;

            return (
              <TableRow key={item.id} className="hover:bg-muted/40">
                <TableCell className="max-w-[400px] overflow-hidden py-3">
                  <div className="space-y-1">
                    <p
                      className="font-bold text-sm leading-snug line-clamp-2 break-words text-foreground"
                      title={item.title}
                    >
                      {formattedTitle}
                    </p>
                    {formattedSnippet && (
                      <p
                        className="line-clamp-2 text-xs text-muted-foreground break-words leading-relaxed"
                        title={item.snippet || undefined}
                      >
                        {formattedSnippet}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[11px] font-medium whitespace-nowrap">
                    {TYPE_LABELS[item.content_type] || item.content_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-medium truncate block">
                    {getCityName(item.city_slug) || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline truncate max-w-[120px]"
                    title={item.source_name || item.source_url}
                  >
                    <span className="truncate">{item.source_name || "Kaynak"}</span>
                    <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {item.status === "pending_review" ? (
                    <div className="flex justify-end items-center gap-1.5">
                      {/* 1. News Button */}
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "news", () =>
                            importDiscoveryAsNews(item.id)
                          )
                        }
                        className="h-7 px-2 text-[11px] font-semibold gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                        title="Kültür Haberi Olarak AI ile Üret"
                      >
                        {busy && pendingAction === "news" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Newspaper className="h-3.5 w-3.5" />
                        )}
                        <span>Haber</span>
                      </Button>

                      {/* 2. Event Button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "event", () =>
                            importDiscoveryAsEvent(item.id)
                          )
                        }
                        className="h-7 px-2 text-[11px] font-semibold gap-1"
                        title="Etkinlik Olarak AI ile Aktar"
                      >
                        {busy && pendingAction === "event" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CalendarDays className="h-3.5 w-3.5" />
                        )}
                        <span>Etkinlik</span>
                      </Button>

                      {/* 3. Article / Guide Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "article", () =>
                            importDiscoveryAsArticle(item.id)
                          )
                        }
                        className="h-7 px-2 text-[11px] font-semibold gap-1"
                        title="Gezi Rehberi / Blog Olarak AI ile Üret"
                      >
                        {busy && pendingAction === "article" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5" />
                        )}
                        <span>Rehber</span>
                      </Button>

                      {/* 4. Reject Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          runAction(item.id, "reject", () =>
                            rejectDiscovery(item.id)
                          )
                        }
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Reddet / Yoksay"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Badge
                        variant={item.status === "imported" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {item.status === "imported" ? "İçe Aktarıldı" : "Reddedildi"}
                      </Badge>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
