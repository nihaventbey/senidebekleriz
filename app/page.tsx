import { getFeaturedNews, getPublishedNews } from "@/lib/data/news";
import { getPublishedEvents } from "@/lib/data/events";
import { EditorialHero } from "@/components/home/editorial-hero";
import { HomeAgendaSection } from "@/components/home/home-agenda-section";
import { CultureNewsSection } from "@/components/home/culture-news-section";
import { CultureNewsletterCta } from "@/components/home/culture-newsletter-cta";
import { AdBanner } from "@/components/ads/ad-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export const revalidate = 3600; // 1 hour revalidation for fresh culture news & events

export default async function HomePage() {
  const [featuredNews, latestNews, upcomingEvents] = await Promise.all([
    getFeaturedNews(4),
    getPublishedNews({ limit: 6 }),
    getPublishedEvents({ limit: 16 }),
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

      {/* 1. Günün Manşetleri & Kültür Gündemi Vitrini */}
      <EditorialHero
        featuredNews={featuredNews.length > 0 ? featuredNews : latestNews}
        latestEvents={upcomingEvents}
      />

      {/* Ad - Manşet Altı Banner */}
      <section className="container mx-auto px-4 py-4 sm:py-6">
        <AdBanner
          slot="home-hero-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </section>

      {/* 2. İnteraktif "Bu Hafta Ne Var?" Şehir & Tür Filtreli Ajanda */}
      <HomeAgendaSection events={upcomingEvents} />

      {/* 3. Kültür, Arkeoloji & Sanat Haberleri Akışı */}
      <CultureNewsSection news={latestNews} />

      {/* 4. Kültür Ajandası Topluluk & Keşif Çağrısı */}
      <CultureNewsletterCta />

      {/* Ad - Footer Öncesi Banner */}
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
