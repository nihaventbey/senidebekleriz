import Link from "next/link";
import { Metadata } from "next";
import { getPublishedArticlesPage } from "@/lib/data/articles";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogHero } from "@/components/blog/blog-hero";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";

export const metadata: Metadata = {
  title: "Gezi Rehberi ve Yazılar",
  description:
    "Türkiye şehirleri için özgün gezi rehberleri, rota önerileri ve kültür yazıları.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Gezi Rehberi ve Yazılar | Seni de Bekleriz",
    description:
      "Türkiye şehirleri için özgün gezi rehberleri, rota önerileri ve kültür yazıları.",
    type: "website",
  },
};

export const revalidate = 86400;

const PAGE_SIZE = 24;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { articles, total, pageSize } = await getPublishedArticlesPage(
    page,
    PAGE_SIZE
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const heroArticles =
    page === 1 ? articles : (await getPublishedArticlesPage(1, 3)).articles;

  return (
    <div>
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Gezi Rehberi", path: "/blog" },
        ]}
      />
      <BlogHero articles={heroArticles} totalCount={total} />

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

        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Yazı sayfaları"
          >
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Önceki
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Önceki
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog?page=${page + 1}`}>
                  Sonraki
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Sonraki
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </nav>
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
