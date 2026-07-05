import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getAdminArticles } from "@/lib/data/admin-articles";
import { ArticlesList } from "@/components/admin/articles-list";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Yazılar",
};

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAdminArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Yazıları</h1>
          <p className="text-muted-foreground">
            Özgün Markdown içerikler — AdSense için editoryal yazılar.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/yazilar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Link>
        </Button>
      </div>

      <ArticlesList articles={articles} />
    </div>
  );
}
