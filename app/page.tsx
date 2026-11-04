import { getFeaturedNews, getPublishedNews } from "@/lib/data/news";
import { getPublishedEvents } from "@/lib/data/events";
import { getPublishedArticles } from "@/lib/data/articles";
import { getPopularCities } from "@/lib/data/cities";
import { EditorialHero } from "@/components/home/editorial-hero";
import { HomeAgendaSection } from "@/components/home/home-agenda-section";
import { CultureGuidesSection } from "@/components/home/culture-guides-section";
import { CultureNewsSection } from "@/components/home/culture-news-section";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { AdBanner } from "@/components/ads/ad-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 7200; // 2 hours Edge CDN caching (revalidated on-demand on content publish)

export default async function HomePage() {
  const [featuredNews, latestNews, upcomingEvents, publishedArticles, popularCities] =
    await Promise.all([
      getFeaturedNews(4),
      getPublishedNews({ limit: 6 }),
      getPublishedEvents({ limit: 16 }),
      getPublishedArticles(6),
      getPopularCities(6),
    ]);

  const siteUrl = getSiteUrl();

  const websiteJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Seni de Bekleriz — Kültür, Sanat ve Şehir Ajandası",
      url: siteUrl,
      description:
        "Türkiye'nin güncel kültür ve sanat haberleri, sergi, tiyatro, konser ve festival etkinlik takvimi.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/etkinlikler?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: "Seni de Bekleriz",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={websiteJsonLd} />

      {/* 1. Günün Manşetleri */}
      <EditorialHero
        featuredNews={featuredNews.length > 0 ? featuredNews : latestNews}
        latestEvents={upcomingEvents}
      />

      {/* Reklam - Manşet Altı Banner */}
      <section className="container mx-auto px-4 py-2 sm:py-4">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      {/* 2. "Bu Hafta Ne Var?" Şehir & Tür Filtreli Ajanda */}
      <HomeAgendaSection events={upcomingEvents} />

      {/* 3. Kültür & Sanat Haberleri */}
      <CultureNewsSection news={latestNews} />

      {/* 4. Kültür & Şehir Rehberleri */}
      <CultureGuidesSection articles={publishedArticles} />

      {/* 5. 81 İl Kültür Rotası */}
      <PopularCitiesSection cities={popularCities} />

      {/* Reklam - Footer Öncesi Banner */}
      <section className="container mx-auto px-4 py-6 pb-12">
        <AdBanner
          slot="home-footer-top"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>
    </div>
  );
}
