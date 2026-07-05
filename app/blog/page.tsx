import Link from "next/link";
import { Metadata } from "next";
import { getPublishedArticles } from "@/lib/data/articles";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogHero } from "@/components/blog/blog-hero";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Gezi Rehberi ve Yazılar",
  description:
    "Türkiye şehirleri için özgün gezi rehberleri, rota önerileri ve kültür yazıları.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const articles = await getPublishedArticles(24);

  return (
    <div>
      <BlogHero articles={articles} totalCount={articles.length} />

      <div className="container mx-auto px-4 py-10 md:py-12">
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
    </div>
  );
}
