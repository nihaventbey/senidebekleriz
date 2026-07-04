import Link from "next/link";
import { Metadata } from "next";
import { getPublishedArticles } from "@/lib/data/articles";
import { ArticleCard } from "@/components/blog/article-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Gezi Rehberi ve Yazılar",
  description:
    "Türkiye şehirleri için özgün gezi rehberleri, rota önerileri ve kültür yazıları.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const articles = await getPublishedArticles(24);

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Gezi Rehberi
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Editör yazıları, şehir rotaları ve Türkiye&apos;yi keşfetmek için
          özgün içerikler.
        </p>
      </section>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            Henüz yayınlanmış yazı yok. Yakında yeni rehberler eklenecek.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href="/sehirler">
            Şehirleri Keşfet
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
