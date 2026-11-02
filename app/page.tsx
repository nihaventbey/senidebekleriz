import { getFeaturedNews, getPublishedNews } from "@/lib/data/news";
import { getPublishedEvents } from "@/lib/data/events";
import { getPublishedArticles } from "@/lib/data/articles";
import { getPopularCities } from "@/lib/data/cities";
import { TrendingTicker } from "@/components/home/trending-ticker";
import { EditorialHero } from "@/components/home/editorial-hero";
import { TrendingDossiers } from "@/components/home/trending-dossiers";
import { HomeAgendaSection } from "@/components/home/home-agenda-section";
import { CultureGuidesSection } from "@/components/home/culture-guides-section";
import { CultureNewsSection } from "@/components/home/culture-news-section";
import { PopularCitiesSection } from "@/components/home/popular-cities-section";
import { CultureNewsletterCta } from "@/components/home/culture-newsletter-cta";
import { AdBanner } from "@/components/ads/ad-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 3600; // 1 hour revalidation for fresh culture news & events

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

      {/* 1. Canlı Sıcak Gündem Bandı (Trending Topics Ticker) */}
      <TrendingTicker />

      {/* 2. Günün Manşetleri & Kültür Vitrini (Kayıp Rıhtım / Onedio Medya Hero) */}
      <EditorialHero
        featuredNews={featuredNews.length > 0 ? featuredNews : latestNews}
        latestEvents={upcomingEvents}
      />

      {/* 3. Ekşi Şeyler & Onedio Tarzı "Günün Trendleri / En Çok İlgi Çeken Kültür Dosyaları" (01 - 05) */}
      <TrendingDossiers
        articles={publishedArticles}
        news={latestNews}
      />

      {/* Reklam - Manşet Altı Banner */}
      <section className="container mx-auto px-4 py-2 sm:py-4">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      {/* 4. İnteraktif "Bu Hafta Ne Var?" Şehir & Tür Filtreli Ajanda */}
      <HomeAgendaSection events={upcomingEvents} />

      {/* 5. Kayıp Rıhtım Tarzı "Derinlemesine Kültür, Tarih & Şehir Rehberleri" */}
      <CultureGuidesSection articles={publishedArticles} />

      {/* 6. Kültür, Arkeoloji & Sanat Haberleri Akışı */}
      <CultureNewsSection news={latestNews} />

      {/* 7. 81 İl Kültür Rotası & Keşif Vitrini */}
      <PopularCitiesSection cities={popularCities} />

      {/* 8. Kültür Ajandası Topluluk & Keşif Çağrısı */}
      <CultureNewsletterCta />

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
