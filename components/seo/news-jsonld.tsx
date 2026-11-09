import { serializeJsonLd } from "@/lib/security/html";
import type { PublicNewsArticle } from "@/lib/data/news";
import { getSiteUrl } from "@/lib/agents/site";

export function NewsArticleJsonLd({
  news,
  baseUrl,
}: {
  news: PublicNewsArticle;
  baseUrl?: string;
}) {
  const effectiveBaseUrl = baseUrl || getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.summary || news.title,
    image: news.coverImage
      ? [
          {
            "@type": "ImageObject",
            url: news.coverImage,
            caption: news.title,
            representativeOfPage: true,
          },
        ]
      : undefined,
    datePublished: news.publishedAt,
    dateModified: news.updatedAt || news.publishedAt,
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${effectiveBaseUrl}/haber/${news.slug}`,
    },
    ...(news.cityName
      ? {
          contentLocation: {
            "@type": "Place",
            name: news.cityName,
            address: {
              "@type": "PostalAddress",
              addressLocality: news.cityName,
              addressCountry: "TR",
            },
          },
        }
      : {}),
    author: {
      "@type": "Organization",
      name: "Seni de Bekleriz",
      url: effectiveBaseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Seni de Bekleriz",
      logo: {
        "@type": "ImageObject",
        url: `${effectiveBaseUrl}/icon.png`,
      },
    },
    articleSection: news.category,
    inLanguage: "tr-TR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

export function NewsListJsonLd({
  articles,
  baseUrl,
}: {
  articles: PublicNewsArticle[];
  baseUrl?: string;
}) {
  if (!articles || articles.length === 0) return null;
  const effectiveBaseUrl = baseUrl || getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.slice(0, 20).map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${effectiveBaseUrl}/haber/${article.slug}`,
      name: article.title,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
