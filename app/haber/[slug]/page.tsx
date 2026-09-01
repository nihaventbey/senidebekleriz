import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNewsBySlug,
  getRelatedNews,
  getNewsSlugs,
} from "@/lib/data/news";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { renderMarkdown } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Share2,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { NewsArticleJsonLd } from "@/components/seo/news-jsonld";
import {
  NewsCard,
  NEWS_CATEGORY_LABELS,
  NEWS_CATEGORY_COLORS,
} from "@/components/news/news-card";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((item) => ({ slug: item.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return { title: "Haber Bulunamadı" };
  }

  const categoryLabel = NEWS_CATEGORY_LABELS[news.category] || "Kültür";

  return {
    title: `${news.title} | ${categoryLabel}`,
    description: news.summary,
    alternates: {
      canonical: `/haber/${news.slug}`,
    },
    openGraph: {
      title: news.title,
      description: news.summary,
      type: "article",
      publishedTime: news.publishedAt,
      modifiedTime: news.updatedAt,
      url: `https://www.senidebekleriz.com/haber/${news.slug}`,
      images: news.coverImage ? [{ url: news.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: news.summary,
      images: news.coverImage ? [news.coverImage] : undefined,
    },
  };
}

function formatNewsDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    notFound();
  }

  const relatedNews = await getRelatedNews(news.slug, news.category, 3);
  const categoryLabel = NEWS_CATEGORY_LABELS[news.category] || "Kültür";
  const categoryColor = NEWS_CATEGORY_COLORS[news.category] || "bg-primary text-white";
  const dateStr = formatNewsDate(news.publishedAt);
  const readingTime = estimateReadingTime(news.content);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Schema.org Structured Data */}
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Haberler", path: "/haberler" },
          { name: news.title, path: `/haber/${news.slug}` },
        ]}
      />
      <NewsArticleJsonLd news={news} />

      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/haberler">
            <ChevronLeft className="h-4 w-4" />
            Tüm Haberlere Dön
          </Link>
        </Button>
      </div>

      <article className="mx-auto max-w-4xl space-y-8">
        {/* Header Area */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-semibold px-3 py-1 shadow-xs border-0 ${categoryColor}`}>
              {categoryLabel}
            </Badge>
            {news.cityName && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1 text-primary" />
                {news.cityName}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} dk okuma
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            {news.title}
          </h1>

          {news.summary && (
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed text-muted-foreground border-l-4 border-primary pl-4 py-1">
              {news.summary}
            </p>
          )}
        </header>

        {/* Cover Photo */}
        {news.coverImage && (
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-md aspect-video sm:aspect-[21/9]">
            <img
              src={news.coverImage}
              alt={news.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Markdown Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none pt-2">
          <MarkdownContent html={renderMarkdown(news.content)} />
        </div>


        {/* Source Box */}
        {(news.sourceName || news.sourceUrl) && (
          <Card className="rounded-2xl border-border/60 bg-muted/30 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Newspaper className="h-4 w-4" />
                  Haber Kaynağı
                </div>
                <p className="text-xs text-muted-foreground">
                  Bu haber <strong>{news.sourceName || "Resmi Basın Bülteni"}</strong> verileri esas alınarak editoryal olarak hazırlanmıştır.
                </p>
              </div>

              {news.sourceUrl && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-medium shrink-0">
                  <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Orijinal Kaynağı Gör
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </Card>
        )}
      </article>

      {/* Related News Section */}
      {relatedNews.length > 0 && (
        <section className="mt-16 border-t border-border/60 pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Benzer Kültür & Sanat Haberleri
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
              <Link href="/haberler">Tümünü Gör →</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
