import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedEvents } from "@/lib/data/events";
import type { EventType } from "@/lib/events/types";
import { getAllCities } from "@/lib/data/cities";
import { EventsExplorer } from "@/components/events/events-explorer";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { EventsJsonLd } from "@/components/seo/events-jsonld";
import { getCityName, isValidCitySlug } from "@/lib/cities/lookup";
import { turkeyCities } from "@/data/turkey-cities";

export const revalidate = 60;

export const EVENT_CATEGORY_META: Record<
  string,
  {
    title: string;
    description: string;
    typeSlug: string;
    heading: string;
    badge: string;
  }
> = {
  sergi: {
    title: "Güncel Sergi ve Müze Etkinlikleri Takvimi",
    description:
      "Türkiye genelindeki güncel resim, heykel, çağdaş sanat sergileri, müze açılışları ve galeri etkinlikleri takvimi.",
    typeSlug: "sergi",
    heading: "Sergiler & Müze Etkinlikleri",
    badge: "🎨 Sergi & Galeri",
  },
  sergiler: {
    title: "Güncel Sergi ve Müze Etkinlikleri Takvimi",
    description:
      "Türkiye genelindeki güncel resim, heykel, çağdaş sanat sergileri, müze açılışları ve galeri etkinlikleri takvimi.",
    typeSlug: "sergi",
    heading: "Sergiler & Müze Etkinlikleri",
    badge: "🎨 Sergi & Galeri",
  },
  tiyatro: {
    title: "Tiyatro Oyunları & Sahne Sanatları Takvimi",
    description:
      "Devlet Tiyatroları, Şehir Tiyatroları ve özel sahnelerin güncel tiyatro oyunları, prömiyerleri ve bilet bilgileri.",
    typeSlug: "tiyatro",
    heading: "Tiyatro & Sahne Sanatları",
    badge: "🎭 Tiyatro",
  },
  tiyatrolar: {
    title: "Tiyatro Oyunları & Sahne Sanatları Takvimi",
    description:
      "Devlet Tiyatroları, Şehir Tiyatroları ve özel sahnelerin güncel tiyatro oyunları, prömiyerleri ve bilet bilgileri.",
    typeSlug: "tiyatro",
    heading: "Tiyatro & Sahne Sanatları",
    badge: "🎭 Tiyatro",
  },
  konser: {
    title: "Konser ve Canlı Müzik Etkinlikleri Takvimi",
    description:
      "Türkiye genelinde klasik müzik, caz, senfoni ve canlı performans konser takvimi ve biletleri.",
    typeSlug: "konser",
    heading: "Konserler & Canlı Müzik",
    badge: "🎵 Konser",
  },
  konserler: {
    title: "Konser ve Canlı Müzik Etkinlikleri Takvimi",
    description:
      "Türkiye genelinde klasik müzik, caz, senfoni ve canlı performans konser takvimi ve biletleri.",
    typeSlug: "konser",
    heading: "Konserler & Canlı Müzik",
    badge: "🎵 Konser",
  },
  festival: {
    title: "Kültür Yolu & Şehir Festivalleri Takvimi",
    description:
      "Türkiye Kültür Yolu Festivalleri, film festivalleri ve kültür-sanat şenlikleri programı.",
    typeSlug: "festival",
    heading: "Festivaller & Şenlikler",
    badge: "🎪 Festival",
  },
  festivaller: {
    title: "Kültür Yolu & Şehir Festivalleri Takvimi",
    description:
      "Türkiye Kültür Yolu Festivalleri, film festivalleri ve kültür-sanat şenlikleri programı.",
    typeSlug: "festival",
    heading: "Festivaller & Şenlikler",
    badge: "🎪 Festival",
  },
};

type Props = {
  params: Promise<{ kategori: string }>;
  searchParams: Promise<{ sehir?: string; tip?: string }>;
};

export async function generateStaticParams() {
  const categorySlugs = Object.keys(EVENT_CATEGORY_META).map((kategori) => ({
    kategori,
  }));
  const popularCitySlugs = ["istanbul", "ankara", "izmir", "antalya", "bursa"].map(
    (kategori) => ({ kategori })
  );
  return [...categorySlugs, ...popularCitySlugs];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori } = await params;
  const lower = kategori.toLowerCase();

  // 1. Check if category
  if (EVENT_CATEGORY_META[lower]) {
    const meta = EVENT_CATEGORY_META[lower];
    return {
      title: meta.title,
      description: meta.description,
      alternates: {
        canonical: `/etkinlikler/${lower}`,
      },
      openGraph: {
        title: `${meta.title} | Seni de Bekleriz`,
        description: meta.description,
        type: "website",
        url: `https://www.senidebekleriz.com/etkinlikler/${lower}`,
      },
    };
  }

  // 2. Check if city
  if (isValidCitySlug(lower)) {
    const cityName = getCityName(lower) || lower;
    const title = `${cityName} Etkinlikleri & Kültür Ajandası`;
    const description = `${cityName} ilindeki güncel tiyatro, sergi, konser, festival ve kültür-sanat etkinlikleri takvimi.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/etkinlikler/${lower}`,
      },
      openGraph: {
        title: `${title} | Seni de Bekleriz`,
        description,
        type: "website",
        url: `https://www.senidebekleriz.com/etkinlikler/${lower}`,
      },
    };
  }

  return {
    title: "Kültür & Sanat Etkinlikleri Takvimi",
  };
}

export default async function EventCategoryOrCityPage({
  params,
  searchParams,
}: Props) {
  const { kategori } = await params;
  const { sehir, tip } = await searchParams;
  const lower = kategori.toLowerCase();

  const categoryMeta = EVENT_CATEGORY_META[lower];
  const isCity = isValidCitySlug(lower);
  const cityName = isCity ? getCityName(lower) : null;

  if (!categoryMeta && !isCity) {
    notFound();
  }

  const effectiveType = categoryMeta ? categoryMeta.typeSlug : (tip || "all");
  const effectiveCity = isCity ? lower : (sehir || "all");

  const [events, cities] = await Promise.all([
    getPublishedEvents({
      limit: 120,
      eventType: effectiveType !== "all" ? (effectiveType as EventType) : undefined,
      citySlug: effectiveCity !== "all" ? effectiveCity : undefined,
    }),
    getAllCities(),
  ]);

  const pageTitle = categoryMeta
    ? categoryMeta.heading
    : `${cityName} Etkinlik Ajandası`;
  const pageDescription = categoryMeta
    ? categoryMeta.description
    : `${cityName} genelinde sahnelenen tiyatro oyunları, güncel sergiler, konserler ve festivaller.`;

  return (
    <div className="space-y-8 pb-16">
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: "Etkinlikler", path: "/etkinlikler" },
          { name: pageTitle, path: `/etkinlikler/${lower}` },
        ]}
      />
      <EventsJsonLd events={events} />

      <div className="container mx-auto px-4 pt-8">
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {categoryMeta ? categoryMeta.badge : `📍 ${cityName}`}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {pageDescription}
          </p>
        </div>

        <EventsExplorer
          initialEvents={events}
          cities={cities}
          initialCity={effectiveCity}
          initialType={effectiveType}
        />
      </div>
    </div>
  );
}
