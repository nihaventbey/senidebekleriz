import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { AdBanner } from "@/components/ads/ad-banner";
import { getEventBySlug, getPublishedEventSlugs, isEventExpired } from "@/lib/data/events";
import { buildBreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";
import { getCityCoordinates } from "@/lib/cities/lookup";
import { EventVenueMap } from "@/components/maps/event-venue-map";
import { CulturalCoverPlaceholder } from "@/components/ui/cultural-cover-placeholder";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Ticket,
  Clock,
} from "lucide-react";

export const revalidate = 86400;

export async function generateStaticParams() {
  const events = await getPublishedEventSlugs();
  return events.map((e) => ({ slug: e.slug }));
}

const TYPE_LABELS: Record<string, string> = {
  tiyatro: "Tiyatro",
  konser: "Konser",
  sergi: "Sergi",
  festival: "Festival",
  duyuru: "Duyuru",
  diger: "Kültür",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const title = event.metaTitle || event.title;
  const description = event.metaDescription || event.summary;

  return {
    title,
    description,
    alternates: {
      canonical: `/etkinlik/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: event.coverImage ? [{ url: event.coverImage, width: 1200 }] : [],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const dateLabel = formatDate(event.startsAt);
  const ctaUrl = event.ticketUrl || event.sourceUrl;
  const coordinates = getCityCoordinates(event.cityName || event.citySlug);

  const eventJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.metaDescription || event.summary,
      image: event.coverImage || undefined,
      startDate: event.startsAt || undefined,
      endDate: event.endsAt || undefined,
      eventStatus: "https://schema.org/EventScheduled",
      location: event.venueName
        ? {
            "@type": "Place",
            name: event.venueName,
            address: event.cityName || undefined,
          }
        : undefined,
      url: ctaUrl || undefined,
    },
    buildBreadcrumbsJsonLd([
      { name: "Ana Sayfa", path: "/" },
      { name: "Etkinlikler", path: "/etkinlikler" },
      { name: event.title, path: `/etkinlik/${event.slug}` },
    ]),
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={eventJsonLd} />

      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/etkinlikler">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tüm Etkinlikler
        </Link>
      </Button>

      {/* Cover Image or Cultural Logo Fallback Header */}
      <div className="mb-6 overflow-hidden rounded-2xl border">
        {event.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-auto max-h-[440px] w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <CulturalCoverPlaceholder
            title={event.title}
            category={TYPE_LABELS[event.eventType] || "Kültür Etkinliği"}
            cityName={event.cityName || undefined}
            className="h-[240px] sm:h-[300px] w-full"
            iconSize="lg"
          />
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>{TYPE_LABELS[event.eventType] || "Kültür"}</Badge>
        {isEventExpired(event) && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold">
            <Clock className="mr-1 h-3 w-3" />
            Geçmiş Etkinlik
          </Badge>
        )}
        {event.cityName && (
          <Badge variant="outline">
            <MapPin className="mr-1 h-3 w-3" />
            {event.cityName}
          </Badge>
        )}
      </div>

      {isEventExpired(event) && (
        <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2.5">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Bu etkinlik tamamlanmıştır. Güncel kültür ve sanat etkinliklerini keşfetmek için etkinlikler takvimini ziyaret edebilirsiniz.</span>
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        {event.title}
      </h1>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {dateLabel && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {dateLabel}
          </span>
        )}
        {event.venueName && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {event.venueName}
          </span>
        )}
      </div>

      <p className="mt-6 text-lg leading-relaxed">{event.summary}</p>

      {event.description && (
        <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
          {event.description}
        </div>
      )}

      {ctaUrl && (
        <div className="mt-8">
          <Button size="lg" asChild>
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
              {event.ticketUrl ? (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  Bilet / Detay
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Kaynağı Gör
                </>
              )}
            </a>
          </Button>
        </div>
      )}

      {/* Interactive Event Venue & Directions Map */}
      <EventVenueMap
        venueName={event.venueName}
        cityName={event.cityName}
        coordinates={coordinates}
        className="mt-10"
      />

      {event.sourceName && (
        <p className="mt-6 text-xs text-muted-foreground">
          Kaynak: {event.sourceName}
        </p>
      )}

      <div className="mt-10">
        <AdBanner
          slot="event-detail-bottom"
          className="min-h-[90px] w-full"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
        />
      </div>
    </div>
  );
}
