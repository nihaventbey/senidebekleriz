import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAllArticleSlugs,
  getArticleBySlug,
} from "@/lib/data/articles";
import { renderMarkdown } from "@/lib/markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const html = renderMarkdown(article.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.coverImage || undefined,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />

      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tüm Yazılar
        </Link>
      </Button>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="secondary">Editör Yazısı</Badge>
            {article.citySlug && (
              <Link href={`/sehir/${article.citySlug}`}>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Şehir rehberi
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            {article.title}
          </h1>
          {article.publishedAt && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(article.publishedAt)}
            </p>
          )}
          {article.coverImage && (
            <div className="mt-8 overflow-hidden rounded-2xl">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
        </header>

        <div
          className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
