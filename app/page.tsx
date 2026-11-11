import { getFeaturedNews, getPublishedNews, getNewsGroupedByCategory } from "@/lib/data/news";
import { getFeaturedEvents, getPublishedEvents } from "@/lib/data/events";
import { getPublishedArticles } from "@/lib/data/articles";
import { getPopularCities } from "@/lib/data/cities";
import { EditorialHero } from "@/components/home/editorial-hero";
import { NetflixNewsRails } from "@/components/home/netflix-news-rails";
import { HomeAgendaSection } from "@/components/home/home-agenda-section";
import { CultureGuidesSection } from "@/components/home/culture-guides-section";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { AdBanner } from "@/components/ads/ad-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 7200; // 2 hours Edge CDN caching (revalidated on-demand on content publish)

export default async function HomePage() {
  const [
    featuredNews,
    featuredEvents,
    allLatestNews,
    upcomingEvents,
    publishedArticles,
    popularCities,
    groupedNews,
  ] = await Promise.all([
    getFeaturedNews(8),
    getFeaturedEvents(8),
    getPublishedNews({ limit: 16 }),
    getPublishedEvents({ limit: 16 }),
    getPublishedArticles(6),
    getPopularCities(6),
    getNewsGroupedByCategory(8),
  ]);

  const featuredNewsIds = new Set(featuredNews.map((n) => n.id));
  const remainingNews = allLatestNews.filter((n) => !featuredNewsIds.has(n.id));
  const mansetNews = remainingNews.length > 0 ? remainingNews.slice(0, 8) : allLatestNews.slice(0, 8);

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

      {/* 1. Vitrin Slider (Büyük Alan: Haber + Etkinlik) & Manşetler (Küçük Görselli Kartlar) */}
      <EditorialHero
        featuredNews={featuredNews.length > 0 ? featuredNews : allLatestNews.slice(0, 4)}
        featuredEvents={featuredEvents}
        headlineNews={mansetNews}
        latestEvents={upcomingEvents}
      />

      {/* Reklam - Manşet Altı Banner (Reklam pasifken sıfır boşluk) */}
      <AdBanner
        slot="home-hero-bottom"
        wrapperClassName="container mx-auto px-4 py-3"
        className="min-h-[90px] w-full"
        style={{ display: "block", minHeight: "90px", width: "100%" }}
      />

      {/* 2. Netflix Tarzı Kategorik Kültür & Sanat Vitrini (Arkeoloji, Restorasyon, Sinema, Müze) */}
      <NetflixNewsRails groupedNews={groupedNews} />

      {/* 3. Kültür Dosyaları & Derinlemesine Şehir Rehberleri */}
      <CultureGuidesSection articles={publishedArticles} />

      {/* 4. 81 İl Kültür Rotası */}
      <PopularCitiesSection cities={popularCities} />

      {/* 5. Güncel Kültür Ajandası (Yaklaşan Etkinlikler - AI beslemeli) */}
      <HomeAgendaSection events={upcomingEvents} />

      {/* Reklam - Footer Öncesi Banner (Reklam pasifken sıfır boşluk) */}
      <AdBanner
        slot="home-footer-top"
        wrapperClassName="container mx-auto px-4 py-4 pb-8"
        className="min-h-[90px] w-full"
        style={{ display: "block", minHeight: "90px", width: "100%" }}
      />
    </div>
  );
}
