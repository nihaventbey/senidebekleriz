import { Metadata } from "next";
import { getPublishedNews, getFeaturedNews } from "@/lib/data/news";
import { getAllCities } from "@/lib/data/cities";
import { NewsExplorer } from "@/components/news/news-explorer";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { NewsListJsonLd } from "@/components/seo/news-jsonld";

export const metadata: Metadata = {
  title: "Kültür & Sanat Haberleri",
  description:
    "Türkiye genelinde arkeolojik kazılar, tarihi restorasyonlar, müze açılışları, festival gelişmeleri ve güncel kültür-sanat haberleri.",
  alternates: {
    canonical: "/haberler",
  },
  openGraph: {
    title: "Kültür & Sanat Haberleri | Seni de Bekleriz",
    description:
      "Türkiye genelinde arkeoloji, tarih, restorasyon, müze ve kültür-sanat haberleri.",
    type: "website",
    url: "https://www.senidebekleriz.com/haberler",
  },
};

export const revalidate = 3600;

type Props = {
  searchParams: Promise<{ kategori?: string; sehir?: string }>;
};

export default async function NewsPage({ searchParams }: Props) {
  const { kategori, sehir } = await searchParams;
  const [allNews, featuredNews, cities] = await Promise.all([
    getPublishedNews({ limit: 60 }),
    getFeaturedNews(4),
    getAllCities(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Haberler", path: "/haberler" },
        ]}
      />
      <NewsListJsonLd articles={allNews} />

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Kültür & Sanat Haberleri
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Türkiye&apos;nin dört bir yanından arkeolojik keşifler, tarihi miras restorasyonları, müze ve sergi açılışları ile festival gündemini takip edin.
        </p>
      </div>

      <NewsExplorer
        initialNews={allNews}
        featuredNews={featuredNews}
        cities={cities}
        initialCategory={kategori || "all"}
        initialCity={sehir || "all"}
      />
    </div>
  );
}
