import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllArticleSlugs,
  getArticleBySlug,
} from "@/lib/data/articles";
import { renderMarkdown } from "@/lib/markdown";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleHero } from "@/components/blog/article-hero";
import { AdBanner } from "@/components/ads/ad-banner";
import { resolveArticleCoverImage } from "@/lib/articles/cover-from-content";

import { ReadingProgressBar } from "@/components/blog/reading-progress-bar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const coverUrl = resolveArticleCoverImage(
    article.coverImage,
    article.content
  );
  const html = renderMarkdown(article.content);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      image: coverUrl || undefined,
      publisher: {
        "@type": "Organization",
        name: "Seni De Bekleriz",
        logo: {
          "@type": "ImageObject",
          url: "https://www.senidebekleriz.com/icon.svg",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Ana Sayfa",
          item: "https://www.senidebekleriz.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://www.senidebekleriz.com/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: `https://www.senidebekleriz.com/blog/${article.slug}`,
        },
      ],
    },
  ];

  return (
    <div>
      <ReadingProgressBar />
      <JsonLd data={jsonLd} />

      <ArticleHero
        title={article.title}
        excerpt={article.excerpt}
        publishedAt={article.publishedAt}
        coverUrl={coverUrl}
        citySlug={article.citySlug}
        contentLength={article.content.length}
      />

      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <AdBanner
              slot="article-content-top"
              className="min-h-[90px] w-full"
              style={{ display: "block", minHeight: "90px", width: "100%" }}
            />
          </div>

          {coverUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <img
                src={coverUrl}
                alt={article.title}
                className="h-auto w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <MarkdownContent html={html} className="max-w-none" />

          <div className="mt-10">
            <AdBanner
              slot="article-content-bottom"
              className="min-h-[90px] w-full"
              style={{ display: "block", minHeight: "90px", width: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
