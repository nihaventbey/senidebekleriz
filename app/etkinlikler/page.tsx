import { Metadata } from "next";
import { getPublishedEvents } from "@/lib/data/events";
import { getAllCities } from "@/lib/data/cities";
import { EventsExplorer } from "@/components/events/events-explorer";
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

// 1 hour Edge CDN caching for zero Vercel invocation quota burn
export const revalidate = 3600;

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
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Schema.org SEO Breadcrumbs & Event ItemList */}
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Etkinlikler", path: "/etkinlikler" },
        ]}
      />
      <EventsJsonLd events={events} />

      {/* Interactive Explorer UI */}
      <EventsExplorer
        initialEvents={events}
        cities={cities}
        initialCity={sehir || "all"}
        initialType={tip || "all"}
      />
    </div>
  );
}
