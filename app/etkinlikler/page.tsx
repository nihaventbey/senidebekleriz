import { Metadata } from "next";
import { getPublishedEvents } from "@/lib/data/events";
import { getAllCities } from "@/lib/data/cities";
import { EventsExplorer } from "@/components/events/events-explorer";
import { TurkeyCulturalHeatmap } from "@/components/maps/turkey-cultural-heatmap";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { EventsJsonLd } from "@/components/seo/events-jsonld";

export const metadata: Metadata = {
  title: "Kültür & Sanat Etkinlikleri Takvimi",
  description:
    "Türkiye genelinde tiyatro, konser, sergi, opera, bale, festival ve kültür-sanat etkinlikleri takvimi. Tarihe ve şehre göre güncel etkinlikler.",
  alternates: {
    canonical: "/etkinlikler",
  },
  openGraph: {
    title: "Kültür & Sanat Etkinlikleri Takvimi | Seni de Bekleriz",
    description:
      "Türkiye genelinde tiyatro, konser, sergi, opera, bale, festival ve kültür-sanat etkinlikleri takvimi.",
    type: "website",
    url: "https://www.senidebekleriz.com/etkinlikler",
  },
};

// 60 seconds Edge CDN caching for fast updates
export const revalidate = 60;

type Props = {
  searchParams: Promise<{ sehir?: string; tip?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { sehir, tip } = await searchParams;
  const [events, cities] = await Promise.all([
    getPublishedEvents({
      limit: 120,
    }),
    getAllCities(),
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* Schema.org SEO Breadcrumbs & Event ItemList */}
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Etkinlikler", path: "/etkinlikler" },
        ]}
      />
      <EventsJsonLd events={events} />

      {/* 1. Interactive Turkey Cultural Heatmap */}
      <TurkeyCulturalHeatmap />

      {/* 2. Interactive Explorer UI */}
      <div className="container mx-auto px-4">
        <EventsExplorer
          initialEvents={events}
          cities={cities}
          initialCity={sehir || "all"}
          initialType={tip || "all"}
        />
      </div>
    </div>
  );
}
