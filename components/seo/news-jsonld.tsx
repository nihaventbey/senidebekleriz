import type { PublicNewsArticle } from "@/lib/data/news";

export function NewsArticleJsonLd({
  news,
  baseUrl = "https://www.senidebekleriz.com",
}: {
  news: PublicNewsArticle;
  baseUrl?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.summary || news.title,
    image: news.coverImage ? [news.coverImage] : undefined,
    datePublished: news.publishedAt,
    dateModified: news.updatedAt || news.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/haber/${news.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Seni de Bekleriz",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Seni de Bekleriz",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icon.png`,
      },
    },
    articleSection: news.category,
    inLanguage: "tr-TR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function NewsListJsonLd({
  articles,
  baseUrl = "https://www.senidebekleriz.com",
}: {
  articles: PublicNewsArticle[];
  baseUrl?: string;
}) {
  if (!articles || articles.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.slice(0, 20).map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/haber/${article.slug}`,
      name: article.title,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
