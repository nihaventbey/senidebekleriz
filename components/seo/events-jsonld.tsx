import type { PublicEvent } from "@/lib/data/events";

export function EventsJsonLd({
  events,
  baseUrl = "https://www.senidebekleriz.com",
}: {
  events: PublicEvent[];
  baseUrl?: string;
}) {
  if (!events || events.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.slice(0, 30).map((event, index) => {
      const eventSchema: Record<string, any> = {
        "@type": "Event",
        position: index + 1,
        name: event.title,
        description: event.summary || event.title,
        url: `${baseUrl}/etkinlik/${event.slug}`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      };

      if (event.coverImage) {
        eventSchema.image = [event.coverImage];
      }

      if (event.startsAt) {
        eventSchema.startDate = event.startsAt;
      }

      if (event.endsAt) {
        eventSchema.endDate = event.endsAt;
      }

      if (event.venueName || event.cityName) {
        eventSchema.location = {
          "@type": "Place",
          name: event.venueName || event.cityName || "Türkiye",
          address: {
            "@type": "PostalAddress",
            addressLocality: event.cityName || "Türkiye",
            addressCountry: "TR",
          },
        };
      }

      if (event.ticketUrl) {
        eventSchema.offers = {
          "@type": "Offer",
          url: event.ticketUrl,
          availability: "https://schema.org/InStock",
        };
      }

      return eventSchema;
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
