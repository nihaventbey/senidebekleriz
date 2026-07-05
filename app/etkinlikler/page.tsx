import Link from "next/link";
import { Metadata } from "next";
import { getPublishedEvents } from "@/lib/data/events";
import { getAllCities } from "@/lib/data/cities";
import { EventListCard } from "@/components/events/event-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Kültür Etkinlikleri",
  description:
    "Türkiye genelinde tiyatro, konser, sergi, festival ve kültür duyuruları.",
};

export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { slug: "", label: "Tümü" },
  { slug: "tiyatro", label: "Tiyatro" },
  { slug: "konser", label: "Konser" },
  { slug: "sergi", label: "Sergi" },
  { slug: "festival", label: "Festival" },
  { slug: "duyuru", label: "Duyuru" },
] as const;

type Props = {
  searchParams: Promise<{ sehir?: string; tip?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { sehir, tip } = await searchParams;
  const cities = await getAllCities();

  const events = await getPublishedEvents({
    citySlug: sehir || undefined,
    eventType:
      tip && tip !== "all"
        ? (tip as "tiyatro" | "konser" | "sergi" | "festival" | "duyuru" | "diger")
        : undefined,
    limit: 60,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Kültür Etkinlikleri
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Onaylı kaynaklardan derlenen tiyatro, konser, sergi ve festival
          duyuruları. Bilet ve detaylar için kaynak linklerine gidin.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.slug || "all"}
            href={
              f.slug
                ? `/etkinlikler?tip=${f.slug}${sehir ? `&sehir=${sehir}` : ""}`
                : `/etkinlikler${sehir ? `?sehir=${sehir}` : ""}`
            }
          >
            <Badge
              variant={(!tip && !f.slug) || tip === f.slug ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border bg-muted/20 py-16 text-center text-muted-foreground">
          Bu filtrede yayınlanmış etkinlik yok.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventListCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl border bg-muted/20 p-6">
        <h2 className="font-semibold">Şehre göre filtrele</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.slice(0, 20).map((city) => (
            <Link
              key={city.slug}
              href={`/etkinlikler?sehir=${city.slug}${tip ? `&tip=${tip}` : ""}`}
            >
              <Badge variant={sehir === city.slug ? "default" : "outline"}>
                {city.name}
              </Badge>
            </Link>
          ))}
          <Link href="/sehirler">
            <Badge variant="outline">Tüm şehirler →</Badge>
          </Link>
        </div>
      </div>
    </div>
  );
}
